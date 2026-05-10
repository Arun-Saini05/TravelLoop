"use client";

import {
  useEffect,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TripsQueryState } from "@/app/dashboard/trips/types";
import {
  DEFAULT_SORT,
  roleFilterOptions,
  sortOptions,
  statusFilterOptions,
  visibilityFilterOptions,
} from "@/app/dashboard/trips/utils";

type TripsControlsProps = {
  query: TripsQueryState;
  totalVisibleTrips: number;
  filteredTrips: number;
};

export function TripsControls({
  query,
  totalVisibleTrips,
  filteredTrips,
}: TripsControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState(query.q);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearchText(query.q);
  }, [query.q]);

  const updateParams = (mutate: (params: URLSearchParams) => void) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  };

  const setQueryValue = (params: URLSearchParams, key: string, value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      params.delete(key);
      return;
    }

    if (
      (key === "status" || key === "role" || key === "visibility") &&
      trimmedValue === "all"
    ) {
      params.delete(key);
      return;
    }

    if (key === "sort" && trimmedValue === DEFAULT_SORT) {
      params.delete(key);
      return;
    }

    params.set(key, trimmedValue);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    updateParams((params) => {
      setQueryValue(params, "q", searchText);
    });
  };

  const handleSelectChange =
    (key: "status" | "role" | "visibility" | "sort") =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;

      updateParams((params) => {
        setQueryValue(params, key, value);
      });
    };

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  return (
    <section
      aria-label="Trip search and filters"
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl"
        >
          <div className="w-full">
            <label htmlFor="trips-search" className="mb-1 block text-sm font-medium text-zinc-800">
              Search trips
            </label>
            <input
              id="trips-search"
              name="q"
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by trip name, notes, or destination"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              disabled={isPending || !query.hasActiveFilters}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              Clear filters
            </button>
          </div>
        </form>

        <p className="text-sm text-zinc-600" aria-live="polite">
          Showing <span className="font-semibold text-zinc-900">{filteredTrips}</span> of{" "}
          <span className="font-semibold text-zinc-900">{totalVisibleTrips}</span> trips
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="status-filter" className="mb-1 block text-sm font-medium text-zinc-800">
            Status
          </label>
          <select
            id="status-filter"
            value={query.status}
            onChange={handleSelectChange("status")}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="role-filter" className="mb-1 block text-sm font-medium text-zinc-800">
            My role
          </label>
          <select
            id="role-filter"
            value={query.role}
            onChange={handleSelectChange("role")}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            {roleFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="visibility-filter" className="mb-1 block text-sm font-medium text-zinc-800">
            Visibility
          </label>
          <select
            id="visibility-filter"
            value={query.visibility}
            onChange={handleSelectChange("visibility")}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            {visibilityFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort-filter" className="mb-1 block text-sm font-medium text-zinc-800">
            Sort by
          </label>
          <select
            id="sort-filter"
            value={query.sort}
            onChange={handleSelectChange("sort")}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
