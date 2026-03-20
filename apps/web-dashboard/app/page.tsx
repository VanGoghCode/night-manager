import Link from "next/link";
import { loadWebPublicEnvironment } from "@night-manager/config";
import { loadRoleDefinition } from "@night-manager/role-loader";

const env = loadWebPublicEnvironment();
const projectManagerRole = loadRoleDefinition("ai-project-manager");

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-sky-300">
          Night Manager
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold text-white md:text-6xl">
          AI-native software delivery operating system
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-300">
          Humans and AI collaborate to plan, assign, build, review, test,
          release, and maintain software inside a policy-driven zero-trust
          platform.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            href="/login"
          >
            Login to dashboard
          </Link>
          <Link
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            href="/dashboard"
          >
            View protected dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-lg font-medium text-white">Primary AI role</h2>
          <p className="mt-3 text-sm text-slate-300">{projectManagerRole.title}</p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-lg font-medium text-white">API</h2>
          <p className="mt-3 text-sm text-slate-300">{env.NEXT_PUBLIC_API_BASE_URL}</p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-lg font-medium text-white">Webhook</h2>
          <p className="mt-3 text-sm text-slate-300">{env.NEXT_PUBLIC_WEBHOOK_BASE_URL}</p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-lg font-medium text-white">Worker health</h2>
          <p className="mt-3 text-sm text-slate-300">{env.NEXT_PUBLIC_WORKER_HEALTH_URL}</p>
        </article>
      </section>
    </main>
  );
}
