"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Copy, Eye, LoaderCircle, Package, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import AdminDialog from "@/components/admin/management/AdminDialog";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import AdminProductEditorDialog, { type AdminProductDTO, type ProductSaveInput } from "@/components/admin/management/AdminProductEditorDialog";
import AdminProductCategoriesManagement from "@/components/admin/management/AdminProductCategoriesManagement";

type Category = { id: string; name: string; slug: string; parentId: string | null; path: { name: string }[] };
type CatalogResponse = {
  products: AdminProductDTO[];
  categories: Category[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  stats: { total: number; active: number; drafts: number; archived: number; outOfStock: number };
};

type Props = {
  canCreate: boolean;
  canUpdate: boolean;
  canArchive: boolean;
  canAdjustInventory: boolean;
};

const money = (amount: string, currency: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(Number(amount));

export default function AdminProductsManagement({ canCreate, canUpdate, canArchive, canAdjustInventory }: Props) {
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("ALL");
  const [availability, setAvailability] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState<AdminProductDTO | null | undefined>(undefined);
  const [detailsProduct, setDetailsProduct] = useState<AdminProductDTO | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "20", sort, direction, status });
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("category", category);
    if (availability) params.set("availability", availability);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return params.toString();
  }, [page, sort, direction, status, search, category, availability, minPrice, maxPrice]);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/admin/products?${query}`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load products.");
      setCatalog(data as CatalogResponse);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      const message = cause instanceof Error ? cause.message : "Could not load products.";
      setError(message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadProducts(controller.signal), search ? 250 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadProducts, search]);

  async function saveProduct(payload: ProductSaveInput) {
    const isEdit = Boolean(editingProduct);
    const response = await fetch(isEdit ? `/api/v1/admin/products/${editingProduct!.id}` : "/api/v1/admin/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save the product.");
    toast.success(isEdit ? "Product changes saved" : "Product created");
    await loadProducts();
  }

  async function changeArchiveState(product: AdminProductDTO, action: "archive" | "restore") {
    if (action === "archive" && !window.confirm(`Archive “${product.title}”? It will no longer appear in normal storefront listings. Existing product data and order history are preserved.`)) return;
    setPendingAction(`${action}:${product.id}`);
    try {
      const response = await fetch(`/api/v1/admin/products/${product.id}/${action}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Could not ${action} product.`);
      toast.success(action === "archive" ? "Product archived" : "Product restored");
      await loadProducts();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : `Could not ${action} product.`);
    } finally {
      setPendingAction(null);
    }
  }

  async function copyProductLink(product: AdminProductDTO) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/products/${product.slug}`);
      toast.success("Product link copied");
    } catch {
      toast.error("Could not copy the product link.");
    }
  }

  if (loading && !catalog) return <AdminModuleSkeleton pageKey="products" />;
  const categoryOptions = (catalog?.categories ?? []).map((entry) => ({ id: entry.id, label: entry.path.map(({ name }) => name).join(" / ") }));

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-stone-200"><button type="button" onClick={() => setActiveTab("products")} className={`px-3 py-2 text-xs ${activeTab === "products" ? "border-b-2 border-stone-900 font-semibold text-stone-900" : "text-stone-500"}`}>Products</button><button type="button" onClick={() => setActiveTab("categories")} className={`px-3 py-2 text-xs ${activeTab === "categories" ? "border-b-2 border-stone-900 font-semibold text-stone-900" : "text-stone-500"}`}>Categories</button></div>
      {activeTab === "categories" ? <AdminProductCategoriesManagement canCreate={canCreate} canUpdate={canUpdate} canArchive={canArchive} /> : <>
      <section aria-label="Product statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Total products" value={catalog?.stats.total ?? 0} />
        <Stat label="Published" value={catalog?.stats.active ?? 0} />
        <Stat label="Drafts" value={catalog?.stats.drafts ?? 0} />
        <Stat label="Archived" value={catalog?.stats.archived ?? 0} />
        <Stat label="Out of stock" value={catalog?.stats.outOfStock ?? 0} />
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="space-y-3 border-b border-stone-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-serif text-lg text-stone-900">Product catalog</h2><p className="mt-1 text-[11px] text-stone-500">{catalog?.pagination.total ?? 0} matching product{catalog?.pagination.total === 1 ? "" : "s"}</p></div>
            {canCreate && <button type="button" onClick={() => setEditingProduct(null)} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-stone-900 px-3.5 text-xs font-medium text-white hover:bg-stone-700"><Plus className="size-3.5" />Create product</button>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <label className="relative"><span className="sr-only">Search products</span><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, SKU, or slug" className="h-9 w-full rounded-md border border-stone-200 pl-9 pr-3 text-xs outline-none focus:border-stone-500" /></label>
            <select aria-label="Filter by category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-9 rounded-md border border-stone-200 px-3 text-xs"><option value="">All categories</option>{catalog?.categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.path.map(({ name }) => name).join(" / ")}</option>)}</select>
            <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-9 rounded-md border border-stone-200 px-3 text-xs"><option value="ALL">All statuses</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select>
            <select aria-label="Filter stock availability" value={availability} onChange={(event) => { setAvailability(event.target.value); setPage(1); }} className="h-9 rounded-md border border-stone-200 px-3 text-xs"><option value="">Any availability</option><option value="IN_STOCK">In stock</option><option value="OUT_OF_STOCK">Out of stock</option></select>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.3fr_auto]">
            <input aria-label="Minimum price" type="number" min="0" step="0.01" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setPage(1); }} placeholder="Min price" className="h-9 rounded-md border border-stone-200 px-3 text-xs" />
            <input aria-label="Maximum price" type="number" min="0" step="0.01" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} placeholder="Max price" className="h-9 rounded-md border border-stone-200 px-3 text-xs" />
            <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 rounded-md border border-stone-200 px-3 text-xs"><option value="createdAt">Created date</option><option value="name">Name</option><option value="price">Price</option></select>
            <button type="button" onClick={() => setDirection((current) => current === "asc" ? "desc" : "asc")} className="h-9 rounded-md border border-stone-200 px-3 text-[10px] text-stone-600">{direction === "asc" ? "Ascending" : "Descending"}</button>
          </div>
        </div>

        {error && <div role="alert" className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}<button type="button" onClick={() => void loadProducts()} className="ml-2 underline">Try again</button></div>}
        {loading && catalog && <div className="flex items-center gap-2 px-5 py-2 text-[10px] text-stone-500"><LoaderCircle className="size-3.5 animate-spin" />Updating results…</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.12em] text-stone-500"><tr><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Created</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {catalog?.products.map((product) => {
                const sku = product.variants.find(({ sku: value, isActive }) => value && isActive)?.sku;
                const stock = product.stockCount;
                const working = pendingAction?.endsWith(`:${product.id}`) ?? false;
                return <tr key={product.id} className="align-middle hover:bg-stone-50/60">
                  <td className="px-4 py-3"><div className="flex min-w-56 items-center gap-3"><div className="relative size-11 shrink-0 overflow-hidden rounded bg-stone-100">{product.images[0] ? <Image src={product.images[0].secureUrl} alt={product.title} fill sizes="44px" className="object-cover" /> : <Package className="absolute inset-0 m-auto size-4 text-stone-300" />}</div><div className="min-w-0"><p className="max-w-64 truncate font-medium text-stone-800">{product.title}</p><p className="mt-0.5 max-w-64 truncate text-[10px] text-stone-400">/{product.slug}</p></div></div></td>
                  <td className="px-4 py-3 font-mono text-[10px] text-stone-500">{sku ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">{product.category.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-800">{money(product.price, product.currency)}</td>
                  <td className="px-4 py-3"><span className={stock > 0 ? "text-emerald-700" : "text-amber-700"}>{stock > 0 ? `${stock} units` : "Out of stock"}</span></td>
                  <td className="px-4 py-3"><Status status={product.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-[10px] text-stone-500">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(product.createdAt))}</td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1"><IconButton label="View details" onClick={() => setDetailsProduct(product)}><Eye className="size-3.5" /></IconButton>{canUpdate && product.status !== "ARCHIVED" && <IconButton label="Edit product" onClick={() => setEditingProduct(product)}><Pencil className="size-3.5" /></IconButton>}<IconButton label="Copy product link" onClick={() => void copyProductLink(product)}><Copy className="size-3.5" /></IconButton>{canArchive && (product.status === "ARCHIVED" ? <IconButton label="Restore product" disabled={working} onClick={() => void changeArchiveState(product, "restore")}>{working ? <LoaderCircle className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}</IconButton> : <IconButton label="Archive product" disabled={working} onClick={() => void changeArchiveState(product, "archive")}>{working ? <LoaderCircle className="size-3.5 animate-spin" /> : <Archive className="size-3.5" />}</IconButton>)}</div></td>
                </tr>;
              })}
              {!loading && catalog?.products.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center"><Package className="mx-auto size-7 text-stone-300" /><p className="mt-3 text-sm font-medium text-stone-700">No products found</p><p className="mt-1 text-xs text-stone-500">Create a product or change the search filters.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-stone-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-stone-500">Page {catalog?.pagination.page ?? 1} of {Math.max(1, catalog?.pagination.totalPages ?? 1)} · {catalog?.pagination.total ?? 0} products</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="h-8 rounded border border-stone-200 px-3 text-[10px] disabled:opacity-40">Previous</button><button type="button" disabled={page >= (catalog?.pagination.totalPages ?? 1) || loading} onClick={() => setPage((current) => current + 1)} className="h-8 rounded border border-stone-200 px-3 text-[10px] disabled:opacity-40">Next</button></div></div>
      </section>

      {editingProduct !== undefined && <AdminProductEditorDialog product={editingProduct} categories={categoryOptions} canAdjustInventory={canAdjustInventory} onClose={() => setEditingProduct(undefined)} onSave={saveProduct} />}
      {detailsProduct && <ProductDetailsDialog product={detailsProduct} onClose={() => setDetailsProduct(null)} />}
      </>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-[10px] font-medium text-stone-500">{label}</p><p className="mt-2 font-serif text-2xl text-stone-900">{value.toLocaleString("en-GB")}</p></div>;
}

