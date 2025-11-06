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
  console.log('🌱 Start database seed....')
  try {
    console.log('🧹 Clearing existing data....')
    await db.delete(entries)
    await db.delete(habitTags)
    await db.delete(habits)
    await db.delete(tags)
    await db.delete(refreshTokens)
    await db.delete(users)

    console.log('👤 Creating demo user....')
    const hashedPassword = await hashPassword('Demo123@')
    const [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@user.com',
        password: hashedPassword,
        username: 'demo99',
        firstName: 'demo',
        lastName: 'bemo',
      })
      .returning()

    const { refreshToken } = await generateTokens({
      id: demoUser.id,
      email: demoUser.email,
      username: demoUser.username,
    })
    await db.insert(refreshTokens).values({
      userId: demoUser.id,
      refreshToken,
    })

    console.log('🏷️ Creating tags....')
    const [healthTag] = await db
      .insert(tags)
      .values({ name: 'Health', color: '#f4bf3a' })
      .returning()

    console.log('🐥 Creating habit....')
    const [exerciseHabit] = await db
      .insert(habits)
      .values({
        userId: demoUser.id,
        name: 'Exercise',
        description: 'Daily workout',
        frequency: 'daily',
        targetCount: 1,
      })
      .returning()

    console.log('😊 Inserting habit and its tag....')
    await db.insert(habitTags).values({
      habitId: exerciseHabit.id,
      tagId: healthTag.id,
    })

    console.log('💯 Adding completion entries....')
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      await db.insert(entries).values({
        habitId: exerciseHabit.id,
        completionDate: date,
      })
    }

    console.log('✅ DB seeded successfully')
    console.log('🔑 Login Credentials:')
    console.log('email: demo@user.com')
    console.log('password: Demo123@')
  } catch (error) {
    console.error('❌ DB seed failed', error)
    throw error
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
