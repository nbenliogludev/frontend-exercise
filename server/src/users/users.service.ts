import { Brackets, type SelectQueryBuilder } from "typeorm";

import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";
import type { UsersQuery, UsersSortBy } from "./users.query";

type Facet = {
  value: string;
  count: number;
};

type UserResponseItem = {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
};

type UsersResponse = {
  data: UserResponseItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    q: string;
    hobbies: string[];
    nationalities: string[];
    sortBy: UsersSortBy;
    sortDir: UsersQuery["sortDir"];
  };
  facets: {
    hobbies: Facet[];
    nationalities: Facet[];
  };
};

type FacetRow = {
  value: string;
  count: number | string;
};

type FilterOptions = {
  includeHobbies?: boolean;
  includeNationalities?: boolean;
};

const sortColumnByField: Record<UsersSortBy, string> = {
  first_name: "user.firstName",
  last_name: "user.lastName",
  age: "user.age",
  nationality: "user.nationality",
};

const escapeLikeValue = (value: string) => {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
};

const applySearchFilter = (queryBuilder: SelectQueryBuilder<User>, q: string) => {
  if (!q) {
    return;
  }

  queryBuilder.andWhere(
    new Brackets((whereBuilder) => {
      whereBuilder
        .where("LOWER(user.firstName) LIKE :search ESCAPE '\\'", {
          search: `%${escapeLikeValue(q.toLowerCase())}%`,
        })
        .orWhere("LOWER(user.lastName) LIKE :search ESCAPE '\\'", {
          search: `%${escapeLikeValue(q.toLowerCase())}%`,
        });
    }),
  );
};

const applyNationalityFilter = (
  queryBuilder: SelectQueryBuilder<User>,
  nationalities: string[],
) => {
  if (nationalities.length === 0) {
    return;
  }

  queryBuilder.andWhere("user.nationality IN (:...nationalities)", { nationalities });
};

const applyHobbiesFilter = (queryBuilder: SelectQueryBuilder<User>, hobbies: string[]) => {
  if (hobbies.length === 0) {
    return;
  }

  const hobbiesSubQuery = queryBuilder
    .subQuery()
    .select("user_hobbies.user_id")
    .from("user_hobbies", "user_hobbies")
    .innerJoin("hobbies", "filter_hobbies", "filter_hobbies.id = user_hobbies.hobby_id")
    .where("filter_hobbies.name IN (:...hobbies)")
    .groupBy("user_hobbies.user_id")
    .having("COUNT(DISTINCT filter_hobbies.name) = :hobbiesCount")
    .getQuery();

  queryBuilder.andWhere(`user.id IN ${hobbiesSubQuery}`, {
    hobbies,
    hobbiesCount: hobbies.length,
  });
};

const createFilteredUsersQuery = (query: UsersQuery, options: FilterOptions = {}) => {
  const queryBuilder = AppDataSource.getRepository(User).createQueryBuilder("user");

  applySearchFilter(queryBuilder, query.q);

  if (options.includeNationalities !== false) {
    applyNationalityFilter(queryBuilder, query.nationalities);
  }

  if (options.includeHobbies !== false) {
    applyHobbiesFilter(queryBuilder, query.hobbies);
  }

  return queryBuilder;
};

const applySorting = (queryBuilder: SelectQueryBuilder<User>, query: UsersQuery) => {
  queryBuilder
    .orderBy(sortColumnByField[query.sortBy], query.sortDir.toUpperCase() as "ASC" | "DESC")
    .addOrderBy("user.id", query.sortDir.toUpperCase() as "ASC" | "DESC");
};

const mapFacetRows = (rows: FacetRow[]) => {
  return rows.map((row) => ({
    value: row.value,
    count: Number(row.count),
  }));
};

const getUsersPage = async (query: UsersQuery) => {
  const offset = (query.page - 1) * query.limit;
  const idQuery = createFilteredUsersQuery(query).select("user.id", "id");
  applySorting(idQuery, query);

  const idRows = await idQuery.offset(offset).limit(query.limit).getRawMany<{ id: number }>();
  const ids = idRows.map((row) => Number(row.id));

  if (ids.length === 0) {
    return [];
  }

  const usersQuery = AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.hobbies", "hobby")
    .where("user.id IN (:...ids)", { ids });

  applySorting(usersQuery, query);
  usersQuery.addOrderBy("hobby.name", "ASC");

  return usersQuery.getMany();
};

const getHobbyFacets = async (query: UsersQuery) => {
  const facetQuery = createFilteredUsersQuery(query, { includeHobbies: false })
    .innerJoin("user.hobbies", "facetHobby")
    .select("facetHobby.name", "value")
    .addSelect("COUNT(DISTINCT user.id)", "count")
    .groupBy("facetHobby.name")
    .orderBy("count", "DESC")
    .addOrderBy("facetHobby.name", "ASC")
    .limit(20);

  return mapFacetRows(await facetQuery.getRawMany<FacetRow>());
};

const getNationalityFacets = async (query: UsersQuery) => {
  const facetQuery = createFilteredUsersQuery(query, { includeNationalities: false })
    .select("user.nationality", "value")
    .addSelect("COUNT(DISTINCT user.id)", "count")
    .groupBy("user.nationality")
    .orderBy("count", "DESC")
    .addOrderBy("user.nationality", "ASC")
    .limit(20);

  return mapFacetRows(await facetQuery.getRawMany<FacetRow>());
};

const mapUser = (user: User): UserResponseItem => {
  return {
    id: user.id,
    avatar: user.avatar,
    first_name: user.firstName,
    last_name: user.lastName,
    age: user.age,
    nationality: user.nationality,
    hobbies: [...(user.hobbies ?? [])].map((hobby) => hobby.name).sort((a, b) => a.localeCompare(b)),
  };
};

export const getUsers = async (query: UsersQuery): Promise<UsersResponse> => {
  const total = await createFilteredUsersQuery(query).getCount();
  const [users, hobbies, nationalities] = await Promise.all([
    getUsersPage(query),
    getHobbyFacets(query),
    getNationalityFacets(query),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return {
    data: users.map(mapUser),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page * query.limit < total,
      hasPreviousPage: query.page > 1 && total > 0,
      q: query.q,
      hobbies: query.hobbies,
      nationalities: query.nationalities,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    },
    facets: {
      hobbies,
      nationalities,
    },
  };
};
