import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middlewares/auth.ts'
import { db } from '../db/connection.ts'
import { habits, habitTags, tags } from '../db/schema.ts'
import { and, eq } from 'drizzle-orm'

export async function createTag(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, color } = req.body
    const isExists = await db.query.tags.findFirst({
      where: eq(tags.name, name),
    })

    if (isExists) {
      return res
        .status(409)
        .json({ error: 'Tag with this name already exists' })
    }

    const [newTag] = await db
      .insert(tags)
      .values({ name, color: color || '#989da7' })
      .returning()

    res.status(201).json({ message: 'Tag created', tag: newTag })
  } catch (error) {
    console.error('Create tag error', error)
    res.status(500).json({ error: 'Failed to create new tag' })
  }
}

export async function getTags(req: AuthenticatedRequest, res: Response) {
  try {
    const allTags = await db.select().from(tags).orderBy(tags.name)
    if (allTags.length === 0) {
      return res
        .status(200)
        .json({ message: 'Tags collection is empty, try to create one' })
    }
    res.status(200).json({ tags: allTags })
  } catch (error) {
    console.error('Fetch all tags error', error)
    res.status(500).json({ error: 'Failed to get all tags' })
  }
}

export async function getTagById(req: AuthenticatedRequest, res: Response) {
  try {
    const tagId = req.params.id

    const existsTag = await db.query.tags.findFirst({
      where: eq(tags.id, tagId),
      with: {
        habitTags: {
          with: {
            habit: {
              columns: {
                id: true,
                name: true,
                description: true,
                isActive: true,
              },
            },
          },
        },
      },
    })

    if (!existsTag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    res.json({ tag: existsTag })
  } catch (error) {
    console.error('Get tag by id error', error)
    res.status(500).json({ error: 'Failed to get tag by id' })
  }
}

export async function updateTag(req: AuthenticatedRequest, res: Response) {
  try {
    const tagId = req.params.id
    const { name, color } = req.body

    if (name) {
      const existsTag = await db.query.tags.findFirst({
        where: eq(tags.id, tagId),
      })

      if (!existsTag) {
        return res.status(404).json({ error: 'Tag name does not exists' })
      }
    }

    const [updatedTag] = await db
      .update(tags)
      .set({
        ...(name && { name }),
        ...(color && { color }),
        updatedAt: new Date(),
      })
      .where(eq(tags.id, tagId))
      .returning()

    if (!updatedTag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    res.status(201).json({ message: 'Tag updated', tag: updatedTag })
  } catch (error) {
    console.error('Update tag error', error)
    res.status(500).json({ error: 'Failed to updated tag' })
  }
}

export async function deleteTag(req: AuthenticatedRequest, res: Response) {
  try {
    const tagId = req.params.id
    const [deletedTag] = await db
      .delete(tags)
      .where(eq(tags.id, tagId))
      .returning()

    if (!deletedTag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    res.status(201).json({ message: 'Tag deleted', tag: deletedTag })
  } catch (error) {
    console.error('Delete tag error', error)
    res.status(500).json({ error: 'Failed to delete tag' })
  }
}

export async function popularTags(req: AuthenticatedRequest, res: Response) {
  try {
    const tagsWithCount = await db.query.tags.findMany({
      with: {
        habitTags: true,
      },
    })

    const popularTags = tagsWithCount
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        usageCount: tag.habitTags.length,
        createdAt: tag.createdAt,
        updateAt: tag.updatedAt,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)

    res.json({ tags: popularTags })
  } catch (error) {
    console.error('Get popular tags error', error)
    res.status(500).json({ error: 'Failed to get popular tags' })
  }
}

export async function getTagHabits(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id
    const tagId = req.params.id

    const existsTag = await db.query.tags.findFirst({
      where: eq(tags.id, tagId),
    })

    if (!existsTag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    const tagHabits = await db
      .select({
        id: habits.id,
        name: habits.name,
        description: habits.description,
        frequency: habits.frequency,
        targetCount: habits.targetCount,
        isActive: habits.isActive,
        createdAt: habits.createdAt,
        updateAt: habits.updatedAt,
      })
      .from(habits)
      .innerJoin(habitTags, eq(habits.id, habitTags.habitId))
      .where(and(eq(habits.userId, userId), eq(habitTags.tagId, tagId)))

    if (tagHabits.length === 0) {
      return res
        .status(200)
        .json({ message: 'No habits created with this tag yet' })
    }

    res.json({
      tag: existsTag.name,
      habits: tagHabits,
    })
  } catch (error) {
    console.error('Get habits for specific tag', error)
    res.status(500).json({ error: 'Failed to fetch habits for this tag' })
  }
}
