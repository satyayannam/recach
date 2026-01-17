"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import { createCourse, deleteCourse, listMyCourses } from "@/lib/api";
import type { UserCourse } from "@/lib/types";
import Link from "next/link";

const PROGRAM_LEVELS = ["BACHELORS", "MASTERS", "PHD", "OTHER"];
const VISIBILITY_LEVELS = ["PUBLIC", "CIRCLE", "PRIVATE"];

const levelColor = (level: string) => {
  switch (level) {
    case "MASTERS":
      return "text-purple-300";
    case "BACHELORS":
      return "text-green-300";
    case "PHD":
      return "text-blue-300";
    default:
      return "text-white/70";
  }
};

const gradeColor = (grade: string) => {
  const normalized = grade.trim().toUpperCase();
  if (normalized.startsWith("A")) {
    return "text-green-300";
  }
  if (normalized.startsWith("B")) {
    return "text-blue-300";
  }
  if (normalized.startsWith("C")) {
    return "text-yellow-300";
  }
  if (normalized.startsWith("D")) {
    return "text-orange-300";
  }
  return "text-red-300";
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    course_name: "",
    course_number: "",
    professor: "",
    grade: "",
    program_level: "BACHELORS",
    term: "",
    visibility: "PUBLIC"
  });

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMyCourses();
      setCourses(data ?? []);
    } catch (err) {
      setError("Unable to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await createCourse({
        course_name: form.course_name,
        course_number: form.course_number,
        professor: form.professor || null,
        grade: form.grade,
        program_level: form.program_level,
        term: form.term || null,
        visibility: form.visibility
      });
      setCourses((prev) => [created, ...prev]);
      setForm({
        course_name: "",
        course_number: "",
        professor: "",
        grade: "",
        program_level: "BACHELORS",
        term: "",
        visibility: "PUBLIC"
      });
      setFormOpen(false);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Unable to add course.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
    } catch (err) {
      setError("Unable to delete course.");
    }
  };

  return (
    <Protected>
      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">My Courses</h1>
            <p className="text-sm text-white/60">
              Track completed courses and control visibility.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
              onClick={() => setFormOpen(true)}
            >
              Add course
            </button>
            <Link
              href="/courses/search"
              className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
            >
              Search
            </Link>
          </div>
        </header>

        {loading ? <p className="text-sm text-white/60">Loading...</p> : null}

        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="border border-white/10 p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">
                    {course.course_number} · {course.course_name}
                  </p>
                  <p className="text-xs text-white/50">
                    <span className={levelColor(course.program_level)}>
                      {course.program_level}
                    </span>{" "}
                    ·{" "}
                    <span className={gradeColor(course.grade)}>{course.grade}</span>
                    {course.professor ? ` · ${course.professor}` : ""}
                    {course.term ? ` · ${course.term}` : ""}
                  </p>
                </div>
                <button
                  className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                  onClick={() => handleDelete(course.id)}
                >
                  Delete
                </button>
              </div>
              <p className="text-xs text-white/40">Visibility: {course.visibility}</p>
            </div>
          ))}
          {!loading && courses.length === 0 ? (
            <p className="text-sm text-white/60">No courses yet.</p>
          ) : null}
        </div>
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl border border-white/10 bg-black p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add course</h2>
              <button
                className="text-xs text-white/60 hover:text-white/80"
                onClick={() => setFormOpen(false)}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={form.course_name}
                  onChange={(event) => setForm({ ...form, course_name: event.target.value })}
                  className="bg-black border border-white/20 px-3 py-2 text-sm"
                  placeholder="Course name"
                  required
                />
                <input
                  value={form.course_number}
                  onChange={(event) => setForm({ ...form, course_number: event.target.value })}
                  className="bg-black border border-white/20 px-3 py-2 text-sm"
                  placeholder="Course number"
                  required
                />
                <input
                  value={form.professor}
                  onChange={(event) => setForm({ ...form, professor: event.target.value })}
                  className="bg-black border border-white/20 px-3 py-2 text-sm"
                  placeholder="Professor (optional)"
                />
                <input
                  value={form.grade}
                  onChange={(event) => setForm({ ...form, grade: event.target.value })}
                  className="bg-black border border-white/20 px-3 py-2 text-sm"
                  placeholder="Grade"
                  required
                />
                <select
                  value={form.program_level}
                  onChange={(event) => setForm({ ...form, program_level: event.target.value })}
                  className="bg-black border border-white/20 px-3 py-2 text-sm"
                >
                  {PROGRAM_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <input
                  value={form.term}
                  onChange={(event) => setForm({ ...form, term: event.target.value })}
                  className="bg-black border border-white/20 px-3 py-2 text-sm"
                  placeholder="Term (optional)"
                />
                <select
                  value={form.visibility}
                  onChange={(event) => setForm({ ...form, visibility: event.target.value })}
                  className="bg-black border border-white/20 px-3 py-2 text-sm"
                >
                  {VISIBILITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              {error ? <p className="text-sm text-white/60">{error}</p> : null}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Add course"}
                </button>
                <button
                  type="button"
                  className="border border-white/20 px-4 py-2 text-sm text-white/60 hover:text-white/80"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </Protected>
  );
}
