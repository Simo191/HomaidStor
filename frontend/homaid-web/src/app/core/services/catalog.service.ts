import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../models/api.models';
import {
  Brand, CategoryDetail, CategoryListItem, CategoryTree, ProductDetail,
  ProductListItem, ProductListQuery
} from '../models/catalog.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private api = inject(ApiService);

  getCategoryTree(): Observable<CategoryTree[]> {
    return this.api.get<CategoryTree[]>('/catalog/categories');
  }

  getCategoriesFlat(): Observable<CategoryListItem[]> {
    return this.api.get<CategoryListItem[]>('/catalog/categories', { flat: true });
  }

  getCategory(slug: string): Observable<CategoryDetail> {
    return this.api.get<CategoryDetail>(`/catalog/categories/${encodeURIComponent(slug)}`);
  }

  getBrands(): Observable<Brand[]> {
    return this.api.get<Brand[]>('/catalog/brands');
  }

  getProducts(query: ProductListQuery = {}): Observable<PagedResult<ProductListItem>> {
    return this.api.get<PagedResult<ProductListItem>>('/catalog/products', query as Record<string, unknown>);
  }

  getProduct(slug: string): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/catalog/products/${encodeURIComponent(slug)}`);
  }

  getFeatured(take = 8): Observable<ProductListItem[]> {
    return this.api.get<ProductListItem[]>('/catalog/products/featured', { take });
  }
}
