import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRoleCatalog,
  getRoleDetail,
  requireAdminUser,
  type RoleListItem
} from "../../../../lib/auth";

interface RoleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not published";
  }

  return new Date(value).toLocaleString();
}

function RoleList({ roles, selectedSlug }: { roles: RoleListItem[]; selectedSlug: string }) {
  return (
    <aside className="space-y-3">
      {roles.map((role) => {
        const isSelected = role.slug === selectedSlug;

        return (
          <Link
            key={role.slug}
            className={`block rounded-3xl border p-4 transition ${
              isSelected
                ? "border-sky-400 bg-sky-400/10"
                : "border-slate-800 bg-slate-950/70 hover:border-slate-600"
            }`}
            href={`/dashboard/roles/${role.slug}`}
          >
            <p className="text-sm font-semibold text-white">{role.title}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">{role.slug}</p>
            <p className="mt-3 text-sm text-slate-400">{role.description}</p>
            <p className="mt-4 text-xs text-slate-500">
              Version {role.activeVersion} | {role.fileName}
            </p>
          </Link>
        );
      })}
    </aside>
  );
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  await requireAdminUser();
  const { slug } = await params;
  const [roles, role] = await Promise.all([getRoleCatalog(), getRoleDetail(slug)]);

  if (!role) {
    notFound();
  }

  return (
    <main className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <RoleList roles={roles} selectedSlug={slug} />

      <section className="space-y-6">
        <article className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Role Profile</p>
              <h2 className="text-3xl font-semibold text-white">{role.title}</h2>
              <p className="max-w-3xl text-sm text-slate-400">{role.description}</p>
            </div>

            <div className="grid gap-2 text-sm text-slate-300">
              <p>Executor: {role.defaultExecutorType}</p>
              <p>Source: {role.source}</p>
              <p>Active version: {role.markdown.version}</p>
              <p>Published: {formatTimestamp(role.markdown.publishedAt)}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {role.sections.map((section) => (
              <span
                key={section.key}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
              >
                {section.heading}
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-white">Rendered instructions</h3>
              <p className="mt-2 text-sm text-slate-400">
                Trusted role markdown rendered from the shared catalog and synchronized metadata.
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>{role.markdown.fileName}</p>
              <p>{role.markdown.checksum}</p>
            </div>
          </div>

          <div
            className="mt-6 space-y-4 text-sm leading-7 text-slate-300 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_p]:my-3 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:text-slate-300"
            dangerouslySetInnerHTML={{ __html: role.markdown.renderedHtml }}
          />
        </article>

        <article className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-2xl font-semibold text-white">Raw markdown</h3>
          <p className="mt-2 text-sm text-slate-400">
            Exact source stored for agent execution, database sync, and version history.
          </p>

          <pre className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 p-5 text-sm leading-7 text-slate-300">
            <code>{role.markdown.rawMarkdown}</code>
          </pre>
        </article>

        <article className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
          <h3 className="text-2xl font-semibold text-white">Version history</h3>
          <div className="mt-6 space-y-3">
            {role.versions.map((version) => (
              <div
                key={version.id}
                className="flex flex-col gap-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    Version {version.version} {version.isActive ? "(Active)" : ""}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
                    {version.fileName}
                  </p>
                </div>
                <div className="text-sm text-slate-400">
                  <p>Published: {formatTimestamp(version.publishedAt)}</p>
                  <p>Checksum: {version.checksum}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
