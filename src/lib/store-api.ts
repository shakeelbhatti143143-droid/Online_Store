import {
  Product,
  Category,
  Order,
  Coupon,
  UserProfile,
  StoreNotification,
  AnalyticsSummary,
  ProductReview,
  Address,
  Brand,
} from '@/types';

const TOKEN_KEY = 'luxe_auth_token';

/**
 * Build request headers.
 */
function authHeaders(json = false): HeadersInit {
  const headers: Record<string, string> = {};

  if (json) {
    headers['Content-Type'] = 'application/json';
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Parse API response JSON and throw a useful error
 * when the request fails.
 */
async function parseJson(res: Response) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error ||
        data.message ||
        `Request failed with status ${res.status}`
    );
  }

  return data;
}

/**
 * Store API
 *
 * All frontend requests to the store backend
 * should go through this object.
 */
export const storeApi = {
  // =========================================================
  // PRODUCTS
  // =========================================================

  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');

    const data = await parseJson(res);

    return data.data || [];
  },

  async getProductBySlug(
    slug: string
  ): Promise<Product | null> {
    const res = await fetch(
      `/api/products/${encodeURIComponent(slug)}`
    );

    if (res.status === 404) {
      return null;
    }

    const data = await parseJson(res);

    return data.data || null;
  },

  async createProduct(
    body: Partial<Product>
  ): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(body),
    });

    const data = await parseJson(res);

    return data.data;
  },

  async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<Product | null> {
    const res = await fetch(
      `/api/products/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: authHeaders(true),
        body: JSON.stringify(updates),
      }
    );

    const data = await parseJson(res);

    return data.data || null;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(
      `/api/products/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      }
    );

    await parseJson(res);

    return true;
  },

  // =========================================================
  // CATEGORIES
  // =========================================================

  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');

    const data = await parseJson(res);

    return data.data || [];
  },

  async createCategory(
    body: Partial<Category>
  ): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(body),
    });

    const data = await parseJson(res);

    return data.data;
  },

  async updateCategory(
    id: string,
    updates: Partial<Category>
  ): Promise<Category | null> {
    const res = await fetch(
      `/api/categories/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: authHeaders(true),
        body: JSON.stringify(updates),
      }
    );

    const data = await parseJson(res);

    return data.data || null;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(
      `/api/categories/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      }
    );

    await parseJson(res);

    return true;
  },

  // =========================================================
  // BRANDS
  // =========================================================

  async getBrands(): Promise<Brand[]> {
    const res = await fetch('/api/brands');

    const data = await parseJson(res);

    return data.data || [];
  },

  // =========================================================
  // ORDERS
  // =========================================================

  async getOrders(): Promise<Order[]> {
    const res = await fetch('/api/orders', {
      headers: authHeaders(),
    });

    const data = await parseJson(res);

    return data.data || [];
  },

  async getOrderById(
    id: string
  ): Promise<Order | null> {
    const res = await fetch(
      `/api/orders/${encodeURIComponent(id)}`,
      {
        headers: authHeaders(),
      }
    );

    if (res.status === 404) {
      return null;
    }

    const data = await parseJson(res);

    return data.data || null;
  },

  async createOrder(
    body: Record<string, unknown>
  ): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(body),
    });

    const data = await parseJson(res);

    return data.data;
  },

  async updateOrderStatus(
    orderId: string,
    status: Order['status']
  ): Promise<Order | null> {
    const res = await fetch(
      `/api/admin/orders/${encodeURIComponent(orderId)}`,
      {
        method: 'PATCH',
        headers: authHeaders(true),
        body: JSON.stringify({
          status,
        }),
      }
    );

    const data = await parseJson(res);

    return data.data || null;
  },

  // =========================================================
  // COUPONS
  // =========================================================

  async getCoupons(): Promise<Coupon[]> {
    const res = await fetch('/api/coupons', {
      headers: authHeaders(),
    });

    const data = await parseJson(res);

    return data.data || [];
  },

  async validateCoupon(
    code: string,
    orderSubtotal: number
  ) {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({
        action: 'validate',
        code,
        subtotal: orderSubtotal,
      }),
    });

    const data = await parseJson(res);

    return data as {
      valid: boolean;
      coupon?: Coupon;
      message?: string;
    };
  },

  async createCoupon(
    coupon: Partial<Coupon>
  ): Promise<Coupon> {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(coupon),
    });

    const data = await parseJson(res);

    return data.data;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const res = await fetch(
      `/api/coupons/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: authHeaders(),
      }
    );

    await parseJson(res);

    return true;
  },

  // =========================================================
  // REVIEWS
  // =========================================================

  async addProductReview(
    productId: string,
    reviewData: Partial<ProductReview>
  ): Promise<ProductReview> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({
        productId,
        ...reviewData,
      }),
    });

    const data = await parseJson(res);

    return data.data;
  },

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  async getNotifications(): Promise<StoreNotification[]> {
    const res = await fetch('/api/notifications', {
      headers: authHeaders(),
    });

    const data = await parseJson(res);

    return data.data || [];
  },

  async markNotificationAsRead(
    id: string
  ): Promise<void> {
    const res = await fetch(
      `/api/notifications/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: authHeaders(true),
        body: JSON.stringify({
          isRead: true,
        }),
      }
    );

    await parseJson(res);
  },

  // =========================================================
  // CUSTOMERS
  // =========================================================

  async getCustomers(): Promise<UserProfile[]> {
    const res = await fetch('/api/admin/users', {
      headers: authHeaders(),
    });

    const data = await parseJson(res);

    return data.data || [];
  },

  // =========================================================
  // ANALYTICS
  // =========================================================

  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch('/api/admin/analytics', {
      headers: authHeaders(),
    });

    const data = await parseJson(res);

    return data.data;
  },

  // =========================================================
  // ADDRESSES
  // =========================================================

  async getAddresses(): Promise<Address[]> {
    const res = await fetch('/api/addresses', {
      headers: authHeaders(),
    });

    const data = await parseJson(res);

    return data.data || [];
  },

  async saveAddress(
    body: Partial<Address> & {
      id?: string;
    }
  ): Promise<Address> {
    if (body.id) {
      const res = await fetch(
        `/api/addresses/${encodeURIComponent(body.id)}`,
        {
          method: 'PATCH',
          headers: authHeaders(true),
          body: JSON.stringify(body),
        }
      );

      const data = await parseJson(res);

      return data.data;
    }

    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(body),
    });

    const data = await parseJson(res);

    return data.data;
  },
};

/**
 * Export authHeaders in case other files
 * need to make authenticated requests.
 */
export { authHeaders };