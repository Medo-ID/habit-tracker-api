import { generateTokens } from '../utils/jwt.ts'
import { hashPassword } from '../utils/password.ts'
import { db } from './connection.ts'
import {
  users,
  habits,
  entries,
  tags,
  habitTags,
  refreshTokens,
} from './schema.ts'

export const seed = async () => {
  console.log('🌱 Starting database seeding...')

  try {
    // ──────────────────────────────
    // 1️⃣ CLEAR EXISTING DATA
    // ──────────────────────────────
    console.log('🧹 Clearing old data...')
    await db.delete(entries)
    await db.delete(habitTags)
    await db.delete(habits)
    await db.delete(tags)
    await db.delete(refreshTokens)
    await db.delete(users)

    // ──────────────────────────────
    // 2️⃣ CREATE USERS
    // ──────────────────────────────
    console.log('👤 Creating users...')
    const rawUsers = [
      {
        email: 'demo@user.com',
        username: 'demo99',
        password: 'Demo123@',
        firstName: 'Demo',
        lastName: 'User',
      },
      {
        email: 'john@user.com',
        username: 'johnDoe',
        password: 'John123@',
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        email: 'sarah@user.com',
        username: 'sarahJane',
        password: 'Sarah123@',
        firstName: 'Sarah',
        lastName: 'Jane',
      },
    ]

    const userRecords = []
    for (const u of rawUsers) {
      const hashedPassword = await hashPassword(u.password)
      const [user] = await db
        .insert(users)
        .values({
          email: u.email,
          username: u.username,
          password: hashedPassword,
          firstName: u.firstName,
          lastName: u.lastName,
        })
        .returning()

      const { refreshToken } = await generateTokens({
        id: user.id,
        email: user.email,
        username: user.username,
      })

      await db.insert(refreshTokens).values({
        userId: user.id,
        refreshToken,
      })

      userRecords.push(user)
    }

    // ──────────────────────────────
    // 3️⃣ CREATE TAGS
    // ──────────────────────────────
    console.log('🏷️ Creating tags...')
    const tagData = [
      { name: 'Health', color: '#f4bf3a' },
      { name: 'Productivity', color: '#36b37e' },
      { name: 'Mindfulness', color: '#4c9aff' },
      { name: 'Learning', color: '#ff5630' },
    ]

    const insertedTags = await db.insert(tags).values(tagData).returning()

    // ──────────────────────────────
    // 4️⃣ CREATE HABITS
    // ──────────────────────────────
    console.log('💪 Creating habits...')
    const habitData = [
      {
        name: 'Exercise',
        description: 'Daily workout routine',
        frequency: 'daily',
        targetCount: 1,
      },
      {
        name: 'Read a book',
        description: 'Read 20 pages of a book',
        frequency: 'daily',
        targetCount: 1,
      },
      {
        name: 'Meditate',
        description: 'Spend 10 minutes meditating',
        frequency: 'daily',
        targetCount: 1,
      },
      {
        name: 'Weekly Review',
        description: 'Reflect and plan for the week',
        frequency: 'weekly',
        targetCount: 1,
      },
    ]

    const allHabits = []
    for (const user of userRecords) {
      for (const h of habitData) {
        const [habit] = await db
          .insert(habits)
          .values({
            userId: user.id,
            name: h.name,
            description: h.description,
            frequency: h.frequency as any,
            targetCount: h.targetCount,
          })
          .returning()
        allHabits.push(habit)
      }
    }

    // ──────────────────────────────
    // 5️⃣ ATTACH TAGS TO HABITS
    // ──────────────────────────────
    console.log('🔗 Linking habits and tags...')
    for (const habit of allHabits) {
      const randomTag =
        insertedTags[Math.floor(Math.random() * insertedTags.length)]
      await db.insert(habitTags).values({
        habitId: habit.id,
        tagId: randomTag.id,
      })
    }

    // ──────────────────────────────
    // 6️⃣ CREATE ENTRIES FOR HABITS
    // ──────────────────────────────
    console.log('📅 Creating completion entries...')
    const today = new Date()
    today.setHours(10, 0, 0, 0)

    for (const habit of allHabits) {
      const entryCount =
        habit.frequency === 'weekly' ? 4 : habit.frequency === 'monthly' ? 2 : 7 // daily

      for (let i = 0; i < entryCount; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        await db.insert(entries).values({
          habitId: habit.id,
          completionDate: date,
          note: `Completed ${habit.name} on ${date.toDateString()}`,
        })
      }
    }

    // ──────────────────────────────
    // 7️⃣ DONE
    // ──────────────────────────────
    console.log('✅ Database seeded successfully!\n')
    console.table(
      userRecords.map((u) => ({
        email: u.email,
        username: u.username,
        password: rawUsers.find((x) => x.email === u.email)?.password,
      }))
    )
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

// Allow running directly via `bun seed.ts` or `ts-node seed.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
