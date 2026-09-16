import type { Metadata } from "next";
import { Navbar } from "@/components/brand/Navbar";
import { CourseCardLink } from "@/components/ui/CourseCardLink";
import { getCourses } from "@/sanity/lib/data";

export const metadata: Metadata = {
  title: "All Courses",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Navbar />

      <main className="flex-1 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-display-2 text-neutral-900">All Courses</h1>
            <p className="mt-2 text-body font-sans text-neutral-500">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </p>
          </div>

          {courses.length === 0 ? (
            <p className="text-body font-sans text-neutral-500">No courses yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCardLink key={course._id} course={course} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
