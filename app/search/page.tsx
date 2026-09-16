import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/brand/Navbar";
import { SearchResultsView } from "@/components/search/SearchResultsView";

export const metadata: Metadata = {
  title: "Search Results",
};

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Navbar />
      <Suspense>
        <SearchResultsView />
      </Suspense>
    </div>
  );
}
