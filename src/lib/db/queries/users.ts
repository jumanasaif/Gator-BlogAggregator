import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";

export type User = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function createUser(name: string): Promise<User> {
  const [result] = await db.insert(users).values({ name }).returning();
  return result as User;
}

export async function getUserByName(name: string): Promise<User | undefined> {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.name, name));

  return result as User | undefined; 
}

export async function deleteAllUsers(): Promise<void> {
  await db.delete(users);
}

export async function getUsers(): Promise<User[]> {
  return await db.select().from(users) as User[];
}