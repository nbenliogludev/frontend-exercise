import type { UsersRequest, UsersResponse } from "./types";

export const USERS_PAGE_SIZE = 40;

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const createUsersSearchParams = (request: UsersRequest) => {
  const params = new URLSearchParams({
    page: String(request.page),
    limit: String(request.limit),
    sortBy: request.sortBy,
    sortDir: request.sortDir,
  });

  if (request.q) {
    params.set("q", request.q);
  }

  if (request.hobbies.length > 0) {
    params.set("hobbies", request.hobbies.join(","));
  }

  if (request.nationalities.length > 0) {
    params.set("nationalities", request.nationalities.join(","));
  }

  return params;
};

export const fetchUsers = async (request: UsersRequest) => {
  const params = createUsersSearchParams(request);
  const response = await fetch(`${apiBaseUrl}/api/users?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Users request failed");
  }

  return response.json() as Promise<UsersResponse>;
};
