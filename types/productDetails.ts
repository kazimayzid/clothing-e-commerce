import type { Product } from "./product";

export type ProductDetailData = Product;
export type ProductDetailDTO = Omit<Product, "imageSrc">;



export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  date: string;
  rating: number;
  title: string;
  comment: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
