import Link from "next/link";
import type { PropsWithChildren } from "react";
import { LogoutButton } from "../../components/logout-button";
import { requireCurrentUser } from "../../lib/auth";

export default async function DashboardLayout({
  children
}: PropsWithChildren) {
  const user = await requireCurrentUser();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            Control Plane
          </p>
          <h1 className="text-3xl font-semibold text-white">Night Manager Dashboard</h1>
          <p className="text-sm text-slate-400">
            Logged in as <span className="font-medium text-slate-200">{user.displayName}</span>{" "}
            <span className="text-slate-500">({user.role})</span>
          </p>
          <nav className="flex flex-wrap gap-3 pt-2">
            <Link
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500 hover:text-white"
              href="/dashboard"
            >
              Overview
            </Link>
            {user.role === "admin" ? (
              <Link
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500 hover:text-white"
                href="/dashboard/roles"
              >
                Role Management
              </Link>
            ) : null}
          </nav>
        </div>

        <LogoutButton />
      </header>

      {children}
    </div>
  );
}
