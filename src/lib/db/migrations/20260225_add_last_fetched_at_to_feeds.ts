import { pgTable, timestamp } from "drizzle-orm/pg-core";
import { feeds } from "../schema";

export async function up(db: any) {
  await db.schema.alterTable(feeds).addColumn("last_fetched_at", timestamp("last_fetched_at", { mode: "date" }).notNull().default(new Date()));
}

export async function down(db: any) {
  await db.schema.alterTable(feeds).dropColumn("last_fetched_at");
}