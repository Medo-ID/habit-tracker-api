import { db } from './connection.ts'
import { users, habits, entries, tags, habitTags } from './schema.ts'

export const seed = async () => {
  console.log('🌱 Start database seed....')
  try {
    console.log('🧹 Clearing existing data....')
    await db.delete(entries)
    await db.delete(habitTags)
    await db.delete(habits)
    await db.delete(tags)
    await db.delete(users)

    console.log('👤 Creating demo user....')
    const [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@user.com',
        password: 'password',
        firstName: 'demo',
        lastName: 'bemo',
        username: 'demo99',
      })
      .returning()

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
    console.log('User credentials:')
    console.log(`email: ${demoUser.email}`)
    console.log(`username: ${demoUser.username}`)
    console.log(`password: ${demoUser.password}`)
  } catch (error) {
    console.error('❌ DB seed failed', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => process.exit(1))
}