function Status({ status }: { status: AdminProductDTO["status"] }) {
  const styles = status === "PUBLISHED" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "DRAFT" ? "border-stone-200 bg-stone-50 text-stone-600" : "border-amber-200 bg-amber-50 text-amber-800";
  const label = status === "PUBLISHED" ? "Published" : status === "DRAFT" ? "Draft" : "Archived";
  return <span className={`rounded-full border px-2 py-1 text-[9px] font-medium ${styles}`}>{label}</span>;
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="flex size-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40">{children}</button>;
}

function ProductDetailsDialog({ product, onClose }: { product: AdminProductDTO; onClose: () => void }) {
  return <AdminDialog title={product.title} description={`${product.category.name} · ${product.slug}`} onClose={onClose} size="xl"><div className="max-h-[75dvh] space-y-5 overflow-y-auto p-5 sm:p-6"><div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_1.2fr]"><div className="grid grid-cols-2 gap-2">{product.images.map((image) => <div key={image.id} className="relative aspect-[3/4] overflow-hidden rounded bg-stone-100"><Image src={image.secureUrl} alt={image.altText || product.title} fill sizes="300px" className="object-cover" /></div>)}{product.images.length === 0 && <div className="flex aspect-[3/4] items-center justify-center rounded bg-stone-100 text-stone-300"><Package className="size-8" /></div>}</div><div className="space-y-4"><div className="flex items-center gap-2"><Status status={product.status} /><span className="text-[10px] text-stone-500">{product.gender.toLowerCase()}</span></div><p className="font-serif text-2xl">{money(product.price, product.currency)}</p>{product.multibuyPrice && <p className="text-xs text-stone-500">Multibuy {money(product.multibuyPrice, product.currency)}</p>}<p className="whitespace-pre-wrap text-xs leading-6 text-stone-600">{product.description}</p><div><p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Tags</p><div className="mt-2 flex flex-wrap gap-1.5">{product.tags.map((tag) => <span key={tag} className="rounded bg-stone-100 px-2 py-1 text-[9px] text-stone-600">{tag}</span>)}</div></div></div></div><div><h3 className="mb-2 text-xs font-semibold text-stone-800">Variants · {product.stockCount} units</h3>{product.variants.length ? <div className="overflow-x-auto rounded-md border border-stone-200"><table className="w-full text-left text-[10px]"><thead className="bg-stone-50 text-stone-500"><tr><th className="p-2.5">Variant</th><th className="p-2.5">SKU</th><th className="p-2.5">Size / Color</th><th className="p-2.5">Stock</th><th className="p-2.5">State</th></tr></thead><tbody className="divide-y divide-stone-100">{product.variants.map((variant) => <tr key={variant.id}><td className="p-2.5">{variant.name}</td><td className="p-2.5 font-mono">{variant.sku || "—"}</td><td className="p-2.5">{[variant.size, variant.colorName].filter(Boolean).join(" · ") || "—"}</td><td className="p-2.5">{variant.stockQuantity}</td><td className="p-2.5">{variant.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div> : <p className="rounded border border-dashed border-stone-200 p-3 text-[10px] text-stone-500">No variants are configured.</p>}</div><div className="flex justify-end border-t border-stone-100 pt-4"><button type="button" onClick={onClose} className="h-9 rounded-md border border-stone-200 px-4 text-xs">Close</button></div></div></AdminDialog>;
}
