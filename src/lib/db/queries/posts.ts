import { db } from "..";
import { posts } from "../schema";
import { eq, desc } from "drizzle-orm";
import { feedFollows } from "../schema";

export async function createPost(data: {
  title: string;
  url: string;
  description?: string;
  publishedAt?: Date;
  feedId: string;
}) {
  try {
    const [post] = await db.insert(posts).values(data).returning();
    return post;
  } catch (err) {
    return null;
  }
}



export async function getPostsForUser(
  userId: string,
  limit: number,
  sortOrder: "desc" | "asc" = "desc",
  offset: number = 0
) {
  return await db
    .select({
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
    .where(eq(feedFollows.userId, userId))
    .orderBy(sortOrder === "desc" ? desc(posts.publishedAt) : posts.publishedAt)
    .limit(limit)
    .offset(offset);
}