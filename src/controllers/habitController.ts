import type { AuthenticatedRequest } from '../middlewares/auth.ts'
import type { Response } from 'express'
import { db } from '../db/connection.ts'
import { habits, entries, habitTags, tags } from '../db/schema.ts'
import { eq, and, desc, inArray } from 'drizzle-orm'

export async function createHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, frequency, targetCount, tagIds } = req.body
    const userId = req.user!.id
    // start transaction for data consistency
    const result = await db.transaction(async (tx) => {
      // create habit
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

      // If tags are provided, create the associations
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
    // habits with their tags for current user
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

export const getHabitById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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
          limit: 10, // Recent entries only
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

export const updateHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { tagIds, ...updates } = req.body

    const result = await db.transaction(async (tx) => {
      // Update the habit
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

export const deleteHabit = async (req: AuthenticatedRequest, res: Response) => {
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
