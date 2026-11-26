"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminDialog from "@/components/admin/management/AdminDialog";

export type ProductImageDraft = {
  id: string;
  secureUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type ProductVariantDraft = {
  id?: string;
  name: string;
  sku: string | null;
  size: string | null;
  colorName: string | null;
  colorHex: string | null;
  priceOverride: string | null;
  stockQuantity: number;
  isActive?: boolean;
  images?: ProductImageDraft[];
  primaryImageId?: string | null;
};

export type AdminProductDTO = {
  id: string;
  title: string;
  slug: string;
  description: string;
  detailsAndCare: string[];
  gender: "MEN" | "WOMEN" | "UNISEX" | "KIDS";
  category: { id: string; name: string; slug: string };
  price: string;
  multibuyPrice: string | null;
  currency: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tags: string[];
  isNew: boolean;
  bestsellerRank: number | null;
  stockCount: number;
  images: ProductImageDraft[];
  variants: ProductVariantDraft[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type ProductSaveInput = {
  title: string;
  slug: string;
  description: string;
  detailsAndCare: string[];
  gender: "MEN" | "WOMEN" | "UNISEX" | "KIDS";
  categoryId: string;
  price: string;
  multibuyPrice: string | null;
  currency: "GBP" | "USD" | "EUR" | "BDT";
  status: "DRAFT" | "PUBLISHED";
  tags: string[];
  isNew: boolean;
  bestsellerRank: number | null;
  variants: ProductVariantDraft[];
  images: { id: string; altText: string | null }[];
  primaryImageId: string | null;
};

type Props = {
  product: AdminProductDTO | null;
  categories: { id: string; label: string }[];
  canAdjustInventory: boolean;
  onClose: () => void;
  onSave: (payload: ProductSaveInput) => Promise<void>;
};

const emptyVariant = (index: number): ProductVariantDraft => ({
  name: `Variant ${index + 1}`,
  sku: null,
  size: null,
  colorName: null,
  colorHex: null,
  priceOverride: null,
  stockQuantity: 0,
  isActive: true,
  images: [],
  primaryImageId: null,
});

export default function AdminProductEditorDialog({ product, categories, canAdjustInventory, onClose, onSave }: Props) {
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [description, setDescription] = useState(product?.description ?? "");
  const [detailsText, setDetailsText] = useState(product?.detailsAndCare.join("\n") ?? "");
  const [gender, setGender] = useState<ProductSaveInput["gender"]>(product?.gender ?? "UNISEX");
  const [categoryId, setCategoryId] = useState(product?.category.id ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [multibuyPrice, setMultibuyPrice] = useState(product?.multibuyPrice ?? "");
  const [currency, setCurrency] = useState<ProductSaveInput["currency"]>((product?.currency as ProductSaveInput["currency"]) ?? "GBP");
  const [status, setStatus] = useState<ProductSaveInput["status"]>(product?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
  const [tagsText, setTagsText] = useState(product?.tags.join(", ") ?? "");
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [bestsellerRank, setBestsellerRank] = useState(product?.bestsellerRank?.toString() ?? "");
  const [variants, setVariants] = useState<ProductVariantDraft[]>(product?.variants.map((variant) => ({ ...variant })) ?? []);
  const [images, setImages] = useState<ProductImageDraft[]>(product?.images.map((image) => ({ ...image })) ?? []);
  const [primaryImageId, setPrimaryImageId] = useState(product?.images.find(({ isPrimary }) => isPrimary)?.id ?? product?.images[0]?.id ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const uploadedIds = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageCountLabel = useMemo(() => `${images.length} of 12 images`, [images.length]);

  useEffect(() => () => {
    const stagedIds = [...uploadedIds.current];
    uploadedIds.current = [];
    for (const id of stagedIds) {
      void fetch(`/api/v1/admin/products/images/${id}`, { method: "DELETE", keepalive: true });
    }
  }, []);

  function updateVariant(index: number, key: keyof ProductVariantDraft, value: string | number | boolean | null) {
    setVariants((current) => current.map((variant, variantIndex) => variantIndex === index ? { ...variant, [key]: value } : variant));
  }

  async function uploadFiles(files: FileList | null, targetVariantIndex?: number) {
    if (!files?.length) return;
    const currentImageCount = targetVariantIndex === undefined ? images.length : variants[targetVariantIndex]?.images?.length ?? 0;
    if (currentImageCount + files.length > 12) {
      toast.error("A gallery can have up to 12 images.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    setFormError("");
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/v1/admin/products/images", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Image upload failed.");
        const targetImages = targetVariantIndex === undefined ? images : variants[targetVariantIndex]?.images ?? [];
        const uploaded: ProductImageDraft = { ...data.image, altText: title || null, sortOrder: targetImages.length, isPrimary: targetImages.length === 0 };
        uploadedIds.current.push(uploaded.id);
        if (targetVariantIndex === undefined) {
          setImages((current) => [...current, { ...uploaded, sortOrder: current.length, isPrimary: current.length === 0 }]);
          setPrimaryImageId((current) => current ?? uploaded.id);
        } else {
          setVariants((current) => current.map((variant, index) => index === targetVariantIndex ? {
            ...variant,
            images: [...(variant.images ?? []), { ...uploaded, sortOrder: (variant.images ?? []).length, isPrimary: (variant.images ?? []).length === 0 }],
            primaryImageId: variant.primaryImageId ?? uploaded.id,
          } : variant));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed.";
      setFormError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage(image: ProductImageDraft, targetVariantIndex?: number) {
    if (uploadedIds.current.includes(image.id)) {
      const response = await fetch(`/api/v1/admin/products/images/${image.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Could not remove the uploaded image.");
        return;
      }
      uploadedIds.current = uploadedIds.current.filter((id) => id !== image.id);
    }
    if (targetVariantIndex === undefined) {
      const nextImages = images.filter(({ id }) => id !== image.id).map((entry, index) => ({ ...entry, sortOrder: index }));
      setImages(nextImages);
      if (primaryImageId === image.id) setPrimaryImageId(nextImages[0]?.id ?? null);
    } else {
      setVariants((current) => current.map((variant, index) => {
        if (index !== targetVariantIndex) return variant;
        const nextImages = (variant.images ?? []).filter(({ id }) => id !== image.id).map((entry, sortOrder) => ({ ...entry, sortOrder, isPrimary: sortOrder === 0 && variant.primaryImageId === image.id }));
        const nextPrimaryImageId = variant.primaryImageId === image.id ? nextImages[0]?.id ?? null : variant.primaryImageId;
        return { ...variant, images: nextImages.map((entry) => ({ ...entry, isPrimary: entry.id === nextPrimaryImageId })), primaryImageId: nextPrimaryImageId };
      }));
    }
  }

  async function removeVariant(index: number) {
    const variant = variants[index];
    const stagedIds = (variant?.images ?? []).map(({ id }) => id).filter((id) => uploadedIds.current.includes(id));
    for (const id of stagedIds) {
      const response = await fetch(`/api/v1/admin/products/images/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        toast.error(data?.error ?? "Could not clean up this variant's staged image.");
        return;
      }
    }
    uploadedIds.current = uploadedIds.current.filter((id) => !stagedIds.includes(id));
    setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index));
  }

  function moveVariantImage(variantIndex: number, imageIndex: number, delta: -1 | 1) {
    setVariants((current) => current.map((variant, index) => {
      if (index !== variantIndex) return variant;
      const next = [...(variant.images ?? [])];
      const targetIndex = imageIndex + delta;
      if (targetIndex < 0 || targetIndex >= next.length) return variant;
      [next[imageIndex], next[targetIndex]] = [next[targetIndex], next[imageIndex]];
      return { ...variant, images: next.map((image, sortOrder) => ({ ...image, sortOrder })) };
    }));
  }

  function closeDialog() {
    if (uploading || saving) return;
    onClose();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading || saving) return;
    setSaving(true);
    setFormError("");
    const payload: ProductSaveInput = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      detailsAndCare: detailsText.split("\n").map((value) => value.trim()).filter(Boolean),
      gender,
      categoryId,
      price: price.trim(),
      multibuyPrice: multibuyPrice.trim() || null,
      currency,
      status,
      tags: tagsText.split(",").map((value) => value.trim()).filter(Boolean),
      isNew,
      bestsellerRank: bestsellerRank.trim() ? Number(bestsellerRank) : null,
      variants,
      images: images.map(({ id, altText }) => ({ id, altText: altText || title.trim() || null })),
      primaryImageId,
    };
    try {
      await onSave(payload);
      uploadedIds.current = [];
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the product.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminDialog title={product ? "Edit product" : "Create product"} description="Product information is saved to the live catalog database." onClose={closeDialog} size="xl">
      <form onSubmit={submit} className="max-h-[78dvh] space-y-6 overflow-y-auto p-5 sm:p-6">
        <section className="space-y-4">
          <div><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Basic information</h3><p className="mt-1 text-[11px] text-stone-400">Required fields are marked with an asterisk.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Product name *"><input required minLength={2} maxLength={200} value={title} onChange={(event) => { const next = event.target.value; setTitle(next); if (!slugEdited) setSlug(next.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} className={inputClass} /></Field>
            <Field label="Slug *"><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={220} value={slug} onChange={(event) => { setSlug(event.target.value); setSlugEdited(true); }} className={inputClass} /></Field>
            <Field label="Category *"><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={inputClass}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></Field>
            <Field label="Gender"><select value={gender} onChange={(event) => setGender(event.target.value as ProductSaveInput["gender"])} className={inputClass}><option value="UNISEX">Unisex</option><option value="MEN">Men</option><option value="WOMEN">Women</option><option value="KIDS">Kids</option></select></Field>
          </div>
          <Field label="Description *"><textarea required maxLength={20000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClass} h-auto py-2`} /></Field>
          <Field label="Details & care (one per line)"><textarea rows={3} value={detailsText} onChange={(event) => setDetailsText(event.target.value)} className={`${inputClass} h-auto py-2`} /></Field>
        </section>

        <section className="space-y-4 border-t border-stone-100 pt-5">
          <div className="flex items-end justify-between"><div><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Product images</h3><p className="mt-1 text-[11px] text-stone-400">JPEG, PNG, WebP, or AVIF · up to 5 MB each</p></div><span className="text-[10px] text-stone-400">{imageCountLabel}</span></div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="group relative aspect-[3/4] overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                <Image src={image.secureUrl} alt={image.altText || title || "Product image"} fill sizes="160px" className="object-cover" />
                {primaryImageId === image.id && <span className="absolute left-1.5 top-1.5 rounded bg-white/95 px-2 py-1 text-[9px] font-medium text-stone-700">Primary</span>}
                <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => { setPrimaryImageId(image.id); setImages((current) => current.map((item) => ({ ...item, isPrimary: item.id === image.id }))); }} aria-label="Set primary image" title="Set primary image" className="rounded bg-white p-1.5 text-stone-700 shadow"><Star className={`size-3.5 ${primaryImageId === image.id ? "fill-amber-400 text-amber-500" : ""}`} /></button>
                  <button type="button" onClick={() => void removeImage(image)} aria-label="Remove image" title="Remove image" className="rounded bg-white p-1.5 text-red-700 shadow"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            ))}
            {images.length < 12 && <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-stone-300 text-stone-500 hover:bg-stone-50 disabled:opacity-50"><span className="flex size-9 items-center justify-center rounded-full bg-stone-100">{uploading ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}</span><span className="text-[10px]">{uploading ? "Uploading…" : "Add image"}</span></button>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(event) => void uploadFiles(event.target.files)} />
        </section>

        <section className="space-y-4 border-t border-stone-100 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Pricing</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Regular price *"><input required type="number" min="0" max="99999999.99" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className={inputClass} /></Field>
            <Field label="Multibuy price"><input type="number" min="0" max="99999999.99" step="0.01" value={multibuyPrice} onChange={(event) => setMultibuyPrice(event.target.value)} className={inputClass} /></Field>
            <Field label="Currency"><select value={currency} onChange={(event) => setCurrency(event.target.value as ProductSaveInput["currency"])} className={inputClass}><option value="GBP">GBP (£)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="BDT">BDT (৳)</option></select></Field>
          </div>
          <p className="text-[10px] text-stone-400">Prices are stored as decimal amounts in the selected currency.</p>
        </section>

        <section className="space-y-4 border-t border-stone-100 pt-5">
          <div className="flex items-center justify-between"><div><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Variants & stock</h3><p className="mt-1 text-[11px] text-stone-400">Stock quantities require inventory:adjust permission.</p></div><button type="button" onClick={() => setVariants((current) => [...current, emptyVariant(current.length)])} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-200 px-2.5 text-[10px] font-medium text-stone-700"><Plus className="size-3.5" /> Add variant</button></div>
          {variants.length === 0 ? <p className="rounded-md border border-dashed border-stone-200 p-4 text-center text-[11px] text-stone-400">No variants yet. Products without variants have zero available stock.</p> : <div className="space-y-3">{variants.map((variant, index) => <div key={variant.id ?? `new-${index}`} className="space-y-3 rounded-md border border-stone-200 p-3"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><Field label="Variant name"><input required value={variant.name} onChange={(event) => updateVariant(index, "name", event.target.value)} className={inputClass} /></Field><Field label="SKU"><input value={variant.sku ?? ""} onChange={(event) => updateVariant(index, "sku", event.target.value || null)} className={inputClass} /></Field><Field label="Size"><input value={variant.size ?? ""} onChange={(event) => updateVariant(index, "size", event.target.value || null)} className={inputClass} /></Field><Field label="Color"><input value={variant.colorName ?? ""} onChange={(event) => updateVariant(index, "colorName", event.target.value || null)} className={inputClass} /></Field><Field label="Color hex"><input type="color" value={variant.colorHex ?? "#808080"} onChange={(event) => updateVariant(index, "colorHex", event.target.value)} className={`${inputClass} p-1`} /></Field><Field label="Variant price (optional)"><input type="number" min="0" max="99999999.99" step="0.01" value={variant.priceOverride ?? ""} onChange={(event) => updateVariant(index, "priceOverride", event.target.value || null)} className={inputClass} /></Field><Field label="Stock quantity"><input type="number" min="0" max="1000000" step="1" disabled={!canAdjustInventory} value={variant.stockQuantity} onChange={(event) => updateVariant(index, "stockQuantity", Number(event.target.value))} className={inputClass} /></Field><label className="flex h-9 items-center gap-2 text-[10px] text-stone-600"><input type="checkbox" checked={variant.isActive ?? true} onChange={(event) => updateVariant(index, "isActive", event.target.checked)} className="size-3.5 accent-stone-900" /> Available</label></div><div className="flex items-center justify-between border-t border-stone-100 pt-3"><div><p className="text-[10px] font-medium text-stone-700">Variant gallery · {(variant.images ?? []).length}/12</p><p className="mt-0.5 text-[9px] text-stone-400">Images shown when this color/size is selected</p></div><label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-stone-200 px-2.5 text-[10px] text-stone-700 hover:bg-stone-50"><ImagePlus className="size-3.5" /> Add images<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(event) => void uploadFiles(event.target.files, index)} /></label></div><div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{(variant.images ?? []).map((image, imageIndex) => <div key={image.id} className="group relative aspect-[3/4] overflow-hidden rounded border border-stone-200 bg-stone-100"><Image src={image.secureUrl} alt={image.altText || `${variant.colorName || variant.name} image`} fill sizes="120px" className="object-cover" />{(variant.primaryImageId ?? variant.images?.find(({ isPrimary }) => isPrimary)?.id) === image.id && <span className="absolute left-1 top-1 rounded bg-white/95 px-1.5 py-0.5 text-[8px]">Primary</span>}<div className="absolute inset-x-1 bottom-1 flex justify-between gap-1"><button type="button" onClick={() => { setVariants((current) => current.map((entry, variantIndex) => variantIndex === index ? { ...entry, primaryImageId: image.id, images: entry.images?.map((item) => ({ ...item, isPrimary: item.id === image.id })) } : entry)); }} aria-label="Set variant primary image" className="rounded bg-white p-1 text-stone-700 shadow"><Star className={`size-3 ${image.id === (variant.primaryImageId ?? variant.images?.find(({ isPrimary }) => isPrimary)?.id) ? "fill-amber-400 text-amber-500" : ""}`} /></button><div className="flex gap-1"><button type="button" disabled={imageIndex === 0} onClick={() => moveVariantImage(index, imageIndex, -1)} aria-label="Move image earlier" className="rounded bg-white p-1 text-stone-700 shadow disabled:opacity-40"><ArrowUp className="size-3" /></button><button type="button" disabled={imageIndex === (variant.images?.length ?? 0) - 1} onClick={() => moveVariantImage(index, imageIndex, 1)} aria-label="Move image later" className="rounded bg-white p-1 text-stone-700 shadow disabled:opacity-40"><ArrowDown className="size-3" /></button><button type="button" onClick={() => void removeImage(image, index)} aria-label="Remove variant image" className="rounded bg-white p-1 text-red-700 shadow"><Trash2 className="size-3" /></button></div></div></div>)}</div><div className="flex justify-end"><button type="button" onClick={() => void removeVariant(index)} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[10px] text-red-700 hover:bg-red-50"><Trash2 className="size-3.5" /> Remove variant</button></div></div>)}</div>}
        </section>

        <section className="grid gap-3 border-t border-stone-100 pt-5 sm:grid-cols-2">
          <Field label="Tags (comma separated)"><input value={tagsText} onChange={(event) => setTagsText(event.target.value)} className={inputClass} /></Field>
          <Field label="Bestseller rank (optional)"><input type="number" min="1" max="100000" value={bestsellerRank} onChange={(event) => setBestsellerRank(event.target.value)} className={inputClass} /></Field>
          <label className="flex items-center gap-2 text-xs text-stone-700"><input type="checkbox" checked={isNew} onChange={(event) => setIsNew(event.target.checked)} className="size-4 accent-stone-900" />Mark as new</label>
          <Field label="Catalog status"><select value={status} onChange={(event) => setStatus(event.target.value as ProductSaveInput["status"])} className={inputClass}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></Field>
        </section>

        {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">{formError}</p>}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-stone-100 bg-white pt-4">
          <button type="button" onClick={closeDialog} disabled={saving || uploading} className="h-9 rounded-md border border-stone-200 px-4 text-xs text-stone-600 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving || uploading} className="inline-flex h-9 items-center gap-2 rounded-md bg-stone-900 px-4 text-xs font-medium text-white disabled:opacity-50">{saving ? <LoaderCircle className="size-3.5 animate-spin" /> : null}{saving ? "Saving…" : uploading ? "Uploading image…" : product ? "Save changes" : "Create product"}</button>
        </div>
      </form>
    </AdminDialog>
  );
}

const inputClass = "h-9 w-full rounded-md border border-stone-200 bg-white px-3 text-xs text-stone-800 outline-none focus:border-stone-500 disabled:bg-stone-50 disabled:text-stone-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="block text-[10px] font-medium text-stone-600">{label}</span>{children}</label>;
}
