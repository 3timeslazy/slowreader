import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  id: text('id').primaryKey()
})

export const sessions = pgTable(
  'sessions',
  {
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    id: serial('id').primaryKey(),
    token: text('token').notNull(),
    usedAt: timestamp('usedAt').notNull().defaultNow(),
    userId: text('userId')
      .references(() => users.id)
      .notNull()
  },
  table => ({
    sessionsUserIdx: index('sessionsUserIdx').on(table.userId)
  })
)
