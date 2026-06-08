export type UsersSortBy = "first_name" | "last_name" | "age" | "nationality";
export type UsersSortDir = "asc" | "desc";

export type UsersUrlState = {
  q: string;
  hobbies: string[];
  nationalities: string[];
  sortBy: UsersSortBy;
  sortDir: UsersSortDir;
};

export type UsersRequest = UsersUrlState & {
  page: number;
  limit: number;
};

export type User = {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
};

export type Facet = {
  value: string;
  count: number;
};

export type UsersResponse = {
  data: User[];
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
    sortDir: UsersSortDir;
  };
  facets: {
    hobbies: Facet[];
    nationalities: Facet[];
  };
};
