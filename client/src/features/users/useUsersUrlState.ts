import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import type { UsersSortBy, UsersSortDir, UsersUrlState } from "./types";

const sortByOptions = new Set<UsersSortBy>(["first_name", "last_name", "age", "nationality"]);
const sortDirOptions = new Set<UsersSortDir>(["asc", "desc"]);

const defaultState: UsersUrlState = {
  q: "",
  hobbies: [],
  nationalities: [],
  sortBy: "last_name",
  sortDir: "asc",
};

const readList = (params: URLSearchParams, key: "hobbies" | "nationalities") => {
  return [...new Set(params.getAll(key).flatMap((value) => value.split(",")))]
    .map((value) => value.trim())
    .filter(Boolean);
};

const readSortBy = (value: string | null): UsersSortBy => {
  if (value && sortByOptions.has(value as UsersSortBy)) {
    return value as UsersSortBy;
  }

  return defaultState.sortBy;
};

const readSortDir = (value: string | null): UsersSortDir => {
  if (value && sortDirOptions.has(value as UsersSortDir)) {
    return value as UsersSortDir;
  }

  return defaultState.sortDir;
};

export const createUsersUrlParams = (state: UsersUrlState) => {
  const params = new URLSearchParams();

  if (state.q.trim()) {
    params.set("q", state.q.trim());
  }

  if (state.hobbies.length > 0) {
    params.set("hobbies", state.hobbies.join(","));
  }

  if (state.nationalities.length > 0) {
    params.set("nationalities", state.nationalities.join(","));
  }

  params.set("sortBy", state.sortBy);
  params.set("sortDir", state.sortDir);

  return params;
};

export const useUsersUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<UsersUrlState>(() => {
    return {
      q: searchParams.get("q")?.trim() ?? defaultState.q,
      hobbies: readList(searchParams, "hobbies"),
      nationalities: readList(searchParams, "nationalities"),
      sortBy: readSortBy(searchParams.get("sortBy")),
      sortDir: readSortDir(searchParams.get("sortDir")),
    };
  }, [searchParams]);

  useEffect(() => {
    const normalizedParams = createUsersUrlParams(state);

    if (normalizedParams.toString() !== searchParams.toString()) {
      setSearchParams(normalizedParams, { replace: true });
    }
  }, [searchParams, setSearchParams, state]);

  const updateState = useCallback(
    (nextState: Partial<UsersUrlState>) => {
      setSearchParams(createUsersUrlParams({ ...state, ...nextState }));
    },
    [setSearchParams, state],
  );

  const toggleValue = useCallback(
    (key: "hobbies" | "nationalities", value: string) => {
      const values = state[key];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      updateState({ [key]: nextValues });
    },
    [state, updateState],
  );

  const clearFilters = useCallback(() => {
    updateState({
      q: "",
      hobbies: [],
      nationalities: [],
    });
  }, [updateState]);

  return {
    state,
    updateState,
    toggleValue,
    clearFilters,
  };
};
