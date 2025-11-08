import type { AuthenticatedRequest } from '../middlewares/auth.ts'
import type { Response } from 'express'
import { db } from '../db/connection.ts'
import { habits, entries, habitTags } from '../db/schema.ts'
import { eq, and, desc } from 'drizzle-orm'

export async function createHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, frequency, targetCount, tagIds } = req.body
    const userId = req.user!.id

    const result = await db.transaction(async (tx) => {
      const [newHabit] = await tx
        .insert(habits)
        .values({
          userId,
          name,
          description,
          frequency,
          targetCount,
        })
        .returning()

      if (tagIds && tagIds.length > 0) {
        const habitTagValues = tagIds.map((tagId: string) => ({
          habitId: newHabit.id,
          tagId,
        }))
        await tx.insert(habitTags).values(habitTagValues)
      }

      return newHabit
    })

    res.status(201).json({
      message: 'Habit created',
      habit: result,
    })
  } catch (error) {
    console.error('Create habit error', error)
    res.status(500).json({ error: 'Failed to create habit' })
  }
}

export async function getUserHabits(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id
    const userHabitsWithTags = await db.query.habits.findMany({
      where: eq(habits.userId, userId),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(habits.createdAt)],
    })
    // Transform the data to include tags directly
    const habitsWithTags = userHabitsWithTags.map((habit) => ({
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined, // Remove intermediate relation
    }))

    res.json({
      habits: habitsWithTags,
    })
  } catch (error) {
    console.error('Get habits error', error)
    res.status(500).json({ error: 'failed to fetch habits' })
  }
}

export async function getHabitById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, id), eq(habits.userId, userId)),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
        entries: {
          orderBy: [desc(entries.completionDate)],
          limit: 10,
        },
      },
    })

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    // Transform the data
    const habitWithTags = {
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined,
    }

    res.json({
      habit: habitWithTags,
    })
  } catch (error) {
    console.error('Get habit error:', error)
    res.status(500).json({ error: 'Failed to fetch habit' })
  }
}

export async function updateHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { tagIds, ...updates } = req.body

    const result = await db.transaction(async (tx) => {
      const [updatedHabit] = await tx
        .update(habits)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(habits.id, id), eq(habits.userId, userId)))
        .returning()

      if (!updatedHabit) {
        throw new Error('Habit not found')
      }

      // If tagIds are provided, update the associations
      if (tagIds !== undefined) {
        // Remove existing tags
        await tx.delete(habitTags).where(eq(habitTags.habitId, id))

        // Add new tags
        if (tagIds.length > 0) {
          const habitTagValues = tagIds.map((tagId: string) => ({
            habitId: id,
            tagId,
          }))
          await tx.insert(habitTags).values(habitTagValues)
        }
      }

      return updatedHabit
    })

    res.json({
      message: 'Habit updated successfully',
      habit: result,
    })
  } catch (error: any) {
    if (error.message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' })
    }
    console.error('Update habit error:', error)
    res.status(500).json({ error: 'Failed to update habit' })
  }
}

export async function logHabitCompletion(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { habitId } = req.params
    const { note } = req.body
    const userId = req.user!.id

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    const [newLog] = await db
      .insert(entries)
      .values({
        habitId,
        completionDate: new Date(),
        note,
      })
      .returning()

    res.status(201).json({
      message: 'Habit completion logged',
      log: newLog,
    })
  } catch (error) {
    console.error('Log habit completion error:', error)
    res.status(500).json({ error: 'Failed to log habit completion' })
  }
}

export async function completeHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id
    const habitId = req.params.id
    const { note } = req.body

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    if (!habit.isActive) {
      return res
        .status(400)
        .json({ error: 'Can not complete an inactive habit' })
    }

    const [newEntry] = await db
      .insert(entries)
      .values({
        habitId,
        completionDate: new Date(),
        note,
      })
      .returning()

    res.json({ message: 'Habit completed', entry: newEntry })
  } catch (error) {
    console.error('Complete habit error', error)
    res.status(500).json({ error: 'Failed to complete habit' })
  }
}

export async function addTagsToHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id
    const habitId = req.params.id
    const { tagIds } = req.body

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    const existingHabitTags = await db
      .select()
      .from(habitTags)
      .where(eq(habitTags.habitId, habitId))

    const existingTags = existingHabitTags.map((ht) => ht.tagId)
    const newTagIds = tagIds.filter((id: string) => !existingTags.includes(id))

    if (newTagIds.length > 0) {
      const habitTagsValues = newTagIds.map((tagId: string) => ({
        habitId,
        tagId,
      }))
      await db.insert(habitTags).values(habitTagsValues)
    }

    res.json({ message: 'Tags added to habit' })
  } catch (error) {
    console.error('Add tags to habit error', error)
    res.status(500).json({ error: 'Failed to add tags to habit' })
  }
}

export async function removeTagFromHabit(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id, tagId } = req.params
    const userId = req.user!.id

    // Verify habit belongs to user
    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    // Remove the tag association
    await db
      .delete(habitTags)
      .where(and(eq(habitTags.habitId, id), eq(habitTags.tagId, tagId)))

    res.json({
      message: 'Tag removed from habit',
    })
  } catch (error) {
    console.error('Remove tag from habit error:', error)
    res.status(500).json({ error: 'Failed to remove tag from habit' })
  }
}

export async function deleteHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const [deletedHabit] = await db
      .delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning()

    if (!deletedHabit) {
      return res.status(404).json({ error: 'Habit not found' })
    }

    res.json({ message: 'Habit deleted successfully' })
  } catch (error) {
    console.error('Delete habit error:', error)
    res.status(500).json({ error: 'Failed to delete habit' })
  }
}
