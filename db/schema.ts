import { bigint, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

// Mirror of the runtime-created table in lib/store.ts, for future migrations.
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rev: integer('rev').notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  updatedBy: text('updated_by').notNull(),
  doc: jsonb('doc').notNull(),
})
