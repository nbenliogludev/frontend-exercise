import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDownAZ, ArrowUpAZ, RefreshCw, Search, X } from "lucide-react";

import { FacetSection } from "../features/users/components/FacetSection";
import { UserCard } from "../features/users/components/UserCard";
import type { UsersSortBy } from "../features/users/types";
import { USERS_PAGE_SIZE, fetchUsers } from "../features/users/usersApi";
import { useUsersUrlState } from "../features/users/useUsersUrlState";

const sortOptions: Array<{ value: UsersSortBy; label: string }> = [
  { value: "last_name", label: "Last name" },
  { value: "first_name", label: "First name" },
  { value: "age", label: "Age" },
  { value: "nationality", label: "Nationality" },
];

const skeletonRows = Array.from({ length: 7 }, (_, index) => index);

export const UsersShell = () => {
  const { state, updateState, toggleValue, clearFilters } = useUsersUrlState();
  const scrollParentRef = useRef<HTMLDivElement | null>(null);

  // Local state for the search input — decoupled from URL to support debouncing.
  const [searchInput, setSearchInput] = useState(state.q);

  // Sync URL → input when state.q changes externally (e.g. clearFilters).
  useEffect(() => {
    setSearchInput((prev) => (prev !== state.q ? state.q : prev));
  }, [state.q]);

  // Debounce: push input value to URL state 350ms after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      updateState({ q: searchInput });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, updateState]);

  const usersQuery = useInfiniteQuery({
    queryKey: ["users", state],
    queryFn: ({ pageParam }) =>
      fetchUsers({
        ...state,
        page: pageParam,
        limit: USERS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });

  const users = useMemo(
    () => usersQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [usersQuery.data],
  );
  const firstPage = usersQuery.data?.pages[0];
  const total = firstPage?.meta.total ?? 0;
  const hobbyFacets = firstPage?.facets.hobbies ?? [];
  const nationalityFacets = firstPage?.facets.nationalities ?? [];
  const selectedFiltersCount = state.hobbies.length + state.nationalities.length + (state.q ? 1 : 0);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = usersQuery;
  const listItemsCount = hasNextPage ? users.length + 1 : users.length;

  const rowVirtualizer = useVirtualizer({
    count: listItemsCount,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 124,
    overscan: 8,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems.at(-1);

    if (
      lastItem &&
      lastItem.index >= users.length - 6 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, users.length, virtualItems]);

  const resetAvailable = selectedFiltersCount > 0;
  const isInitialLoading = usersQuery.isLoading;
  const isEmpty = !isInitialLoading && !usersQuery.isError && users.length === 0;

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-[#182026]">
      <header className="border-b border-[#d9e0e3] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-[#5d6d74]">Directory</p>
            <h1 className="text-2xl font-semibold tracking-normal text-[#182026]">Users</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-80">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68787f]"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search"
                className="h-10 w-full rounded-md border border-[#cbd7d3] bg-white pl-9 pr-10 text-sm outline-none transition focus:border-[#1b7f6b] focus:ring-2 focus:ring-[#bfe1d7]"
              />
              {searchInput ? (
                <button
                  type="button"
                  title="Clear search"
                  onClick={() => {
                    setSearchInput("");
                    updateState({ q: "" });
                  }}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#68787f] transition hover:bg-[#edf4f1]"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              title="Refresh"
              onClick={() => void usersQuery.refetch()}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[#cbd7d3] bg-white text-[#2d6258] transition hover:bg-[#edf4f1]"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[292px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit border border-[#d9e0e3] bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-normal">Filters</h2>
            <button
              type="button"
              title="Clear filters"
              disabled={!resetAvailable}
              onClick={clearFilters}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd7d3] text-[#68787f] transition enabled:hover:bg-[#edf4f1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {isInitialLoading ? (
            <div className="space-y-6">
              <FacetSkeleton />
              <FacetSkeleton />
            </div>
          ) : (
            <div className="space-y-6">
              <FacetSection
                title="Hobbies"
                facets={hobbyFacets}
                selectedValues={state.hobbies}
                onToggle={(value) => toggleValue("hobbies", value)}
              />
              <FacetSection
                title="Nationalities"
                facets={nationalityFacets}
                selectedValues={state.nationalities}
                onToggle={(value) => toggleValue("nationalities", value)}
              />
            </div>
          )}
        </aside>

        <section className="min-w-0 border border-[#d9e0e3] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#d9e0e3] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-normal">Results</h2>
              <p className="text-sm tabular-nums text-[#607077]">{total.toLocaleString()} users</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="sort-by">
                Sort by
              </label>
              <select
                id="sort-by"
                value={state.sortBy}
                onChange={(event) => updateState({ sortBy: event.target.value as UsersSortBy })}
                className="h-10 rounded-md border border-[#cbd7d3] bg-white px-3 text-sm outline-none transition focus:border-[#1b7f6b] focus:ring-2 focus:ring-[#bfe1d7]"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                title="Change sort direction"
                onClick={() => updateState({ sortDir: state.sortDir === "asc" ? "desc" : "asc" })}
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#cbd7d3] bg-white px-3 text-sm font-medium text-[#2d6258] transition hover:bg-[#edf4f1]"
              >
                {state.sortDir === "asc" ? (
                  <ArrowDownAZ aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <ArrowUpAZ aria-hidden="true" className="h-4 w-4" />
                )}
                {state.sortDir === "asc" ? "Ascending" : "Descending"}
              </button>
            </div>
          </div>

          {usersQuery.isError ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-6 text-center">
              <h2 className="text-lg font-semibold tracking-normal">Could not load users</h2>
              <button
                type="button"
                onClick={() => void usersQuery.refetch()}
                className="flex h-10 items-center gap-2 rounded-md border border-[#cbd7d3] bg-white px-3 text-sm font-medium text-[#2d6258] transition hover:bg-[#edf4f1]"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : isInitialLoading ? (
            <div className="space-y-3 p-4">
              {skeletonRows.map((row) => (
                <UserCardSkeleton key={row} />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="flex min-h-[420px] items-center justify-center p-6 text-center">
              <h2 className="text-lg font-semibold tracking-normal">No users found</h2>
            </div>
          ) : (
            <div ref={scrollParentRef} className="h-[calc(100vh-226px)] min-h-[520px] overflow-auto p-4">
              <div
                className="relative"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
              >
                {virtualItems.map((virtualItem) => {
                  const user = users[virtualItem.index];

                  return (
                    <div
                      key={virtualItem.key}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualItem.index}
                      className="absolute left-0 top-0 w-full pb-3"
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {user ? (
                        <UserCard user={user} />
                      ) : (
                        <div className="rounded-lg border border-[#d9e0e3] bg-[#f8fafb] p-4 text-center text-sm text-[#607077]">
                          Loading
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const FacetSkeleton = () => (
  <div className="space-y-2">
    <div className="h-4 w-24 rounded bg-[#d9e0e3]" />
    <div className="space-y-2">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="h-7 rounded-md bg-[#eef2f3]" />
      ))}
    </div>
  </div>
);

const UserCardSkeleton = () => (
  <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-lg border border-[#d9e0e3] bg-white p-4">
    <div className="h-16 w-16 animate-pulse rounded-md bg-[#e5ecea]" />
    <div className="min-w-0 space-y-3 py-1">
      <div className="h-4 w-2/5 animate-pulse rounded bg-[#d9e0e3]" />
      <div className="h-3 w-3/5 animate-pulse rounded bg-[#e5eaec]" />
      <div className="flex gap-2">
        <div className="h-6 w-20 animate-pulse rounded-md bg-[#eef2f3]" />
        <div className="h-6 w-24 animate-pulse rounded-md bg-[#eef2f3]" />
      </div>
    </div>
  </div>
);
