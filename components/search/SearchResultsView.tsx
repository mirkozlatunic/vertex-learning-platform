"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SearchResultCard } from "@/components/ui/SearchResultCard";
import { captureEvent } from "@/lib/posthog-client";
import type { SearchResponse } from "@/lib/search-schema";

type SortOption = "relevant" | "course-az";

function sortResults(results: SearchResponse["results"], sort: SortOption) {
  if (sort === "relevant") return results;
  return [...results].sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
}

export function SearchResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  const [sort, setSort] = useState<SortOption>("relevant");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [retryKey, setRetryKey] = useState(0);

  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setInputValue(query);
    if (!query) {
      setResponse(null);
      setStatus("idle");
    }
  }

  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    async function runSearch() {
      setStatus("loading");
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) throw new Error("Search request failed");
        const data = (await res.json()) as SearchResponse;
        if (cancelled) return;
        setResponse(data);
        setStatus("idle");
        captureEvent("search_performed", {
          query: data.query,
          result_count: data.resultCount,
          course_count: data.courseCount,
        });
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [query, retryKey]);

  const results = useMemo(
    () => sortResults(response?.results ?? [], sort),
    [response, sort],
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="flex-1 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-4xl text-center">
        <Badge variant="outline">Search Results</Badge>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-display-2 text-neutral-900">
          Results for &ldquo;<span className="text-primary-500">{query}</span>&rdquo;
        </h1>
        {response ? (
          <p className="mt-2 text-body font-sans text-neutral-500">
            Found {response.resultCount} result{response.resultCount === 1 ? "" : "s"} across{" "}
            {response.courseCount} course{response.courseCount === 1 ? "" : "s"}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mx-auto mt-8">
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Search for anything..."
            shortcut="⌘K"
          />
        </form>
      </div>

      <div className="mx-auto mt-10 max-w-4xl">
        {!query ? null : status === "loading" ? (
          <div className="space-y-4" aria-live="polite" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-md bg-neutral-100" />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="rounded-md border border-neutral-200 bg-white p-8 text-center">
            <p className="text-body font-sans text-neutral-700">
              Something went wrong running that search.
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="mt-3 text-sm font-medium font-sans text-primary-500 hover:text-primary-400"
            >
              Try again
            </button>
          </div>
        ) : response && results.length > 0 ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium font-sans text-neutral-900">
                {results.length} result{results.length === 1 ? "" : "s"}
              </span>
              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="w-auto min-w-40"
              >
                <option value="relevant">Most Relevant</option>
                <option value="course-az">Course (A–Z)</option>
              </Select>
            </div>

            <div className="mt-4 space-y-4">
              {results.map((result, index) => (
                <SearchResultCard
                  key={`${result.lessonSlug}-${result.kind}-${index}`}
                  result={result}
                  onSelect={() =>
                    captureEvent("search_result_selected", {
                      kind: result.kind,
                      course_slug: result.courseSlug,
                      lesson_slug: result.lessonSlug,
                    })
                  }
                />
              ))}
            </div>
          </>
        ) : response ? (
          <EmptyState />
        ) : null}

        {response && results.length > 0 ? (
          <FooterCta className="mt-8" />
        ) : null}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
        <Icon icon={SearchIcon} size={20} className="text-primary-500" />
      </div>
      <h2 className="mt-4 text-heading-3 font-sans font-medium text-neutral-900">
        No results found
      </h2>
      <p className="mt-1 text-body font-sans text-neutral-500">
        Try different keywords or browse our full course catalog.
      </p>
      <Link
        href="/courses"
        className="mt-5 inline-flex items-center justify-center rounded-md bg-primary-500 px-4 py-2.5 text-sm font-medium font-sans text-white hover:bg-primary-400"
      >
        Browse all courses
      </Link>
    </div>
  );
}

function FooterCta({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-md border border-primary-200 bg-primary-100/40 p-5 ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        <Icon icon={SearchIcon} size={18} className="text-primary-500" />
        <div>
          <p className="text-sm font-medium font-sans text-neutral-900">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <p className="text-sm font-sans text-neutral-500">
            Try different keywords or browse our full course catalog.
          </p>
        </div>
      </div>
      <Link
        href="/courses"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white px-4 py-2.5 text-sm font-medium font-sans text-neutral-900 shadow-sm hover:bg-neutral-50"
      >
        Browse all courses
      </Link>
    </div>
  );
}
