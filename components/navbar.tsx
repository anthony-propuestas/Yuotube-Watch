"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendario" },
  { href: "/tasks", label: "Tareas" },
];

export function Navbar({
  userName,
  userImage,
}: {
  userName: string;
  userImage: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-sm">
            ▶
          </span>
          <span className="hidden sm:inline">YouTube Watch</span>
        </Link>
        <div className="flex flex-1 items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                pathname.startsWith(link.href)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {userImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={userName}
              className="h-7 w-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
              router.refresh();
            }}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
          >
            Salir
          </button>
        </div>
      </nav>
    </header>
  );
}
