export interface TopProduct {
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string;
  quantitySold: number;
  revenue: number;
}

export interface TopCategory {
  categoryId: string;
  slug: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  revenue: number;
  orderCount: number;
}

export interface DashboardStats {
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  monthlyRevenue: MonthlyRevenue[];
}
