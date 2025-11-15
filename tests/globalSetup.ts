import { sql } from 'drizzle-orm'
import { db } from '../src/db/connection.ts'
import {
  entries,
  habits,
  habitTags,
  refreshTokens,
  tags,
  users,
} from '../src/db/schema.ts'
import { execSync } from 'node:child_process'

export async function setup() {
  console.log('🗃️ Setting up database....')

  try {
    // Drop all tables if they exist to ensure clean state
    await db.execute(sql`DROP TABLE IF EXISTS ${entries} CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS ${habitTags} CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS ${habits} CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS ${tags} CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS ${refreshTokens} CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS ${users} CASCADE`)

    // Use drizzle-kit CLI to push schema to database
    console.log('🚀 Pushing schema using drizzle-kit....')
    execSync(
      `npx drizzle-kit push --url="${process.env.DATABASE_URL}" --schema="./src/db/schema.ts" --dialect="postgresql"`,
      {
        stdio: 'inherit',
        cwd: process.cwd(),
      }
    )

    console.log('✅ Test database setup complete')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }

  return async () => {
    console.log('🧹 Tearing down test database.... ')
    try {
      await db.execute(sql`DROP TABLE IF EXISTS ${entries} CASCADE`)
      await db.execute(sql`DROP TABLE IF EXISTS ${habits} CASCADE`)
      await db.execute(sql`DROP TABLE IF EXISTS ${users} CASCADE`)

      console.log('✅ Test teardown database complete')
    } catch (error) {
      console.error('❌Failed to teardown test database:', error)
    } finally {
      await db.$client.end()
    }
  }
}
