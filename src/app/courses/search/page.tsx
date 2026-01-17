"use client";

import { useEffect, useState } from "react";
import {
  createContactRequest,
  getContactForRequest,
  searchCourses
} from "@/lib/api";
import type { CourseSearchGroup } from "@/lib/types";
import { getToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

export default function CourseSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseSearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [contactMap, setContactMap] = useState<Record<string, string>>({});
  const [hasToken, setHasToken] = useState(Boolean(getToken()));

  useEffect(() => {
    const handler = () => setHasToken(Boolean(getToken()));
    window.addEventListener("recach-auth", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("recach-auth", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const data = await searchCourses(value.trim());
      setResults(data ?? []);
    } catch (err) {
      setStatus("Unable to search courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch(query);
    }, 350);
    return () => clearTimeout(handler);
  }, [query]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Course Search</h1>
        <p className="text-sm text-white/60">
          Find people by course name or course number.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 bg-black border border-white/20 px-3 py-2 text-sm"
          placeholder="CAP 6339 or Database Systems"
        />
        <button
          onClick={() => handleSearch(query)}
          className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
        >
          Search
        </button>
      </div>

      {loading ? <p className="text-sm text-white/60">Searching...</p> : null}
      {status ? <p className="text-sm text-white/60">{status}</p> : null}

      <div className="space-y-6">
        {results.map((group) => (
          <div key={`${group.course_number}-${group.course_name}`} className="space-y-3">
            <div className="text-sm text-white/80">
              {group.course_number} · {group.course_name}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {group.people.map((person) => (
                <div
                  key={`${group.course_number}-${person.user_id}`}
                  className="border border-white/10 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">{person.name}</p>
                      {person.username ? (
                        <p className="text-xs text-white/50">^{person.username}</p>
                      ) : null}
                      <p className="text-xs text-white/40">
                        {person.university || "Unknown University"}
                      </p>
                    </div>
                    <span className={`text-xs ${levelColor(person.program_level)}`}>
                      {person.program_level}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    Grade: <span className={gradeColor(person.grade)}>{person.grade}</span>
                    {person.professor ? ` · ${person.professor}` : ""}
                    {person.term ? ` · ${person.term}` : ""}
                  </p>
                  {!hasToken ? (
                    <p className="text-xs text-white/40">Login to request contact.</p>
                  ) : null}
                  {person.can_request_contact ? (
                    <button
                      className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                      onClick={async () => {
                        try {
                          const created = await createContactRequest({
                            target_id: person.user_id,
                            course_id: person.course_id,
                            message: null
                          });
                          setStatus("Contact request sent.");
                          setResults((prev) =>
                            prev.map((g) => {
                              if (
                                g.course_number !== group.course_number ||
                                g.course_name !== group.course_name
                              ) {
                                return g;
                              }
                              return {
                                ...g,
                                people: g.people.map((p) =>
                                  p.user_id === person.user_id
                                    ? {
                                        ...p,
                                        can_request_contact: false,
                                        request_status: created.status,
                                        request_id: created.id
                                      }
                                    : p
                                )
                              };
                            })
                          );
                        } catch (err: any) {
                          const detail = err?.response?.data?.detail;
                          setStatus(
                            typeof detail === "string"
                              ? detail
                              : "Unable to request contact."
                          );
                        }
                      }}
                      disabled={!hasToken}
                    >
                      Request Contact
                    </button>
                  ) : person.request_status ? (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span>{person.request_status}</span>
                      {person.request_status === "ACCEPTED" && person.request_id ? (
                        <button
                          className="border border-white/20 px-2 py-1 text-xs hover:text-white/80"
                          onClick={async () => {
                            if (!person.request_id) {
                              return;
                            }
                            try {
                              const contact = await getContactForRequest(person.request_id);
                              setContactMap((prev) => ({
                                ...prev,
                                [person.request_id as string]: `${contact.method}: ${contact.value}`
                              }));
                            } catch (err: any) {
                              const detail = err?.response?.data?.detail;
                              setStatus(
                                typeof detail === "string"
                                  ? detail
                                  : "Unable to load contact."
                              );
                            }
                          }}
                        >
                          View contact
                        </button>
                      ) : null}
                    </div>
                  ) : hasToken ? (
                    <p className="text-xs text-white/40">Contact not available.</p>
                  ) : null}
                  {person.request_id && contactMap[person.request_id] ? (
                    <p className="text-xs text-white/70">
                      {contactMap[person.request_id]}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!loading && query && results.length === 0 ? (
          <p className="text-sm text-white/60">No courses found.</p>
        ) : null}
      </div>
    </section>
  );
}
