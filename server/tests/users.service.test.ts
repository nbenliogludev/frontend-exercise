import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import type { DataSource } from "typeorm";

import { Hobby, User } from "../src/entities";
import type { getUsers as getUsersType } from "../src/users/users.service";

type GetUsers = typeof getUsersType;

type TestUser = {
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  hobbies: string[];
};

const defaultQuery = {
  page: 1,
  limit: 30,
  q: "",
  hobbies: [],
  nationalities: [],
  sortBy: "last_name" as const,
  sortDir: "asc" as const,
};

const testUsers: TestUser[] = [
  {
    firstName: "Amy",
    lastName: "Adams",
    age: 31,
    nationality: "Canadian",
    hobbies: ["Yoga", "Photography", "Chess"],
  },
  {
    firstName: "Aaron",
    lastName: "Adams",
    age: 27,
    nationality: "American",
    hobbies: ["Yoga", "Cooking"],
  },
  {
    firstName: "Bella",
    lastName: "Brown",
    age: 42,
    nationality: "Canadian",
    hobbies: ["Photography", "Hiking"],
  },
  {
    firstName: "Carl",
    lastName: "Carter",
    age: 42,
    nationality: "Turkish",
    hobbies: ["Yoga", "Photography", "Hiking"],
  },
  {
    firstName: "Dana",
    lastName: "Davis",
    age: 35,
    nationality: "Turkish",
    hobbies: ["Yoga"],
  },
  {
    firstName: "Elena",
    lastName: "Evans",
    age: 29,
    nationality: "Japanese",
    hobbies: ["Coding", "Chess"],
  },
  {
    firstName: "Emir",
    lastName: "Evans",
    age: 48,
    nationality: "Turkish",
    hobbies: ["Coding", "Yoga", "Chess"],
  },
  {
    firstName: "Fiona",
    lastName: "Frost",
    age: 48,
    nationality: "Japanese",
    hobbies: ["Cooking"],
  },
  {
    firstName: "Gina",
    lastName: "Green",
    age: 21,
    nationality: "American",
    hobbies: ["Yoga", "Photography", "Cooking"],
  },
  {
    firstName: "Hank",
    lastName: "Hill",
    age: 60,
    nationality: "Canadian",
    hobbies: ["Woodworking"],
  },
];

let dataSource: DataSource;
let getUsers: GetUsers;
let databaseDirectory = "";

const seedDatabase = async () => {
  const hobbyRepository = dataSource.getRepository(Hobby);
  const userRepository = dataSource.getRepository(User);
  const hobbyNames = [...new Set(testUsers.flatMap((user) => user.hobbies))];
  const hobbies = await hobbyRepository.save(
    hobbyNames.map((name) => hobbyRepository.create({ name })),
  );
  const hobbiesByName = new Map(hobbies.map((hobby) => [hobby.name, hobby]));

  await userRepository.save(
    testUsers.map((testUser) =>
      userRepository.create({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        age: testUser.age,
        nationality: testUser.nationality,
        avatar: `/avatars/${testUser.firstName.toLowerCase()}.svg`,
        hobbies: testUser.hobbies.map((name) => hobbiesByName.get(name)!),
      }),
    ),
  );
};

before(async () => {
  databaseDirectory = await mkdtemp(path.join(tmpdir(), "users-service-test-"));
  process.env.DATABASE_PATH = path.join(databaseDirectory, "users.sqlite");
  process.env.TYPEORM_SYNCHRONIZE = "true";
  process.env.TYPEORM_LOGGING = "false";

  const databaseModule = await import("../src/database/data-source");
  const serviceModule = await import("../src/users/users.service");

  dataSource = databaseModule.AppDataSource;
  getUsers = serviceModule.getUsers;

  await databaseModule.initializeDatabase();
  await seedDatabase();
});

after(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }

  if (databaseDirectory) {
    await rm(databaseDirectory, { force: true, recursive: true });
  }
});

