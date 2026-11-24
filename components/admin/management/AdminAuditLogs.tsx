"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type AuditRecord = {
  id: string; actorName: string | null; actorEmail: string | null; actorRoles: unknown;
  action: string; category: string; riskLevel: string; description: string;
  targetType: string; targetId: string | null; targetName: string | null; targetEmail: string | null;
  roleId: string | null; roleName: string | null; permissionKey: string | null;
  beforeState: unknown; afterState: unknown; changedFields: unknown;
  requestIp: string | null; userAgent: string | null; requestId: string | null;
  success: boolean; failureCode: string | null; createdAt: string;
};

const dateDhaka = (value: string) => new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka",
}).format(new Date(value));

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [risk, setRisk] = useState("");
  const [permissionKey, setPermissionKey] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextPage = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(nextPage), pageSize: "25" });
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (risk) params.set("risk", risk);
    if (permissionKey.trim()) params.set("permissionKey", permissionKey.trim());
    if (role.trim()) params.set("role", role.trim());
    if (action.trim()) params.set("action", action.trim());
    if (from) params.set("from", new Date(`${from}T00:00:00+06:00`).toISOString());
    if (to) params.set("to", new Date(`${to}T23:59:59.999+06:00`).toISOString());
    try {
      const response = await fetch(`/api/v1/admin/audit-logs?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load audit logs.");
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(Math.max(data.totalPages, 1));
      setPage(data.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load audit logs.");
    } finally { setLoading(false); }
  }, [page, q, category, risk, permissionKey, role, action, from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(1); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-xl border border-stone-200 bg-white">
      <div className="grid gap-3 border-b border-stone-100 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search actor, target, event" className="h-10 rounded-md border border-stone-200 px-3 text-sm" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-stone-200 px-3 text-sm">
          <option value="">All categories</option><option value="RBAC">Role & permissions</option><option value="USER_ACCESS">User access</option><option value="INVITATION">Invitations</option><option value="AUTHORIZATION">Authorization</option>
        </select>
        <select value={risk} onChange={(event) => setRisk(event.target.value)} className="h-10 rounded-md border border-stone-200 px-3 text-sm">
          <option value="">All risk levels</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
        </select>
        <div className="flex gap-2"><input value={permissionKey} onChange={(event) => setPermissionKey(event.target.value)} placeholder="Permission key" className="h-10 min-w-0 flex-1 rounded-md border border-stone-200 px-3 text-sm" /><button type="button" onClick={() => void load(1)} className="rounded-md bg-stone-900 px-4 text-xs font-medium text-white">Filter</button></div>
        <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role name" className="h-10 rounded-md border border-stone-200 px-3 text-sm" />
        <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Action (e.g. role.updated)" className="h-10 rounded-md border border-stone-200 px-3 text-sm" />
        <label className="flex items-center gap-2 text-[10px] text-stone-500">From <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-10 min-w-0 rounded-md border border-stone-200 px-2 text-xs text-stone-800" /></label>
        <label className="flex items-center gap-2 text-[10px] text-stone-500">To <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-10 min-w-0 rounded-md border border-stone-200 px-2 text-xs text-stone-800" /></label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500"><tr><th className="px-4 py-3">Time (Dhaka)</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500">Loading audit history…</td></tr> : logs.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500">No matching activity found.</td></tr> : logs.map((log) => (
              <tr key={log.id} className="hover:bg-stone-50/70"><td className="whitespace-nowrap px-4 py-3 text-stone-500">{dateDhaka(log.createdAt)}</td><td className="px-4 py-3"><span className="block font-medium text-stone-800">{log.actorName ?? "Unknown"}</span><span className="text-stone-500">{log.actorEmail ?? "—"}</span></td><td className="px-4 py-3"><span className="block font-medium text-stone-800">{log.action}</span><span className="text-stone-500">{log.description}</span>{log.permissionKey && <span className="mt-1 block font-mono text-[10px] text-stone-500">{log.permissionKey}</span>}</td><td className="px-4 py-3">{log.targetName ?? log.targetEmail ?? log.targetType}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${log.riskLevel === "CRITICAL" ? "bg-rose-100 text-rose-700" : log.riskLevel === "HIGH" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>{log.riskLevel}</span></td><td className="px-4 py-3 text-right"><button type="button" onClick={() => setSelected(log)} className="font-medium text-stone-700 underline underline-offset-2">Details</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 text-xs text-stone-500"><span>{total} events</span><div className="flex items-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)} className="disabled:opacity-40">Previous</button><span>{page} / {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => void load(page + 1)} className="disabled:opacity-40">Next</button></div></div>
      {selected && <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-label="Audit event details"><div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-widest text-stone-500">Audit event</p><h2 className="mt-1 text-lg font-medium">{selected.action}</h2></div><button type="button" onClick={() => setSelected(null)} className="rounded border px-3 py-1 text-sm">Close</button></div><p className="mt-2 text-sm text-stone-600">{selected.description}</p><dl className="mt-5 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-stone-500">Actor</dt><dd className="mt-1">{selected.actorName} · {selected.actorEmail}</dd></div><div><dt className="text-stone-500">Target</dt><dd className="mt-1">{selected.targetName ?? selected.targetEmail ?? selected.targetType}</dd></div><div><dt className="text-stone-500">Time</dt><dd className="mt-1">{dateDhaka(selected.createdAt)} BST</dd></div><div><dt className="text-stone-500">Request IP / ID</dt><dd className="mt-1 break-all">{selected.requestIp ?? "—"} · {selected.requestId ?? "—"}</dd></div><div><dt className="text-stone-500">Role / permission</dt><dd className="mt-1">{selected.roleName ?? "—"} · {selected.permissionKey ?? "—"}</dd></div><div><dt className="text-stone-500">User agent</dt><dd className="mt-1 break-all">{selected.userAgent ?? "—"}</dd></div></dl>{(["beforeState", "afterState", "changedFields", "actorRoles"] as const).map((key) => <section key={key} className="mt-5"><h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</h3><pre className="overflow-auto rounded-md bg-stone-50 p-3 text-[11px]">{JSON.stringify(selected[key], null, 2) ?? "—"}</pre></section>)}</aside></div>}
    </section>
  );
}
