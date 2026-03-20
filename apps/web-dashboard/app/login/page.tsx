import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "../../components/login-form";
import { getCurrentUser } from "../../lib/auth";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  return (
    <main className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <p className="text-sm uppercase tracking-[0.35em] text-sky-300">
          Night Manager Access
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">
          Sign in to the AI-native software delivery control plane
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          This MVP login flow uses password-based JWT authentication today and
          keeps the API boundaries clean so SSO can be added later without
          rewriting dashboard authorization rules.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-lg font-medium text-white">Protected areas</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Ticket write actions require an authorized role, while role and
              policy management stay admin-only.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-lg font-medium text-white">MVP approach</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Password auth is intentionally simple here. Session, token, and
              role boundaries are structured so SSO can slot in later.
            </p>
          </article>
        </div>

        <Link
          className="inline-flex rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          href="/"
        >
          Back to landing page
        </Link>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-sky-950/20">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Login</h2>
          <p className="text-sm leading-6 text-slate-400">
            Use one of the seeded MVP users to access the protected dashboard.
          </p>
        </div>

        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
