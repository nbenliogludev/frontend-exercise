import { mkdir } from "node:fs/promises";
import path from "node:path";

import { DataSource } from "typeorm";

import { Hobby } from "../entities/hobby.entity";
import { User } from "../entities/user.entity";

export const databasePath =
  process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "data", "users.sqlite");

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: databasePath,
  entities: [User, Hobby],
  synchronize: process.env.TYPEORM_SYNCHRONIZE !== "false",
  logging: process.env.TYPEORM_LOGGING === "true",
});

export const initializeDatabase = async () => {
  await mkdir(path.dirname(databasePath), { recursive: true });

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
};
