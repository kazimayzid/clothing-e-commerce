export type Gender = 'men' | 'women' | 'unisex' | 'kids';

export interface ColorOption {
  name: string;
  hexCode: string;
  imageSrc?: string;
}

export interface ProductVariantOption {
  id: string;
  name: string;
  sku: string | null;
  size: string | null;
  colorName: string | null;
  colorHex: string | null;
  price: string;
  stockQuantity: number;
  isActive: boolean;
  images: string[];
  primaryImageSrc?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: string;
  multibuyPrice?: string;
  currency?: string;

  // Gender & Categorization
  gender: Gender;
  categoryId: string;
  categoryName: string;
  categoryPath?: { id: string; name: string; slug: string }[];
  tags?: string[];
  relatedProductIds?: string[]; // Hand-picked recommendations

  // Gallery & Variants
  imageSrc: string;        // Main featured thumbnail
  images: string[];        // Product gallery carousel
  commonImages?: string[];
  commonPrimaryImageSrc?: string;
  colorName: string;
  colorCount?: number;
  colors?: ColorOption[];
  sizes?: string[];
  variants?: ProductVariantOption[];

  // Rich Details
  description: string;
  detailsAndCare?: string[];
  stockCount: number;
  rating?: number;
  reviewCount?: number;

  // Badges
  isNew?: boolean;
  bestsellerRank?: number;
  sellingFastCount?: number;
}

// Lightweight DTO for catalog grid product cards
export type ProductCardDTO = Pick<
  Product,
  | 'id'
  | 'title'
  | 'slug'
  | 'price'
  | 'multibuyPrice'
  | 'currency'
  | 'gender'
  | 'imageSrc'
  | 'colorName'
  | 'isNew'
  | 'bestsellerRank'
  | 'sellingFastCount'
  | 'categoryName'
  | 'colorCount'
>;



























