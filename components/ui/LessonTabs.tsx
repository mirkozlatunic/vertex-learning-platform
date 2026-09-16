"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/cn";
import { captureEvent } from "@/lib/posthog-client";

export type LessonTabsProps = {
  lessonId: string;
  lessonContent: ReactNode;
  className?: string;
};

type Tab = "content" | "notes";

const tabs: { id: Tab; label: string }[] = [
  { id: "content", label: "Lesson Content" },
  { id: "notes", label: "Notes" },
];

export function LessonTabs({ lessonId, lessonContent, className }: LessonTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("content");

  return (
    <div className={className}>
      <div className="flex gap-6 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              captureEvent("lesson_tab_selected", { lesson_id: lessonId, tab: tab.id });
            }}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-medium font-sans transition-colors",
              activeTab === tab.id
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-neutral-500 hover:text-neutral-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {activeTab === "content" ? (
          lessonContent
        ) : (
          <textarea
            placeholder="Take notes for this lesson..."
            rows={10}
            className="w-full resize-none rounded-md border border-neutral-200 p-4 text-sm font-sans text-neutral-700 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}
