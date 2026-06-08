import type { ParsedQs } from "qs";

export const sortByOptions = ["first_name", "last_name", "age", "nationality"] as const;
export const sortDirOptions = ["asc", "desc"] as const;

export type UsersSortBy = (typeof sortByOptions)[number];
export type UsersSortDir = (typeof sortDirOptions)[number];

export type UsersQuery = {
  page: number;
  limit: number;
  q: string;
  hobbies: string[];
  nationalities: string[];
  sortBy: UsersSortBy;
  sortDir: UsersSortDir;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

const sortByAliases: Record<string, UsersSortBy> = {
  firstName: "first_name",
  first_name: "first_name",
  lastName: "last_name",
  last_name: "last_name",
  age: "age",
  nationality: "nationality",
};

const getFirstValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return getFirstValue(value[0]);
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
};

const getStringValues = (value: unknown) => {
  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((item) => {
      if (typeof item !== "string") {
        return [];
      }

      return item.split(",");
    })
    .map((item) => item.trim())
    .filter(Boolean);
};

const getUniqueValues = (values: string[]) => {
  return [...new Set(values)];
};

const parsePositiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(getFirstValue(value));

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
};

export const parseUsersQuery = (query: ParsedQs): UsersQuery => {
  const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
  const limit = Math.min(parsePositiveInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const rawSortBy = getFirstValue(query.sortBy);
  const rawSortDir = getFirstValue(query.sortDir)?.toLowerCase();

  return {
    page,
    limit,
    q: getFirstValue(query.q)?.trim() ?? "",
    hobbies: getUniqueValues(getStringValues(query.hobbies)),
    nationalities: getUniqueValues(getStringValues(query.nationalities)),
    sortBy: rawSortBy ? (sortByAliases[rawSortBy] ?? "last_name") : "last_name",
    sortDir: rawSortDir === "desc" ? "desc" : "asc",
  };
};
