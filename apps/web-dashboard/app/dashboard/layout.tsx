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
        </div>

        <LogoutButton />
      </header>

      {children}
    </div>
  );
}
