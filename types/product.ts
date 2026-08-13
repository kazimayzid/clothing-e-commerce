// types/product.ts

export interface ColorOption {
  name: string;
  hexCode: string;
  imageSrc?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: string;
  multibuyPrice?: string;
  
  // Categorization & Related Items Fields
  categoryId: string;
  categoryName: string;
  tags?: string[];
  relatedProductIds?: string[]; // Hand-picked recommendations

  // Gallery & Variants
  imageSrc: string;        // Main featured thumbnail
  images: string[];        // Product gallery carousel
  colorName: string;
  colors?: ColorOption[];
  sizes?: string[];

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
  colorCount?: number;
}