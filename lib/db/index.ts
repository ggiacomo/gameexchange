import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Use a placeholder URL at build time — real queries require DATABASE_URL to be set
const sql = neon(process.env.DATABASE_URL ?? 'postgresql://build:build@localhost/build')

export const db = drizzle(sql, { schema })
