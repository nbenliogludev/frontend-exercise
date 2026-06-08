import "reflect-metadata";

import { AppDataSource, initializeDatabase } from "../database/data-source";
import { Hobby } from "../entities/hobby.entity";
import { User } from "../entities/user.entity";

const DEFAULT_USERS_COUNT = 5_000;
const MAX_HOBBIES_PER_USER = 10;
const USER_BATCH_SIZE = 500;

const firstNames = [
  "Aarav",
  "Adam",
  "Adrian",
  "Aisha",
  "Akira",
  "Amelia",
  "Anika",
  "Aria",
  "Ayse",
  "Camila",
  "Daniel",
  "Daria",
  "Diego",
  "Elena",
  "Emir",
  "Emma",
  "Farah",
  "Felix",
  "Hana",
  "Hugo",
  "Ibrahim",
  "Isabella",
  "Jonas",
  "Kai",
  "Layla",
  "Leo",
  "Lina",
  "Luca",
  "Maya",
  "Mia",
  "Mila",
  "Nadia",
  "Noah",
  "Nora",
  "Omar",
  "Olivia",
  "Rafael",
  "Sofia",
  "Theo",
  "Yuna",
];

const lastNames = [
  "Ahmed",
  "Andersen",
  "Bennett",
  "Brown",
  "Chen",
  "Costa",
  "Demir",
  "Dubois",
  "Garcia",
  "Hansen",
  "Ivanov",
  "Johnson",
  "Kaya",
  "Kim",
  "Kowalski",
  "Lopez",
  "Martin",
  "Meyer",
  "Miller",
  "Moreau",
  "Nguyen",
  "Novak",
  "Patel",
  "Petrov",
  "Rossi",
  "Sato",
  "Silva",
  "Singh",
  "Smith",
  "Yilmaz",
];

const nationalities = [
  "American",
  "Argentinian",
  "Brazilian",
  "British",
  "Canadian",
  "Chinese",
  "Danish",
  "Dutch",
  "Egyptian",
  "French",
  "German",
  "Indian",
  "Italian",
  "Japanese",
  "Mexican",
  "Norwegian",
  "Polish",
  "Portuguese",
  "Spanish",
  "Swedish",
  "Turkish",
];

const hobbyNames = [
  "Archery",
  "Baking",
  "Basketball",
  "Board games",
  "Camping",
  "Chess",
  "Climbing",
  "Coding",
  "Collecting vinyl",
  "Cooking",
  "Cycling",
  "Dancing",
  "Drawing",
  "Fishing",
  "Gardening",
  "Guitar",
  "Hiking",
  "Kayaking",
  "Knitting",
  "Language learning",
  "Meditation",
  "Photography",
  "Pilates",
  "Pottery",
  "Reading",
  "Running",
  "Sailing",
  "Skateboarding",
  "Skiing",
  "Stand-up comedy",
  "Surfing",
  "Swimming",
  "Table tennis",
  "Traveling",
  "Video games",
  "Volunteering",
  "Woodworking",
  "Writing",
  "Yoga",
];

const parseUsersCount = () => {
  const countArgument = process.argv.find((argument) => argument.startsWith("--count="));
  const rawCount = countArgument?.split("=")[1] ?? process.env.SEED_USERS_COUNT;
  const parsedCount = Number(rawCount);

  if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
    return DEFAULT_USERS_COUNT;
  }

  return Math.floor(parsedCount);
};

const createRandom = (seed: number) => {
  let value = seed;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);

    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const pick = <T>(items: T[], random: () => number) => {
  return items[Math.floor(random() * items.length)];
};

const pickHobbies = (hobbies: Hobby[], random: () => number) => {
  const hobbiesCount = Math.floor(random() * (MAX_HOBBIES_PER_USER + 1));
  const selected = new Set<Hobby>();

  while (selected.size < hobbiesCount) {
    selected.add(pick(hobbies, random));
  }

  return [...selected];
};

const createAvatarUrl = (firstName: string, lastName: string, index: number) => {
  const seed = encodeURIComponent(`${firstName}-${lastName}-${index}`);

  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
};

const clearDatabase = async () => {
  await AppDataSource.query("DELETE FROM user_hobbies");
  await AppDataSource.getRepository(User).clear();
  await AppDataSource.getRepository(Hobby).clear();
};

const seed = async () => {
  const usersCount = parseUsersCount();
  const random = createRandom(42);
  const dataSource = await initializeDatabase();
  const hobbyRepository = dataSource.getRepository(Hobby);
  const userRepository = dataSource.getRepository(User);

  await clearDatabase();

  const hobbies = await hobbyRepository.save(
    hobbyNames.map((name) => {
      const hobby = new Hobby();
      hobby.name = name;

      return hobby;
    }),
  );

  for (let offset = 0; offset < usersCount; offset += USER_BATCH_SIZE) {
    const batchSize = Math.min(USER_BATCH_SIZE, usersCount - offset);
    const users: User[] = [];

    for (let index = 0; index < batchSize; index += 1) {
      const userIndex = offset + index + 1;
      const firstName = pick(firstNames, random);
      const lastName = pick(lastNames, random);
      const user = new User();

      user.firstName = firstName;
      user.lastName = lastName;
      user.age = 18 + Math.floor(random() * 53);
      user.nationality = pick(nationalities, random);
      user.avatar = createAvatarUrl(firstName, lastName, userIndex);
      user.hobbies = pickHobbies(hobbies, random);
      users.push(user);
    }

    await userRepository.save(users);
  }

  console.log(`Seeded ${usersCount} users and ${hobbies.length} hobbies.`);
};

seed()
  .catch((error: unknown) => {
    console.error("Failed to seed database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
