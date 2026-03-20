import { redirect } from "next/navigation";
import { getRoleCatalog, requireAdminUser } from "../../../lib/auth";

export default async function RolesIndexPage() {
  await requireAdminUser();
  const roles = await getRoleCatalog();
  const firstRole = roles[0];

  if (!firstRole) {
    return (
      <main className="rounded-[2rem] border border-dashed border-slate-700 bg-slate-950/70 p-8 text-sm text-slate-400">
        No role instructions are available yet. Run the role sync to populate the catalog.
      </main>
    );
  }

  redirect(`/dashboard/roles/${firstRole.slug}`);
}
