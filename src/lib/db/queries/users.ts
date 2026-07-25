import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { users } from "../schema.js";

export async function createUser(name: string) {
  const [result] = await db
    .insert(users)
    .values({
      name,
    })
    .returning();

  return result;
}

export async function getUserByName(name: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.name, name));

  return user;
}

export async function resetUsers() {
  await db.delete(users);
}

export async function getUsers() {
  return await db.select().from(users);
}

export async function getCurrentUser() {
  const { readConfig } = await import("../../../config.js");

  const config = readConfig();

  const user = await getUserByName(config.currentUserName!);

  if (!user) {
    throw new Error("Current user not found");
  }

  return user;
}
