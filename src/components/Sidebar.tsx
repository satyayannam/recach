"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";
import { getCaretNotifications, getInboxItems } from "@/lib/api";

type NavItem = { href: string; label: string };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [hasUnreadCarets, setHasUnreadCarets] = useState(false);
  const [hasUnreadInbox, setHasUnreadInbox] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getToken()));

    const handleStorage = () => {
      setAuthed(Boolean(getToken()));
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("recach-auth", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("recach-auth", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!authed) {
      setHasUnreadCarets(false);
      setHasUnreadInbox(false);
      return;
    }

    let canceled = false;

    const readSeenId = () => {
      if (typeof window === "undefined") {
        return 0;
      }
      const value = Number(localStorage.getItem("recach_caret_seen_id") ?? "0");
      return Number.isNaN(value) ? 0 : value;
    };

    const loadUnread = async () => {
      try {
        const [caretsData, inboxData] = await Promise.all([
          getCaretNotifications(20),
          getInboxItems()
        ]);
        if (canceled) {
          return;
        }
        const maxId = caretsData.length
          ? Math.max(...caretsData.map((note) => note.id))
          : 0;
        setHasUnreadCarets(maxId > readSeenId());
        const pendingContact = (inboxData ?? []).some(
          (item) =>
            item.type === "CONTACT_REQUEST" && item.status === "PENDING"
        );
        const hasUnread = (inboxData ?? []).some(
          (item) => item.status === "UNREAD"
        );
        setHasUnreadInbox(pendingContact || hasUnread);
      } catch (err) {
        if (!canceled) {
          setHasUnreadCarets(false);
          setHasUnreadInbox(false);
        }
      }
    };

    loadUnread();
    const interval = setInterval(() => {
      loadUnread();
    }, 30000);

    const handleCaretEvent = () => loadUnread();
    window.addEventListener("recach-caret", handleCaretEvent);
    window.addEventListener("storage", handleCaretEvent);

    return () => {
      canceled = true;
      clearInterval(interval);
      window.removeEventListener("recach-caret", handleCaretEvent);
      window.removeEventListener("storage", handleCaretEvent);
    };
  }, [authed]);

  const navItems: NavItem[] = useMemo(() => {
    if (!authed) {
      return [
        { href: "/reflection", label: "Circle" },
        { href: "/search", label: "Search" },
        { href: "/courses/search", label: "Courses" },
        { href: "/leaderboard", label: "Leaderboard" },
        { href: "/login", label: "Login" },
        { href: "/about", label: "About" },
        { href: "/how-it-works", label: "How it Works" }
      ];
    }

    const items = [
      { href: "/reflection", label: "Circle" },
      { href: "/me", label: "My Profile" },
      { href: "/courses", label: "Courses" },
      { href: "/search", label: "Search" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/inbox", label: "Inbox" },
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it Works" }
    ];
    return items;
  }, [authed]);

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    router.push("/login");
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black">
        <Link href="/" className="text-lg font-semibold" onClick={() => setOpen(false)}>
          <span className="text-purple-400">r</span>
          <span className="text-white/80">ec</span>
          <span className="text-green-400">a</span>
          <span className="text-white/80">ch</span>
          <span className="text-white/80">^</span>
        </Link>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="border border-white/20 px-3 py-1 text-xs"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-60 md:w-64 border-r border-white/10 bg-black transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex h-full flex-col px-4 py-6">
        <div className="mb-8 hidden md:block">
          <Link href="/" className="text-xl font-semibold">
            <span className="text-purple-400">r</span>
            <span className="text-white/80">ec</span>
            <span className="text-green-400">a</span>
            <span className="text-white/80">ch</span>
            <span className="text-white/80">^</span>
          </Link>
        </div>

        <nav className="space-y-3 text-sm flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const showCaretBadge =
              item.href === "/inbox" && (hasUnreadCarets || hasUnreadInbox);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block ${
                  isActive ? "text-white font-semibold" : "text-white/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{item.label}</span>
                  {showCaretBadge ? (
                    <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
                  ) : null}
                </span>
              </Link>
            );
          })}
          {authed ? (
            <div className="pt-4">
              <button
                className="w-full bg-orange-500 text-black px-3 py-2 text-sm"
                onClick={() => setAddOpen((prev) => !prev)}
              >
                Add+
              </button>
              {addOpen ? (
                <div className="mt-2 space-y-2 border border-white/10 p-2">
                  <Link
                    href="/work/new"
                    onClick={() => {
                      setOpen(false);
                      setAddOpen(false);
                    }}
                    className="block text-white/60 hover:text-white/80 text-sm"
                  >
                    Add Work
                  </Link>
                  <Link
                    href="/education/new"
                    onClick={() => {
                      setOpen(false);
                      setAddOpen(false);
                    }}
                    className="block text-white/60 hover:text-white/80 text-sm"
                  >
                    Add Education
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
        {authed ? (
          <button
            onClick={handleLogout}
            className="mt-auto text-left text-white/60 hover:text-white/80 text-sm"
          >
            Logout
          </button>
        ) : null}
        </div>
      </aside>
    </>
  );
}
