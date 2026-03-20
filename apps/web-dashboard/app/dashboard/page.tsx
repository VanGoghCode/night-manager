import { getDashboardTickets } from "../../lib/auth";

function formatLabel(value: string | null) {
  if (!value) {
    return "Unassigned";
  }

  return value.replaceAll("_", " ");
}

export default async function DashboardPage() {
  const tickets = await getDashboardTickets();

  return (
    <main className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Tickets</p>
          <p className="mt-3 text-4xl font-semibold text-white">{tickets.length}</p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Default flow</p>
          <p className="mt-3 text-lg font-medium text-white">Workflow-backed delivery</p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Policies</p>
          <p className="mt-3 text-lg font-medium text-white">RBAC + branch/commit/PR checks</p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Assigned ticket queue</h2>
            <p className="mt-2 text-sm text-slate-400">
              This view is protected by the API auth guard and backed by the seeded MVP data.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {tickets.length ? (
            tickets.map((ticket) => (
              <article
                key={ticket.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
                      {ticket.id}
                    </p>
                    <h3 className="text-xl font-medium text-white">{ticket.title}</h3>
                    <p className="text-sm text-slate-400">
                      Module: {ticket.module?.name ?? "Not linked"} | Repository:{" "}
                      {ticket.repository?.name ?? "Not linked"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200">
                      {formatLabel(ticket.type)}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200">
                      {formatLabel(ticket.status)}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200">
                      {formatLabel(ticket.priority)}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200">
                      {formatLabel(ticket.assignedRole)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  Workflow state: {ticket.workflowState?.name ?? "Not set"}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-400">
              No tickets are available for the current workspace yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
