"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, LoaderCircle, Pencil, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Category = { id: string; name: string; slug: string; description: string | null; parentId: string | null; archivedAt: string | null; path: { id: string; name: string; slug: string }[]; productCount: number; childCount: number };
type Props = { canCreate: boolean; canUpdate: boolean; canArchive: boolean };

export default function AdminProductCategoriesManagement({ canCreate, canUpdate, canArchive }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/v1/admin/product-categories", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load categories.");
    setCategories(data.flatCategories);
  }, []);
  useEffect(() => {
    let active = true;
    void fetch("/api/v1/admin/product-categories", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load categories.");
      if (active) setCategories(data.flatCategories);
    }).catch((error: unknown) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load categories."); });
    return () => { active = false; };
  }, []);
  function reset() { setEditing(null); setName(""); setSlug(""); setDescription(""); setParentId(""); }
  function beginEdit(category: Category) { setEditing(category); setName(category.name); setSlug(category.slug); setDescription(category.description ?? ""); setParentId(category.parentId ?? ""); }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch(editing ? `/api/v1/admin/product-categories/${editing.id}` : "/api/v1/admin/product-categories", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, description: description || null, parentId: parentId || null }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not save category.");
      toast.success(editing ? "Category updated" : "Category created"); reset(); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save category."); }
    finally { setBusy(false); }
  }
  async function setArchive(category: Category, action: "archive" | "restore") {
    setBusy(true);
    try { const response = await fetch(`/api/v1/admin/product-categories/${category.id}/${action}`, { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || `Could not ${action} category.`); toast.success(action === "archive" ? "Category archived" : "Category restored"); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : `Could not ${action} category.`); }
    finally { setBusy(false); }
  }
  const editIds = new Set(editing ? [editing.id, ...categories.filter((category) => category.path.some(({ id }) => id === editing.id)).map(({ id }) => id)] : []);
  return <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
    <div><h2 className="font-serif text-lg text-stone-900">Category hierarchy</h2><p className="mt-1 text-[11px] text-stone-500">Categories build the storefront navigation and breadcrumb path.</p></div>
    {(canCreate || (editing && canUpdate)) && <form onSubmit={save} className="grid gap-2 rounded-md bg-stone-50 p-3 sm:grid-cols-2">
      <input required minLength={2} maxLength={100} value={name} onChange={(event) => { setName(event.target.value); if (!editing) setSlug(event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} placeholder="Category name" className="h-9 rounded border border-stone-200 px-3 text-xs" />
      <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="category-slug" className="h-9 rounded border border-stone-200 px-3 text-xs" />
      <select value={parentId} onChange={(event) => setParentId(event.target.value)} className="h-9 rounded border border-stone-200 px-3 text-xs"><option value="">Root category</option>{categories.filter(({ archivedAt, id }) => !archivedAt && !editIds.has(id)).map((category) => <option key={category.id} value={category.id}>{category.path.map(({ name }) => name).join(" / ")}</option>)}</select>
      <input maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" className="h-9 rounded border border-stone-200 px-3 text-xs" />
      <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="inline-flex h-9 items-center gap-2 rounded bg-stone-900 px-3 text-xs text-white disabled:opacity-50">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : editing ? <Pencil className="size-3.5" /> : <Plus className="size-3.5" />}{editing ? "Save category" : "Add category"}</button>{editing && <button type="button" onClick={reset} className="h-9 rounded border border-stone-200 px-3 text-xs">Cancel</button>}</div>
    </form>}
    <div className="divide-y divide-stone-100 rounded border border-stone-100">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ paddingLeft: `${12 + (category.path.length - 1) * 20}px` }}>
      <div className="min-w-0"><p className={`truncate text-xs font-medium ${category.archivedAt ? "text-stone-400 line-through" : "text-stone-800"}`}>{category.name}<span className="ml-2 text-[10px] font-normal text-stone-400">{category.productCount} products · {category.childCount} children</span></p><p className="truncate text-[10px] text-stone-400">{category.path.map(({ name }) => name).join(" / ")} · /{category.slug}{category.archivedAt ? " · Archived" : ""}</p></div>
      <div className="flex shrink-0 gap-1">{canUpdate && !category.archivedAt && <button type="button" title="Edit category" onClick={() => beginEdit(category)} className="rounded p-2 text-stone-500 hover:bg-stone-100"><Pencil className="size-3.5" /></button>}{canArchive && (category.archivedAt ? <button type="button" disabled={busy} title="Restore category" onClick={() => void setArchive(category, "restore")} className="rounded p-2 text-stone-500 hover:bg-stone-100"><RotateCcw className="size-3.5" /></button> : <button type="button" disabled={busy || category.productCount > 0 || category.childCount > 0} title="Archive empty category" onClick={() => void setArchive(category, "archive")} className="rounded p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-30"><Archive className="size-3.5" /></button>)}</div>
    </div>)}{categories.length === 0 && <p className="p-6 text-center text-xs text-stone-500">No categories yet. Create the first one above.</p>}</div>
  </section>;
}
