import { db } from "..";
import { bookmarks } from "../schema";
import {  posts } from "../schema";
import { eq, desc } from "drizzle-orm";

export async function bookmarkPost(userId: string, postId: string) {
  const [newBookmark] = await db
    .insert(bookmarks)
    .values({ userId, postId })
    .returning();

  return newBookmark;
}


export async function getBookmarksForUser(userId: string) {
  return await db
    .select({
      title: posts.title,
      url: posts.url,
      publishedAt: posts.publishedAt,
    })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(posts.publishedAt));
}