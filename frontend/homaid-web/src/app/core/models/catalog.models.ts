export interface CategoryListItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface CategoryTree {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  sortOrder: number;
  children: CategoryTree[];
}

export interface CategoryTranslation {
  languageCode: string;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CategoryDetail {
  id: string;
  slug: string;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  translations: CategoryTranslation[];
}

export interface UpsertCategoryRequest {
  slug: string;
  parentId?: string | null;
  sortOrder: number;
  imageUrl?: string | null;
  isActive: boolean;
  translations: CategoryTranslation[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  productCount: number;
}

export interface UpsertBrandRequest {
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductListItem {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  currency: string;
  stockQuantity: number;
  isInStock: boolean;
  isFeatured: boolean;
  primaryImageUrl?: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
}

export interface ProductTranslation {
  languageCode: string;
  name: string;
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductDetail {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isInStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  weightKg?: number;
  barcode?: string;
  attributes?: Record<string, unknown> | null;
  publishedAt?: string;
  viewCount: number;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  images: ProductImage[];
  translations: ProductTranslation[];
}

export interface ProductListQuery {
  search?: string;
  categorySlug?: string;
  categoryId?: string;
  brandSlug?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'popular';
  page?: number;
  pageSize?: number;
}

export interface UpsertProductImage {
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface UpsertProductRequest {
  sku: string;
  slug: string;
  categoryId: string;
  brandId?: string | null;
  basePrice: number;
  compareAtPrice?: number | null;
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  weightKg?: number | null;
  barcode?: string | null;
  attributes?: Record<string, unknown> | null;
  isActive: boolean;
  isFeatured: boolean;
  publishedAt?: string | null;
  translations: ProductTranslation[];
  images: UpsertProductImage[];
}
