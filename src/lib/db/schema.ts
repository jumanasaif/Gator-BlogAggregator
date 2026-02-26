import { pgTable, timestamp, uuid, text ,uniqueIndex, unique} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  name: text("name").notNull().unique(),
});


export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  name: text("name").notNull(),
  url: text("url").notNull().unique(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  lastFetchedAt: timestamp("last_fetched_at"),
});

export const feedFollows = pgTable("feed_follows", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  feedId: uuid("feed_id")
    .references(() => feeds.id, { onDelete: "cascade" })
    .notNull(),
}, (table) => ({
  uniqueFollow: unique().on(table.userId, table.feedId),
}));


export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),

  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  title: text("title").notNull(),

  url: text("url").notNull().unique(),

  description: text("description"),

  publishedAt: timestamp("published_at"),

  feedId: uuid("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
});




export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
}, (table) => ({
  uniqueBookmark: unique().on(table.userId, table.postId),
}));