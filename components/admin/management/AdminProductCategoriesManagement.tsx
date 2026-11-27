"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, ChevronDown, ChevronRight, LoaderCircle, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { apiResponseError, readApiResponse } from "@/lib/admin-api-response";

type Category = {
  id: string; name: string; slug: string; description: string | null; parentId: string | null;
  archivedAt: string | null; sortOrder: number; path: { id: string; name: string; slug: string }[];
  productCount: number; childCount: number;
};
type Props = { canCreate: boolean; canUpdate: boolean; canArchive: boolean };
type StatusFilter = "ALL" | "ACTIVE" | "ARCHIVED";
type CategoryDialogState = { mode: "create" } | { mode: "edit"; category: Category };
type CategoryFields = { name: string; slug: string; description: string; parentId: string; sortOrder: string };
type CategoryFieldErrors = Partial<Record<keyof CategoryFields, string>>;

const emptyFields: CategoryFields = { name: "", slug: "", description: "", parentId: "", sortOrder: "0" };
const fieldClass = "mt-1 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

function slugify(value: string) {
  return value.toLocaleLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminProductCategoriesManagement({ canCreate, canUpdate, canArchive }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<CategoryDialogState | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);
  const [fields, setFields] = useState<CategoryFields>(emptyFields);
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [busy, setBusy] = useState(false);
  const editorRef = useRef<HTMLDialogElement>(null);
  const archiveRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/v1/admin/product-categories", { cache: "no-store", signal });
    const data = await readApiResponse(response);
    if (!response.ok) throw new Error(apiResponseError(data, `Could not load categories (HTTP ${response.status}).`));
    if (!Array.isArray(data.flatCategories)) throw new Error("The category response is missing its category list.");
    const next = data.flatCategories as Category[];
    if (signal?.aborted) return;
    setCategories(next);
    setExpandedIds((current) => current.size ? current : new Set(next.filter(({ childCount }) => childCount > 0).map(({ id }) => id)));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/admin/product-categories", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(apiResponseError(data, `Could not load categories (HTTP ${response.status}).`));
      if (!Array.isArray(data.flatCategories)) throw new Error("The category response is missing its category list.");
      return data.flatCategories as Category[];
    }).then((next) => {
      if (controller.signal.aborted) return;
      setCategories(next);
      setExpandedIds(new Set(next.filter(({ childCount }) => childCount > 0).map(({ id }) => id)));
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) toast.error(error instanceof Error ? error.message : "Could not load categories.");
    });
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    const element = editorRef.current;
    if (dialog && element && !element.open) element.showModal();
    return () => { if (element?.open) element.close(); };
  }, [dialog]);

  useEffect(() => {
    const element = archiveRef.current;
    if (archiveTarget && element && !element.open) element.showModal();
    return () => { if (element?.open) element.close(); };
  }, [archiveTarget]);

  const excludedParentIds = useMemo(() => new Set(dialog?.mode === "edit" && dialog.category
    ? [dialog.category.id, ...categories.filter((category) => category.path.some(({ id }) => id === dialog.category?.id)).map(({ id }) => id)]
    : []), [categories, dialog]);

  const visibleIds = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matches = categories.filter((category) => {
      const statusMatches = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? !category.archivedAt : Boolean(category.archivedAt));
      const textMatches = !query || category.name.toLocaleLowerCase().includes(query) || category.slug.toLocaleLowerCase().includes(query) || category.path.some(({ name: ancestor }) => ancestor.toLocaleLowerCase().includes(query));
      return statusMatches && textMatches;
    });
    return new Set(matches.flatMap((category) => [...category.path.map(({ id }) => id), category.id]));
  }, [categories, search, statusFilter]);

  function openCreate(parentId = "") {
    setDialog({ mode: "create" });
    setFields({ ...emptyFields, parentId });
    setFieldErrors({});
    setSlugManuallyEdited(false);
  }

  function openEdit(category: Category) {
    setDialog({ mode: "edit", category });
    setFields({ name: category.name, slug: category.slug, description: category.description ?? "", parentId: category.parentId ?? "", sortOrder: String(category.sortOrder) });
    setFieldErrors({});
    setSlugManuallyEdited(true);
  }

  function closeEditor() {
    if (busy) return;
    setDialog(null);
    setFieldErrors({});
  }

  function updateField<K extends keyof CategoryFields>(key: K, value: CategoryFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validateFields(): CategoryFieldErrors {
    const errors: CategoryFieldErrors = {};
    const name = fields.name.trim();
    if (name.length < 2 || name.length > 100) errors.name = "Enter a name between 2 and 100 characters.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug) || fields.slug.length > 120) errors.slug = "Use lowercase letters, numbers, and single hyphens.";
    if (fields.description.length > 5000) errors.description = "Description must be 5,000 characters or fewer.";
    const order = Number(fields.sortOrder);
    if (!Number.isInteger(order) || order < -100000 || order > 100000) errors.sortOrder = "Enter a whole number from -100,000 to 100,000.";
    if (fields.parentId) {
      const parent = categories.find(({ id }) => id === fields.parentId);
      const parentIsActive = parent && !parent.archivedAt && parent.path.every(({ id }) => !categories.find((item) => item.id === id)?.archivedAt);
      if (!parent || !parentIsActive || excludedParentIds.has(fields.parentId)) errors.parentId = "Choose an active category outside this category’s subtree.";
    }
    return errors;
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    if (!dialog) return;
    setBusy(true);
    const isEditing = dialog.mode === "edit" && dialog.category;
    try {
      const response = await fetch(isEditing ? `/api/v1/admin/product-categories/${dialog.category.id}` : "/api/v1/admin/product-categories", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fields.name.trim(), slug: fields.slug, description: fields.description.trim() || null, parentId: fields.parentId || null, sortOrder: Number(fields.sortOrder) }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) {
        const serverFields = data.fields && typeof data.fields === "object" ? data.fields as Record<string, unknown> : null;
        const nextErrors: CategoryFieldErrors = {};
        for (const key of ["name", "slug", "description", "parentId", "sortOrder"] as const) {
          const messages = serverFields?.[key];
          if (Array.isArray(messages) && typeof messages[0] === "string") nextErrors[key] = messages[0];
        }
        if (Object.keys(nextErrors).length) setFieldErrors(nextErrors);
        throw new Error(apiResponseError(data, `Could not save category (HTTP ${response.status}).`));
      }
      setDialog(null);
      toast.success(isEditing ? "Category updated" : "Category created");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save category.");
    } finally {
      setBusy(false);
    }
  }

  async function setArchive(category: Category, action: "archive" | "restore") {
    if (action === "archive") setArchiveTarget(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/admin/product-categories/${category.id}/${action}`, { method: "POST" });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(apiResponseError(data, `Could not ${action} category (HTTP ${response.status}).`));
      toast.success(action === "archive" ? "Category archived" : "Category restored");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Could not ${action} category.`);
    } finally {
      setBusy(false);
    }
  }

  function renderChildren(parentId: string | null, depth: number): React.ReactNode {
    return categories.filter((category) => category.parentId === parentId && visibleIds.has(category.id)).map((category) => {
      const hasVisibleChildren = categories.some((child) => child.parentId === category.id && visibleIds.has(child.id));
      const expanded = search.trim() ? true : expandedIds.has(category.id);
      return <div key={category.id}>
        <div className="flex min-h-14 items-center justify-between gap-2 border-b border-stone-100 px-3 py-2" style={{ paddingLeft: `${12 + depth * 20}px` }}>
          <div className="flex min-w-0 items-center gap-2">
            {hasVisibleChildren ? <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${category.name}`} aria-expanded={expanded} onClick={() => setExpandedIds((current) => { const next = new Set(current); if (expanded) next.delete(category.id); else next.add(category.id); return next; })} className="rounded p-1 text-stone-500 hover:bg-stone-100">{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</button> : <span className="w-6 shrink-0" />}
            <div className="min-w-0"><p className={`truncate text-xs font-medium ${category.archivedAt ? "text-stone-400" : "text-stone-800"}`}>{category.name}<span className="ml-2 text-[10px] font-normal text-stone-400">{category.productCount} products</span></p><p className="truncate text-[10px] text-stone-400">{category.path.map(({ name: part }) => part).join(" / ")} · /{category.slug}</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5"><span className={`hidden rounded-full px-2 py-1 text-[9px] sm:inline-flex ${category.archivedAt ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-700"}`}>{category.archivedAt ? "Archived" : "Active"}</span><div className="flex gap-0.5">
            {canCreate && !category.archivedAt && <button type="button" aria-label={`Add child category under ${category.name}`} title="Add child category" disabled={busy} onClick={() => openCreate(category.id)} className="rounded p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40"><Plus className="size-3.5" /></button>}
            {canUpdate && !category.archivedAt && <button type="button" aria-label={`Edit ${category.name}`} title="Edit category" disabled={busy} onClick={() => openEdit(category)} className="rounded p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40"><Pencil className="size-3.5" /></button>}
            {canArchive && (category.archivedAt ? <button type="button" aria-label={`Restore ${category.name}`} title="Restore category" disabled={busy} onClick={() => void setArchive(category, "restore")} className="rounded p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40"><RotateCcw className="size-3.5" /></button> : <button type="button" aria-label={`Archive ${category.name}`} title="Archive category" disabled={busy} onClick={() => setArchiveTarget(category)} className="rounded p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40"><Archive className="size-3.5" /></button>)}
          </div></div>
        </div>
        {expanded && renderChildren(category.id, depth + 1)}
      </div>;
    });
  }

  const inputError = (field: keyof CategoryFields) => fieldErrors[field] ? <p id={`category-${field}-error`} className="mt-1 text-xs text-red-700">{fieldErrors[field]}</p> : null;
  const editMode = dialog?.mode === "edit";

  return <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
    <div className="flex items-start justify-between gap-4"><div><h2 className="font-serif text-lg text-stone-900">Category hierarchy</h2><p className="mt-1 text-[11px] text-stone-500">Create and move categories, control their order, and manage storefront visibility.</p></div>{canCreate && <button type="button" onClick={() => openCreate()} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-stone-900 px-3 text-xs text-white transition hover:bg-stone-700"><Plus className="size-3.5" /><span className="hidden sm:inline">Add Category</span><span className="sm:hidden">Add</span></button>}</div>
    <div className="grid gap-2 sm:grid-cols-[1fr_180px]"><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search categories" placeholder="Search name, slug, or path" className="h-9 min-w-0 rounded-md border border-stone-200 px-3 text-xs outline-none focus:border-stone-500" /><select aria-label="Filter category status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-9 rounded-md border border-stone-200 px-3 text-xs"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></div>
    <div className="overflow-hidden rounded-md border border-stone-100">{renderChildren(null, 0)}{!visibleIds.size && <p className="p-6 text-center text-xs text-stone-500">No categories match these filters.</p>}</div>

    {dialog && <dialog ref={editorRef} aria-labelledby="category-dialog-title" onCancel={(event) => { event.preventDefault(); closeEditor(); }} onClick={(event) => { if (event.target === event.currentTarget) closeEditor(); }} className="fixed inset-0 m-auto max-h-[min(92dvh,760px)] w-[min(94vw,560px)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/40">
      <form onSubmit={save} noValidate className="flex max-h-[min(92dvh,760px)] flex-col">
        <header className="flex items-start justify-between border-b border-stone-100 px-5 py-4 sm:px-6"><div><h3 id="category-dialog-title" className="font-serif text-xl">{editMode ? "Edit category" : "Create category"}</h3><p className="mt-1 text-xs text-stone-500">Set the category details and its place in the store hierarchy.</p></div><button type="button" disabled={busy} aria-label="Close dialog" onClick={closeEditor} className="rounded-md p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40"><X className="size-4" /></button></header>
        <div className="grid gap-4 overflow-y-auto px-5 py-5 sm:px-6">
          <label htmlFor="category-name" className="text-xs font-medium text-stone-700">Category Name <span className="text-red-700">*</span><input autoFocus id="category-name" required minLength={2} maxLength={100} value={fields.name} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "category-name-error" : undefined} onChange={(event) => { const nextName = event.target.value; updateField("name", nextName); if (!slugManuallyEdited) updateField("slug", slugify(nextName)); }} className={fieldClass} placeholder="e.g. Linen dresses" />{inputError("name")}</label>
          <label htmlFor="category-slug" className="text-xs font-medium text-stone-700">Slug <span className="text-red-700">*</span><input id="category-slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={fields.slug} aria-invalid={Boolean(fieldErrors.slug)} aria-describedby={fieldErrors.slug ? "category-slug-error" : undefined} onChange={(event) => { setSlugManuallyEdited(true); updateField("slug", event.target.value); }} className={fieldClass} placeholder="linen-dresses" />{inputError("slug")}</label>
          <label htmlFor="category-description" className="text-xs font-medium text-stone-700">Description <span className="font-normal text-stone-400">(optional)</span><textarea id="category-description" rows={3} maxLength={5000} value={fields.description} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "category-description-error" : undefined} onChange={(event) => updateField("description", event.target.value)} className="mt-1 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200" placeholder="A short description for this category" />{inputError("description")}</label>
          <label htmlFor="category-parent" className="text-xs font-medium text-stone-700">Parent Category <span className="font-normal text-stone-400">(optional)</span><select id="category-parent" value={fields.parentId} aria-invalid={Boolean(fieldErrors.parentId)} aria-describedby={fieldErrors.parentId ? "category-parentId-error" : undefined} onChange={(event) => updateField("parentId", event.target.value)} className={fieldClass}><option value="">None — root category</option>{categories.filter((candidate) => {
            const activePath = !candidate.archivedAt && candidate.path.every(({ id }) => !categories.find((item) => item.id === id)?.archivedAt);
            return activePath && !excludedParentIds.has(candidate.id);
          }).map((category) => <option key={category.id} value={category.id}>{category.path.map(({ name }) => name).join(" / ")}</option>)}</select>{inputError("parentId")}</label>
          <label htmlFor="category-sort-order" className="text-xs font-medium text-stone-700">Sort Order<input id="category-sort-order" type="number" min={-100000} max={100000} step={1} value={fields.sortOrder} aria-invalid={Boolean(fieldErrors.sortOrder)} aria-describedby={fieldErrors.sortOrder ? "category-sortOrder-error" : undefined} onChange={(event) => updateField("sortOrder", event.target.value)} className={fieldClass} />{inputError("sortOrder")}</label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-stone-100 px-5 py-4 sm:px-6"><button type="button" disabled={busy} onClick={closeEditor} className="h-10 rounded-md border border-stone-200 px-4 text-xs text-stone-700 hover:bg-stone-50 disabled:opacity-40">Cancel</button><button type="submit" disabled={busy} className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-md bg-stone-900 px-4 text-xs text-white hover:bg-stone-700 disabled:opacity-50">{busy && <LoaderCircle className="size-3.5 animate-spin" />}{busy ? "Saving…" : editMode ? "Save Changes" : "Create Category"}</button></footer>
      </form>
    </dialog>}

    {archiveTarget && <dialog ref={archiveRef} aria-labelledby="archive-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) setArchiveTarget(null); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) setArchiveTarget(null); }} className="fixed inset-0 m-auto w-[min(92vw,440px)] rounded-lg border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/40">
      <div className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="rounded-full bg-stone-100 p-2 text-stone-700"><Archive className="size-4" /></span><div><h3 id="archive-dialog-title" className="font-serif text-lg">Archive category?</h3><p className="mt-2 text-sm leading-6 text-stone-600"><span className="font-medium text-stone-800">{archiveTarget.name}</span> will be hidden from the storefront. It will remain in the database and can be restored later.</p><p className="mt-2 text-xs text-stone-500">Categories with assigned products or active child categories cannot be archived.</p></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setArchiveTarget(null)} className="h-9 rounded-md border border-stone-200 px-3 text-xs text-stone-700 hover:bg-stone-50">Cancel</button><button type="button" disabled={busy} onClick={() => void setArchive(archiveTarget, "archive")} className="inline-flex h-9 items-center gap-2 rounded-md bg-stone-900 px-3 text-xs text-white hover:bg-stone-700 disabled:opacity-50">{busy && <LoaderCircle className="size-3.5 animate-spin" />}Archive Category</button></div></div>
    </dialog>}
  </section>;
}