describe("getUsers", () => {
  it("returns paginated data with metadata and deterministic fallback sorting", async () => {
    const firstPage = await getUsers({ ...defaultQuery, limit: 2 });
    const secondPage = await getUsers({ ...defaultQuery, page: 2, limit: 2 });

    assert.deepEqual(
      firstPage.data.map((user) => user.first_name),
      ["Amy", "Aaron"],
    );
    assert.deepEqual(
      secondPage.data.map((user) => user.first_name),
      ["Bella", "Carl"],
    );
    assert.equal(firstPage.meta.total, testUsers.length);
    assert.equal(firstPage.meta.totalPages, 5);
    assert.equal(firstPage.meta.hasNextPage, true);
    assert.equal(firstPage.meta.hasPreviousPage, false);
    assert.equal(secondPage.meta.hasPreviousPage, true);
  });

  it("searches by first and last name", async () => {
    const byFirstName = await getUsers({ ...defaultQuery, q: "emi" });
    const byLastName = await getUsers({ ...defaultQuery, q: "adams" });

    assert.deepEqual(byFirstName.data.map((user) => user.first_name), ["Emir"]);
    assert.deepEqual(byLastName.data.map((user) => user.last_name), ["Adams", "Adams"]);
  });

  it("uses OR semantics for nationalities", async () => {
    const response = await getUsers({
      ...defaultQuery,
      nationalities: ["Japanese", "Turkish"],
    });

    assert.equal(response.meta.total, 5);
    assert.ok(
      response.data.every((user) => ["Japanese", "Turkish"].includes(user.nationality)),
    );
  });

  it("uses AND semantics for hobbies", async () => {
    const response = await getUsers({
      ...defaultQuery,
      hobbies: ["Yoga", "Photography"],
    });

    assert.equal(response.meta.total, 3);
    assert.deepEqual(
      response.data.map((user) => user.first_name),
      ["Amy", "Carl", "Gina"],
    );
    assert.ok(
      response.data.every(
        (user) => user.hobbies.includes("Yoga") && user.hobbies.includes("Photography"),
      ),
    );
  });

  it("combines search, hobby filters, nationality filters, and sorting", async () => {
    const response = await getUsers({
      ...defaultQuery,
      q: "em",
      hobbies: ["Yoga"],
      nationalities: ["Turkish"],
      sortBy: "age",
      sortDir: "desc",
    });

    assert.equal(response.meta.total, 1);
    assert.equal(response.data[0]?.first_name, "Emir");
    assert.equal(response.data[0]?.nationality, "Turkish");
  });

  it("sorts by supported fields and keeps pagination stable", async () => {
    const firstPage = await getUsers({
      ...defaultQuery,
      sortBy: "age",
      sortDir: "desc",
      limit: 3,
    });
    const secondPage = await getUsers({
      ...defaultQuery,
      sortBy: "age",
      sortDir: "desc",
      page: 2,
      limit: 3,
    });
    const ids = [...firstPage.data, ...secondPage.data].map((user) => user.id);

    assert.deepEqual(
      firstPage.data.map((user) => user.first_name),
      ["Hank", "Fiona", "Emir"],
    );
    assert.equal(new Set(ids).size, ids.length);
  });

  it("returns top-20 facets for the current filtered result set", async () => {
    const unfiltered = await getUsers(defaultQuery);
    const turkish = await getUsers({
      ...defaultQuery,
      nationalities: ["Turkish"],
    });
    const yogaPhotography = await getUsers({
      ...defaultQuery,
      hobbies: ["Yoga", "Photography"],
    });

    assert.deepEqual(unfiltered.facets.hobbies[0], { value: "Yoga", count: 6 });
    assert.ok(unfiltered.facets.hobbies.length <= 20);
    assert.ok(unfiltered.facets.nationalities.length <= 20);
    // nationality facets use exclude-self (OR logic): computed without the nationality filter,
    // so all nationalities in the dataset appear even when a nationality is selected.
    assert.deepEqual(turkish.facets.nationalities, [
      { value: "Canadian", count: 3 },
      { value: "Turkish", count: 3 },
      { value: "American", count: 2 },
      { value: "Japanese", count: 2 },
    ]);
    assert.deepEqual(turkish.facets.hobbies[0], { value: "Yoga", count: 3 });
    // hobby facets use include-self (AND logic): computed with current hobby filters applied.
    assert.deepEqual(yogaPhotography.facets.nationalities, [
      { value: "American", count: 1 },
      { value: "Canadian", count: 1 },
      { value: "Turkish", count: 1 },
    ]);
  });

  it("returns empty facets for pages beyond the first", async () => {
    const secondPage = await getUsers({ ...defaultQuery, page: 2, limit: 3 });

    // Facets are only computed for page 1 to avoid redundant SQL queries on
    // every infinite-scroll fetch. The client reads facets from the first page only.
    assert.deepEqual(secondPage.facets.hobbies, []);
    assert.deepEqual(secondPage.facets.nationalities, []);
  });
});
