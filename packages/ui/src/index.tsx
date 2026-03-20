import type { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-800 bg-slate-950/70 p-8 shadow-2xl shadow-sky-950/20">
        {children}
      </div>
    </div>
  );
}
