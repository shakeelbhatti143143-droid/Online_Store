import { Product, Category, Order, Coupon, UserProfile, StoreNotification, AnalyticsSummary, ProductReview, Address, Brand } from '@/types';

const TOKEN_KEY = 'luxe_auth_token';

function authHeaders(json = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data;
}

export const storeApi = {
  async getProducts(): Promise<Product[]> {
    const data = await parseJson(await fetch('/api/products'));
    return data.data || [];
  },
  async getProductBySlug(slug: string): Promise<Product | null> {
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
    if (res.status === 404) return null;
    const data = await parseJson(res);
    return data.data || null;
  },
  async createProduct(body: Partial<Product>): Promise<Product> {
    const data = await parseJson(await fetch('/api/products', { method: 'POST', headers: authHeaders(true), body: JSON.stringify(body) }));
    return data.data;
  },
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const data = await parseJson(await fetch(`/api/products/${encodeURIComponent(id)}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify(updates) }));
    return data.data;
  },
  async deleteProduct(id: string): Promise<boolean> {
    await parseJson(await fetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() }));
    return true;
  },
  async getCategories(): Promise<Category[]> {
    const data = await parseJson(await fetch('/api/categories'));
    return data.data || [];
  },
  async createCategory(body: Partial<Category>): Promise<Category> {
    const data = await parseJson(await fetch('/api/categories', { method: 'POST', headers: authHeaders(true), body: JSON.stringify(body) }));
    return data.data;
  },
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const data = await parseJson(await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify(updates) }));
    return data.data;
  },
  async deleteCategory(id: string): Promise<boolean> {
    await parseJson(await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() }));
    return true;
  },
  async getBrands(): Promise<Brand[]> {
    const data = await parseJson(await fetch('/api/brands'));
    return data.data || [];
  },
  async getOrders(): Promise<Order[]> {
    const data = await parseJson(await fetch('/api/orders', { headers: authHeaders() }));
    return data.data || [];
  },
  async getOrderById(id: string): Promise<Order | null> {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { headers: authHeaders() });
    if (res.status === 404) return null;
    const data = await parseJson(res);
    return data.data || null;
  },
  async createOrder(body: Record<string, unknown>): Promise<Order> {
    const data = await parseJson(await fetch('/api/orders', { method: 'POST', headers: authHeaders(true), body: JSON.stringify(body) }));
    return data.data;
  },
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
    const data = await parseJson(await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify({ status }) }));
    return data.data;
  },
  async getCoupons(): Promise<Coupon[]> {
    const data = await parseJson(await fetch('/api/coupons', { headers: authHeaders() }));
    return data.data || [];
  },
  async validateCoupon(code: string, orderSubtotal: number) {
    const data = await parseJson(await fetch('/api/coupons', { method: 'POST', headers: authHeaders(true), body: JSON.stringify({ action: 'validate', code, subtotal: orderSubtotal }) }));
    return data as { valid: boolean; coupon?: Coupon; message?: string };
  },
  async createCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
    const data = await parseJson(await fetch('/api/coupons', { method: 'POST', headers: authHeaders(true), body: JSON.stringify(coupon) }));
    return data.data;
  },
  async deleteCoupon(id: string): Promise<boolean> {
    await parseJson(await fetch(`/api/coupons/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() }));
    return true;
  },
  async addProductReview(productId: string, reviewData: Partial<ProductReview>): Promise<ProductReview> {
    const data = await parseJson(await fetch('/api/reviews', { method: 'POST', headers: authHeaders(true), body: JSON.stringify({ productId, ...reviewData }) }));
    return data.data;
  },
  async getNotifications(): Promise<StoreNotification[]> {
    const data = await parseJson(await fetch('/api/notifications', { headers: authHeaders() }));
    return data.data || [];
  },
  async markNotificationAsRead(id: string): Promise<void> {
    await parseJson(await fetch(`/api/notifications/${encodeURIComponent(id)}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify({ isRead: true }) }));
  },
  async getCustomers(): Promise<UserProfile[]> {
    const data = await parseJson(await fetch('/api/admin/users', { headers: authHeaders() }));
    return data.data || [];
  },
  async getAnalytics(): Promise<AnalyticsSummary> {
    const data = await parseJson(await fetch('/api/admin/analytics', { headers: authHeaders() }));
    return data.data;
  },
  async getAddresses(): Promise<Address[]> {
    const data = await parseJson(await fetch('/api/addresses', { headers: authHeaders() }));
    return data.data || [];
  },
  async saveAddress(body: Partial<Address> & { id?: string }): Promise<Address> {
    if (body.id) {
      const data = await parseJson(await fetch(`/api/addresses/${encodeURIComponent(body.id)}`, { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify(body) }));
      return data.data;
    }
    const data = await parseJson(await fetch('/api/addresses', { method: 'POST', headers: authHeaders(true), body: JSON.stringify(body) }));
    return data.data;
  },
};

export { authHeaders };
