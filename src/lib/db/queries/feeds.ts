import { db } from "..";
import { feeds } from "../schema";
import { eq,sql,asc  } from "drizzle-orm";
import { users } from "../schema";



export async function createFeed(userId: string, name: string, url: string) {
  const [newFeed] = await db
    .insert(feeds)
    .values({ userId, name, url })
    .returning({
      id: feeds.id,
      name: feeds.name,
      url: feeds.url,
      userId: feeds.userId,
      createdAt: feeds.createdAt,
      updatedAt: feeds.updatedAt,
    });

  return newFeed;
}

export async function getFeedsWithUsers() {
  return await db
    .select()
    .from(feeds)
    .leftJoin(users, eq(feeds.userId, users.id));
}

export async function getFeedByUrl(url: string) {
  const [feed] = await db
    .select()
    .from(feeds)
    .where(eq(feeds.url, url));

  return feed;
}

export async function markFeedFetched(feedId: string) {
  await db
    .update(feeds)
    .set({
      lastFetchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
  const result = await db.execute(sql`
    SELECT *
    FROM feeds
    ORDER BY last_fetched_at NULLS FIRST, last_fetched_at ASC
    LIMIT 1
  `);

  return result[0];
}