import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import {
  Product as ProductType,
  Category as CategoryType,
  Order as OrderType,
  Coupon as CouponType,
  UserProfile,
  StoreNotification,
  AnalyticsSummary,
  ProductReview,
  Brand as BrandType,
} from '@/types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_COUPONS } from './initial-data';
import { redisCache } from '../cache/redis';
import { CACHE_KEYS } from '../cache/keys';
import {
  User,
  Category,
  Brand,
  Product,
  ProductImage,
  ProductVariant,
  Coupon,
  Order,
  OrderItem,
  Review,
  Notification,
  AdminLog,
  Wishlist,
} from '@/lib/models';
import {
  mapBrand,
  mapCategory,
  mapCoupon,
  mapNotification,
  mapOrder,
  mapOrderItem,
  mapProduct,
  mapReview,
  mapUser,
  mapVariant,
  isObjectId,
} from './mappers';
import {
  calcCouponDiscount,
  calcShippingAmount,
  calcTaxAmount,
  roundMoney,
} from '@/lib/pricing';
import { slugify } from '@/lib/utils';

let seedPromise: Promise<void> | null = null;

async function ensureConnection() {
  await connectDB();
  await ensureSeeded();
}

async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await Product.countDocuments();
    if (count > 0) return;
    await seedCatalog();
  })().catch((err) => {
    seedPromise = null;
    console.error('[store-db] seed failed:', err);
  });
  return seedPromise;
}

async function seedCatalog() {
  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  for (let i = 0; i < INITIAL_CATEGORIES.length; i++) {
    const cat = INITIAL_CATEGORIES[i];
    const created = await Category.findOneAndUpdate(
      { slug: cat.slug },
      {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        icon: cat.icon,
        isFeatured: Boolean(cat.isFeatured),
        displayOrder: i,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryMap.set(cat.id, created._id as mongoose.Types.ObjectId);
  }

  const brandMap = new Map<string, mongoose.Types.ObjectId>();
  const uniqueBrands = Array.from(new Set(INITIAL_PRODUCTS.map((p) => p.brandName).filter(Boolean))) as string[];
  for (const name of uniqueBrands) {
    const slug = slugify(name);
    const created = await Brand.findOneAndUpdate(
      { slug },
      { name, slug, description: `${name} luxury house` },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    brandMap.set(name, created._id as mongoose.Types.ObjectId);
  }

  for (const p of INITIAL_PRODUCTS) {
    const existing = await Product.findOne({ slug: p.slug });
    if (existing) continue;
    const created = await Product.create({
      title: p.title,
      slug: p.slug,
      sku: p.sku,
      shortDescription: p.shortDescription,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      categoryId: categoryMap.get(p.categoryId),
      brandId: p.brandName ? brandMap.get(p.brandName) : undefined,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isNewArrival: p.isNewArrival,
      isActive: true,
      badge: p.badge,
      tags: p.tags,
      features: p.features,
      specifications: p.specifications,
    });

    if (p.images?.length) {
      await ProductImage.insertMany(
        p.images.map((url, idx) => ({
          productId: created._id,
          url,
          altText: p.title,
          displayOrder: idx,
          isPrimary: idx === 0,
        }))
      );
    }

    if (p.variants?.length) {
      await ProductVariant.insertMany(
        p.variants.map((v) => ({
          productId: created._id,
          name: v.name,
          sku: v.sku,
          colorName: v.colorName,
          colorHex: v.colorHex,
          size: v.size,
          priceModifier: v.priceModifier,
          stockQuantity: v.stockQuantity,
          imageUrl: v.imageUrl,
        }))
      );
    }
  }

  for (const coupon of INITIAL_COUPONS) {
    await Coupon.findOneAndUpdate(
      { code: coupon.code.toUpperCase() },
      {
        code: coupon.code.toUpperCase(),
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount || 0,
        maxDiscountAmount: coupon.maxDiscountAmount,
        usageLimit: coupon.usageLimit,
        usedCount: 0,
        isActive: coupon.isActive,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
}

async function hydrateProducts(productDocs: any[], includeReviews = false): Promise<ProductType[]> {
  if (!productDocs.length) return [];
  const ids = productDocs.map((p) => p._id);
  const categoryIds = productDocs.map((p) => p.categoryId).filter(Boolean);
  const brandIds = productDocs.map((p) => p.brandId).filter(Boolean);

  const [images, variants, categories, brands, reviews] = await Promise.all([
    ProductImage.find({ productId: { $in: ids } }).sort({ displayOrder: 1 }).lean(),
    ProductVariant.find({ productId: { $in: ids } }).lean(),
    Category.find({ _id: { $in: categoryIds } }).lean(),
    Brand.find({ _id: { $in: brandIds } }).lean(),
    includeReviews ? Review.find({ productId: { $in: ids } }).sort({ createdAt: -1 }).lean() : Promise.resolve([]),
  ]);

  const imagesByProduct = new Map<string, string[]>();
  for (const img of images) {
    const key = String(img.productId);
    const list = imagesByProduct.get(key) || [];
    list.push(img.url);
    imagesByProduct.set(key, list);
  }

  const variantsByProduct = new Map<string, ReturnType<typeof mapVariant>[]>();
  for (const v of variants) {
    const key = String(v.productId);
    const list = variantsByProduct.get(key) || [];
    list.push(mapVariant(v));
    variantsByProduct.set(key, list);
  }

  const reviewsByProduct = new Map<string, ProductReview[]>();
  for (const r of reviews) {
    const key = String(r.productId);
    const list = reviewsByProduct.get(key) || [];
    list.push(mapReview(r));
    reviewsByProduct.set(key, list);
  }

  const categoryById = new Map(categories.map((c) => [String(c._id), c.name]));
  const brandById = new Map(brands.map((b) => [String(b._id), b.name]));

  return productDocs.map((p) =>
    mapProduct({
      product: p,
      images: imagesByProduct.get(String(p._id)) || [],
      variants: variantsByProduct.get(String(p._id)) || [],
      reviews: includeReviews ? reviewsByProduct.get(String(p._id)) : undefined,
      categoryName: categoryById.get(String(p.categoryId)),
      brandName: p.brandId ? brandById.get(String(p.brandId)) : undefined,
    })
  );
}

async function findProductDoc(idOrSlug: string) {
  if (isObjectId(idOrSlug)) {
    return Product.findById(idOrSlug);
  }
  return Product.findOne({ $or: [{ slug: idOrSlug }, { sku: idOrSlug.toUpperCase() }] });
}

async function hydrateOrders(orderDocs: any[]): Promise<OrderType[]> {
  if (!orderDocs.length) return [];
  const ids = orderDocs.map((o) => o._id);
  const items = await OrderItem.find({ orderId: { $in: ids } }).lean();
  const itemsByOrder = new Map<string, ReturnType<typeof mapOrderItem>[]>();
  for (const item of items) {
    const key = String(item.orderId);
    const list = itemsByOrder.get(key) || [];
    list.push(mapOrderItem(item));
    itemsByOrder.set(key, list);
  }
  return orderDocs.map((o) => mapOrder(o, itemsByOrder.get(String(o._id)) || []));
}

function generateOrderNumber() {
  return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
}

class StoreDatabase {
  async getProducts(): Promise<ProductType[]> {
    await ensureConnection();
    const cached = await redisCache.get<ProductType[]>(CACHE_KEYS.ALL_PRODUCTS);
    if (cached) return cached;
    const docs = await Product.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    const data = await hydrateProducts(docs);
    await redisCache.set(CACHE_KEYS.ALL_PRODUCTS, data, 300);
    return data;
  }

  async getAllProductsAdmin(): Promise<ProductType[]> {
    await ensureConnection();
    const docs = await Product.find({}).sort({ createdAt: -1 }).lean();
    return hydrateProducts(docs);
  }

  async getProductBySlug(slug: string): Promise<ProductType | null> {
    await ensureConnection();
    const cacheKey = CACHE_KEYS.PRODUCT_BY_SLUG(slug);
    const cached = await redisCache.get<ProductType>(cacheKey);
    if (cached) return cached;
    const doc = await findProductDoc(slug).then((d) => d?.toObject?.() || d);
    if (!doc) return null;
    const [hydrated] = await hydrateProducts([doc], true);
    if (hydrated) await redisCache.set(cacheKey, hydrated, 600);
    return hydrated || null;
  }

  async createProduct(productData: Partial<ProductType>, adminId?: string): Promise<ProductType> {
    await ensureConnection();
    const slug = productData.slug || slugify(productData.title || `prod-${Date.now()}`);
    const sku = (productData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    let categoryId = productData.categoryId;
    if (!categoryId || !isObjectId(categoryId)) {
      const first = await Category.findOne().sort({ displayOrder: 1 });
      categoryId = first ? String(first._id) : undefined;
    }
    if (!categoryId) throw new Error('A category is required to create a product.');

    let brandId = productData.brandId;
    if (!brandId && productData.brandName) {
      const brandSlug = slugify(productData.brandName);
      const brand = await Brand.findOneAndUpdate(
        { slug: brandSlug },
        { name: productData.brandName, slug: brandSlug },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      brandId = String(brand._id);
    }

    const price = Number(productData.price) || 0;
    const originalPrice = productData.originalPrice != null ? Number(productData.originalPrice) : undefined;
    if (price < 0) throw new Error('Price cannot be negative.');
    if (originalPrice != null && originalPrice < price) throw new Error('Original price cannot be lower than price.');

    const created = await Product.create({
      title: productData.title || 'Untitled Luxury Product',
      slug,
      sku,
      shortDescription: productData.shortDescription || '',
      description: productData.description || '',
      price,
      originalPrice,
      categoryId,
      brandId: brandId && isObjectId(brandId) ? brandId : undefined,
      stockQuantity: Number(productData.stockQuantity) || 0,
      lowStockThreshold: Number(productData.lowStockThreshold) || 3,
      rating: 0,
      reviewsCount: 0,
      isFeatured: Boolean(productData.isFeatured),
      isBestSeller: Boolean(productData.isBestSeller) || productData.badge === 'BEST SELLER',
      isNewArrival: productData.isNewArrival !== undefined ? Boolean(productData.isNewArrival) : true,
      isActive: true,
      badge: productData.badge,
      tags: productData.tags || ['luxury'],
      features: productData.features || ['Handcrafted with premium materials'],
      specifications: productData.specifications || { Origin: 'Handmade', Warranty: '2-Year Global' },
    });

    const images = productData.images?.length
      ? productData.images
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'];

    await ProductImage.insertMany(
      images.map((url, idx) => ({
        productId: created._id,
        url,
        altText: created.title,
        displayOrder: idx,
        isPrimary: idx === 0,
      }))
    );

    if (productData.variants?.length) {
      await ProductVariant.insertMany(
        productData.variants.map((v) => ({
          productId: created._id,
          name: v.name,
          sku: v.sku,
          colorName: v.colorName,
          colorHex: v.colorHex,
          size: v.size,
          priceModifier: Number(v.priceModifier) || 0,
          stockQuantity: Math.max(0, Number(v.stockQuantity) || 0),
          imageUrl: v.imageUrl,
        }))
      );
    }

    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'product_created',
        entityType: 'product',
        entityId: String(created._id),
        details: { title: created.title, sku: created.sku },
      });
    }

    await redisCache.invalidateProductCache(created.slug, String(created._id));
    const [hydrated] = await hydrateProducts([created.toObject()]);
    return hydrated;
  }

  async updateProduct(id: string, updates: Partial<ProductType>, adminId?: string): Promise<ProductType | null> {
    await ensureConnection();
    const doc = await findProductDoc(id);
    if (!doc) return null;

    const allowed: Record<string, unknown> = {};
    const fields: (keyof ProductType)[] = [
      'title',
      'slug',
      'sku',
      'shortDescription',
      'description',
      'price',
      'originalPrice',
      'categoryId',
      'brandId',
      'stockQuantity',
      'lowStockThreshold',
      'isFeatured',
      'isBestSeller',
      'isNewArrival',
      'badge',
      'tags',
      'features',
      'specifications',
    ];
    for (const field of fields) {
      if (updates[field] !== undefined) {
        allowed[field as string] = updates[field];
      }
    }
    if (updates.price != null && Number(updates.price) < 0) throw new Error('Price cannot be negative.');
    if (updates.stockQuantity != null && Number(updates.stockQuantity) < 0) throw new Error('Stock cannot be negative.');
    const nextPrice = updates.price != null ? Number(updates.price) : doc.price;
    const nextOriginal = updates.originalPrice != null ? Number(updates.originalPrice) : doc.originalPrice;
    if (nextOriginal != null && nextOriginal < nextPrice) throw new Error('Original price cannot be lower than price.');

    if (updates.brandName && !updates.brandId) {
      const brandSlug = slugify(updates.brandName);
      const brand = await Brand.findOneAndUpdate(
        { slug: brandSlug },
        { name: updates.brandName, slug: brandSlug },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      allowed.brandId = brand._id;
    }

    const oldSlug = doc.slug;
    Object.assign(doc, allowed);
    await doc.save();

    if (updates.images && updates.images.length > 0) {
      await ProductImage.deleteMany({ productId: doc._id });
      await ProductImage.insertMany(
        updates.images.map((url, idx) => ({
          productId: doc._id,
          url,
          altText: doc.title,
          displayOrder: idx,
          isPrimary: idx === 0,
        }))
      );
    }

    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'product_updated',
        entityType: 'product',
        entityId: String(doc._id),
        details: allowed,
      });
    }

    await redisCache.invalidateProductCache(oldSlug, String(doc._id));
    if (doc.slug !== oldSlug) await redisCache.invalidateProductCache(doc.slug, String(doc._id));
    const [hydrated] = await hydrateProducts([doc.toObject()]);
    return hydrated;
  }

  async deleteProduct(id: string, adminId?: string): Promise<boolean> {
    await ensureConnection();
    const doc = await findProductDoc(id);
    if (!doc) return false;
    const productId = doc._id;
    await Promise.all([
      ProductImage.deleteMany({ productId }),
      ProductVariant.deleteMany({ productId }),
      Wishlist.deleteMany({ productId }),
      Review.deleteMany({ productId }),
      Product.deleteOne({ _id: productId }),
    ]);
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'product_deleted',
        entityType: 'product',
        entityId: String(productId),
        details: { title: doc.title, sku: doc.sku },
      });
    }
    await redisCache.invalidateProductCache(doc.slug, String(productId));
    return true;
  }

  async getCategories(): Promise<CategoryType[]> {
    await ensureConnection();
    const cached = await redisCache.get<CategoryType[]>(CACHE_KEYS.ALL_CATEGORIES);
    if (cached) return cached;
    const cats = await Category.find({}).sort({ displayOrder: 1, name: 1 }).lean();
    const counts = await Product.aggregate([{ $group: { _id: '$categoryId', count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const result = cats.map((c) => mapCategory(c, countMap.get(String(c._id)) || 0));
    await redisCache.set(CACHE_KEYS.ALL_CATEGORIES, result, 600);
    return result;
  }

  async createCategory(categoryData: Partial<CategoryType>, adminId?: string): Promise<CategoryType> {
    await ensureConnection();
    const created = await Category.create({
      name: categoryData.name || 'New Category',
      slug: categoryData.slug || slugify(categoryData.name || `category-${Date.now()}`),
      description: categoryData.description || '',
      imageUrl: categoryData.imageUrl || '',
      icon: categoryData.icon,
      isFeatured: Boolean(categoryData.isFeatured),
      displayOrder: 0,
    });
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'category_created',
        entityType: 'category',
        entityId: String(created._id),
        details: { name: created.name },
      });
    }
    await redisCache.invalidateCategoryCache();
    return mapCategory(created, 0);
  }

  async updateCategory(id: string, updates: Partial<CategoryType>, adminId?: string): Promise<CategoryType | null> {
    await ensureConnection();
    const doc = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return null;
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'category_updated',
        entityType: 'category',
        entityId: id,
        details: updates,
      });
    }
    await redisCache.invalidateCategoryCache();
    return mapCategory(doc);
  }

  async deleteCategory(id: string, adminId?: string): Promise<boolean> {
    await ensureConnection();
    const res = await Category.deleteOne({ _id: id });
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'category_deleted',
        entityType: 'category',
        entityId: id,
      });
    }
    await redisCache.invalidateCategoryCache();
    return res.deletedCount > 0;
  }

  async getBrands(): Promise<BrandType[]> {
    await ensureConnection();
    const docs = await Brand.find({}).sort({ name: 1 }).lean();
    return docs.map(mapBrand);
  }

  async createBrand(data: Partial<BrandType> & { website?: string }, adminId?: string): Promise<BrandType> {
    await ensureConnection();
    const created = await Brand.create({
      name: data.name,
      slug: data.slug || slugify(data.name || `brand-${Date.now()}`),
      logoUrl: data.logoUrl,
      description: data.description,
      website: data.website,
    });
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'brand_created',
        entityType: 'brand',
        entityId: String(created._id),
      });
    }
    return mapBrand(created);
  }

  async updateBrand(id: string, updates: Partial<BrandType>, adminId?: string): Promise<BrandType | null> {
    await ensureConnection();
    const doc = await Brand.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return null;
    if (adminId) {
      await AdminLog.create({ adminId, action: 'brand_updated', entityType: 'brand', entityId: id, details: updates });
    }
    return mapBrand(doc);
  }

  async deleteBrand(id: string, adminId?: string): Promise<boolean> {
    await ensureConnection();
    const res = await Brand.deleteOne({ _id: id });
    if (adminId) {
      await AdminLog.create({ adminId, action: 'brand_deleted', entityType: 'brand', entityId: id });
    }
    return res.deletedCount > 0;
  }

  async getOrders(userId?: string): Promise<OrderType[]> {
    await ensureConnection();
    const query = userId ? { userId } : {};
    const docs = await Order.find(query).sort({ createdAt: -1 }).lean();
    return hydrateOrders(docs);
  }

  async getOrderById(orderIdOrNumber: string, userId?: string): Promise<OrderType | null> {
    await ensureConnection();
    const query: Record<string, unknown> = isObjectId(orderIdOrNumber)
      ? { $or: [{ _id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] }
      : { orderNumber: orderIdOrNumber };
    if (userId) query.userId = userId;
    const doc = await Order.findOne(query).lean();
    if (!doc) return null;
    const [order] = await hydrateOrders([doc]);
    return order || null;
  }

  async createSecureOrder(input: {
    userId?: string;
    guestEmail?: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    paymentMethod?: OrderType['paymentMethod'];
    deliveryMethod?: OrderType['deliveryMethod'];
    couponCode?: string;
    shippingAddress: OrderType['shippingAddress'];
    billingAddress?: OrderType['billingAddress'];
    notes?: string;
    items: { productId: string; variantId?: string; quantity: number }[];
  }): Promise<OrderType> {
    await ensureConnection();
    if (!input.items?.length) throw new Error('Order must contain at least one item.');

    const lineItems: {
      productId: mongoose.Types.ObjectId;
      productTitle: string;
      productImage: string;
      variantName?: string;
      sku: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      variantId?: mongoose.Types.ObjectId;
    }[] = [];

    let subtotal = 0;

    // Validate products / variants and build line items WITHOUT transactions.
    // Stock is decremented later using atomic conditional updates (findOneAndUpdate with $gte)
    // to safely prevent overselling even on deployments without transaction support.
    for (const item of input.items) {
      const qty = Math.floor(Number(item.quantity));
      if (!Number.isFinite(qty) || qty < 1) throw new Error('Invalid item quantity.');

      let product;
      try {
        product = await Product.findById(item.productId);
      } catch {
        throw new Error('One or more products are unavailable.');
      }
      if (!product || !product.isActive) throw new Error('One or more products are unavailable.');

      let unitPrice = product.price;
      let variantName = '';
      let sku = product.sku;
      let variantDoc: Awaited<ReturnType<typeof ProductVariant.findOne>> | null = null;

      if (item.variantId) {
        variantDoc = await ProductVariant.findOne({
          _id: item.variantId,
          productId: product._id,
        });
        if (!variantDoc) throw new Error('Selected variant is unavailable.');
        unitPrice = product.price + (variantDoc.priceModifier || 0);
        variantName = variantDoc.name;
        sku = variantDoc.sku || product.sku;
        if (variantDoc.stockQuantity < qty) throw new Error(`Insufficient stock for ${product.title}.`);
      } else if (product.stockQuantity < qty) {
        throw new Error(`Insufficient stock for ${product.title}.`);
      }

      const primaryImage = await ProductImage.findOne({ productId: product._id, isPrimary: true });
      const fallbackImage = primaryImage || (await ProductImage.findOne({ productId: product._id }).sort({ displayOrder: 1 }));

      const totalPrice = roundMoney(unitPrice * qty);
      subtotal += totalPrice;
      lineItems.push({
        productId: product._id as mongoose.Types.ObjectId,
        productTitle: product.title,
        productImage: fallbackImage?.url || '',
        variantName,
        sku,
        unitPrice,
        quantity: qty,
        totalPrice,
        variantId: variantDoc?._id as mongoose.Types.ObjectId | undefined,
      });
    }

    subtotal = roundMoney(subtotal);

    let discountAmount = 0;
    let couponId: mongoose.Types.ObjectId | undefined;
    let couponCode: string | undefined;
    if (input.couponCode) {
      const couponDoc = await Coupon.findOne({ code: input.couponCode.toUpperCase() });
      const validation = this.validateCouponDoc(couponDoc, subtotal);
      if (!validation.valid || !couponDoc) throw new Error(validation.message || 'Invalid coupon.');
      discountAmount = roundMoney(calcCouponDiscount(mapCoupon(couponDoc), subtotal));
      couponId = couponDoc._id as mongoose.Types.ObjectId;
      couponCode = couponDoc.code;
      if (couponDoc.usageLimit != null && couponDoc.usedCount >= couponDoc.usageLimit) {
        throw new Error('This coupon has reached its usage limit.');
      }
      couponDoc.usedCount += 1;
      await couponDoc.save();
    }

    const shippingAmount = calcShippingAmount(subtotal, couponCode, input.deliveryMethod || 'standard');
    const taxAmount = calcTaxAmount(subtotal, discountAmount);
    const totalAmount = roundMoney(Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount));

    const orderDocs = await Order.create([
      {
        orderNumber: generateOrderNumber(),
        userId: input.userId,
        guestEmail: input.guestEmail || (!input.userId ? input.customerEmail : undefined),
        customerEmail: input.customerEmail.toLowerCase(),
        customerName: input.customerName,
        customerPhone: input.customerPhone || '',
        status: 'processing',
        paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentMethod: input.paymentMethod || 'card',
        deliveryMethod: input.deliveryMethod || 'standard',
        currency: 'USD',
        subtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        totalAmount,
        couponId,
        couponCode,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}-EXP`,
        estimatedDelivery: 'Estimated 3-5 Business Days',
        notes: input.notes,
      },
    ]);
    const order = orderDocs[0];

    await OrderItem.insertMany(
      lineItems.map((li) => ({
        orderId: order._id,
        productId: li.productId,
        productTitle: li.productTitle,
        productImage: li.productImage,
        variantName: li.variantName,
        sku: li.sku,
        unitPrice: li.unitPrice,
        quantity: li.quantity,
        totalPrice: li.totalPrice,
      }))
    );

    // Atomic conditional stock decrement prevents overselling without transactions.
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const qty = lineItems[i].quantity;
      if (item.variantId) {
        const updatedVariant = await ProductVariant.findOneAndUpdate(
          { _id: item.variantId, stockQuantity: { $gte: qty } },
          { $inc: { stockQuantity: -qty } },
          { new: true }
        );
        if (!updatedVariant) throw new Error('Insufficient variant stock.');
      }
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stockQuantity: { $gte: qty } },
        { $inc: { stockQuantity: -qty } },
        { new: true }
      );
      if (!updatedProduct) throw new Error('Insufficient product stock.');
      if (updatedProduct.stockQuantity <= updatedProduct.lowStockThreshold) {
        await Notification.create({
          userId: null,
          type: 'low_stock',
          title: `Low Stock: ${updatedProduct.title}`,
          message: `Only ${updatedProduct.stockQuantity} units remaining.`,
          link: '/admin/inventory',
        });
      }
    }

    await Notification.create([
      {
        userId: null,
        type: 'order_placed',
        title: `New Order ${order.orderNumber}`,
        message: `${order.customerName} placed an order for $${order.totalAmount.toFixed(2)}`,
        link: '/admin/orders',
      },
      ...(input.userId
        ? [
          {
            userId: input.userId,
            type: 'payment_success' as const,
            title: 'Order confirmed',
            message: `Order ${order.orderNumber} was placed successfully.`,
            link: '/account/orders',
          },
        ]
        : []),
    ]);

    await redisCache.invalidateAll();
    const [hydrated] = await hydrateOrders([order.toObject()]);
    if (!hydrated) throw new Error('Failed to create order.');
    return hydrated;
  }

  async createOrder(orderData: Partial<OrderType> & { items?: OrderType['items'] }): Promise<OrderType> {
    const items = (orderData.items || []).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    return this.createSecureOrder({
      userId: orderData.userId,
      guestEmail: orderData.customerEmail,
      customerEmail: orderData.customerEmail || 'guest@example.com',
      customerName: orderData.customerName || 'Customer',
      customerPhone: orderData.customerPhone,
      paymentMethod: orderData.paymentMethod,
      deliveryMethod: orderData.deliveryMethod,
      couponCode: orderData.couponCode,
      shippingAddress: orderData.shippingAddress || {
        fullName: orderData.customerName || 'Customer',
        email: orderData.customerEmail || '',
        phone: orderData.customerPhone || '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      items,
    });
  }

  async updateOrderStatus(orderId: string, status: OrderType['status'], adminId?: string): Promise<OrderType | null> {
    await ensureConnection();
    const query = isObjectId(orderId)
      ? { $or: [{ _id: orderId }, { orderNumber: orderId }] }
      : { orderNumber: orderId };
    const doc = await Order.findOneAndUpdate(query, { status }, { new: true });
    if (!doc) return null;
    if (status === 'shipped') {
      await Notification.create({
        userId: doc.userId || null,
        type: 'order_shipped',
        title: `Order ${doc.orderNumber} shipped`,
        message: doc.trackingNumber ? `Tracking: ${doc.trackingNumber}` : 'Your order is on the way.',
        link: '/account/orders',
      });
    }
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'order_status_changed',
        entityType: 'order',
        entityId: String(doc._id),
        details: { status, orderNumber: doc.orderNumber },
      });
    }
    const [order] = await hydrateOrders([doc.toObject()]);
    return order;
  }

  async updateOrderAdmin(
    orderId: string,
    updates: { status?: OrderType['status']; paymentStatus?: OrderType['paymentStatus']; trackingNumber?: string },
    adminId: string
  ): Promise<OrderType | null> {
    await ensureConnection();
    const query = isObjectId(orderId)
      ? { $or: [{ _id: orderId }, { orderNumber: orderId }] }
      : { orderNumber: orderId };
    const doc = await Order.findOneAndUpdate(query, updates, { new: true });
    if (!doc) return null;
    await AdminLog.create({
      adminId,
      action: 'order_updated',
      entityType: 'order',
      entityId: orderId,
      details: updates,
    });
    const [order] = await hydrateOrders([doc.toObject()]);
    return order;
  }

  validateCouponDoc(coupon: any, orderSubtotal: number): { valid: boolean; coupon?: CouponType; message?: string } {
    if (!coupon || !coupon.isActive) return { valid: false, message: 'Invalid or inactive promo code.' };
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { valid: false, message: 'This promo code has expired.' };
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'This promo code has reached its usage limit.' };
    }
    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
      return { valid: false, message: `Minimum order amount for this code is $${coupon.minOrderAmount}.` };
    }
    return { valid: true, coupon: mapCoupon(coupon) };
  }

  async getCoupons(): Promise<CouponType[]> {
    await ensureConnection();
    const docs = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return docs.map(mapCoupon);
  }

  async validateCoupon(code: string, orderSubtotal: number): Promise<{ valid: boolean; coupon?: CouponType; message?: string }> {
    await ensureConnection();
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
    return this.validateCouponDoc(coupon, orderSubtotal);
  }

  async createCoupon(coupon: Partial<CouponType>, adminId?: string): Promise<CouponType> {
    await ensureConnection();
    const created = await Coupon.create({
      code: (coupon.code || `PROMO${Math.floor(10 + Math.random() * 90)}`).toUpperCase(),
      description: coupon.description || 'Special Discount',
      discountType: coupon.discountType || 'percentage',
      discountValue: Number(coupon.discountValue) || 10,
      minOrderAmount: Number(coupon.minOrderAmount) || 0,
      maxDiscountAmount: coupon.maxDiscountAmount != null ? Number(coupon.maxDiscountAmount) : undefined,
      usageLimit: coupon.usageLimit != null ? Number(coupon.usageLimit) : 100,
      usedCount: 0,
      isActive: coupon.isActive !== false,
      expiresAt: coupon.expiresAt,
    });
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: 'coupon_created',
        entityType: 'coupon',
        entityId: String(created._id),
        details: { code: created.code },
      });
    }
    return mapCoupon(created);
  }

  async deleteCoupon(id: string, adminId?: string): Promise<boolean> {
    await ensureConnection();
    const res = await Coupon.deleteOne({ _id: id });
    if (adminId) {
      await AdminLog.create({ adminId, action: 'coupon_deleted', entityType: 'coupon', entityId: id });
    }
    return res.deletedCount > 0;
  }

  async addProductReview(productId: string, reviewData: Partial<ProductReview>, userId?: string): Promise<ProductReview> {
    await ensureConnection();
    const product = await findProductDoc(productId);
    if (!product) throw new Error('Product not found.');
    const rating = Number(reviewData.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5.');

    let isVerifiedPurchase = false;
    if (userId) {
      const purchased = await OrderItem.aggregate([
        { $match: { productId: product._id } },
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order',
          },
        },
        { $unwind: '$order' },
        { $match: { 'order.userId': new mongoose.Types.ObjectId(userId), 'order.paymentStatus': { $in: ['paid', 'pending'] } } },
        { $limit: 1 },
      ]);
      isVerifiedPurchase = purchased.length > 0;
    }

    const created = await Review.create({
      productId: product._id,
      userId: userId || undefined,
      userName: reviewData.userName || 'Collector',
      userAvatar: reviewData.userAvatar,
      rating,
      title: reviewData.title || 'Customer Review',
      comment: reviewData.comment || '',
      isVerifiedPurchase,
    });

    const stats = await Review.aggregate([
      { $match: { productId: product._id } },
      { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      product.rating = Number(stats[0].avg.toFixed(2));
      product.reviewsCount = stats[0].count;
      await product.save();
    }

    await Notification.create({
      userId: null,
      type: 'review_added',
      title: `New review for ${product.title}`,
      message: `${created.userName} rated ${rating}/5`,
      link: `/products/${product.slug}`,
    });

    await redisCache.invalidateProductCache(product.slug, String(product._id));
    return mapReview(created);
  }

  async getNotifications(userId?: string | null, staff = false): Promise<StoreNotification[]> {
    await ensureConnection();
    const query = staff ? { $or: [{ userId: null }, ...(userId ? [{ userId }] : [])] } : { userId };
    const docs = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
    return docs.map(mapNotification);
  }

  async markNotificationAsRead(id: string, userId?: string, staff = false): Promise<void> {
    await ensureConnection();
    const query: Record<string, unknown> = { _id: id };
    if (!staff && userId) query.userId = userId;
    await Notification.updateOne(query, { isRead: true });
  }

  async getCustomers(): Promise<UserProfile[]> {
    await ensureConnection();
    const docs = await User.find({}).sort({ createdAt: -1 }).lean();
    return docs.map(mapUser);
  }

  async findUserByEmail() {
    return null;
  }

  async findUserById() {
    return null;
  }

  async createUser() {
    throw new Error('Use /api/auth/register');
  }

  async getAnalytics(): Promise<AnalyticsSummary> {
    await ensureConnection();
    const [products, orders, users] = await Promise.all([
      Product.find({}).lean(),
      Order.find({}).lean(),
      User.countDocuments(),
    ]);
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
    const lowStockCount = products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      salesMap.set(dayNames[d.getDay()], { revenue: 0, orders: 0 });
    }
    for (const order of paidOrders) {
      const day = dayNames[new Date(order.createdAt).getDay()];
      const entry = salesMap.get(day);
      if (entry) {
        entry.revenue += order.totalAmount;
        entry.orders += 1;
      }
    }

    const categories = await Category.find({}).lean();
    const categoryRevenue = categories.map((c) => ({
      category: c.name,
      revenue: 0,
      percentage: 0,
    }));
    const items = await OrderItem.find({}).lean();
    const productById = new Map(products.map((p) => [String(p._id), p]));
    let itemRevenueTotal = 0;
    const productSales = new Map<string, { title: string; imageUrl: string; price: number; salesCount: number; totalRevenue: number }>();
    for (const item of items) {
      itemRevenueTotal += item.totalPrice;
      const prod = productById.get(String(item.productId));
      const key = String(item.productId || item.sku);
      const current = productSales.get(key) || {
        title: item.productTitle,
        imageUrl: item.productImage,
        price: item.unitPrice,
        salesCount: 0,
        totalRevenue: 0,
      };
      current.salesCount += item.quantity;
      current.totalRevenue += item.totalPrice;
      productSales.set(key, current);
      if (prod) {
        const cat = categoryRevenue.find((c) => String(prod.categoryId) === String(categories.find((x) => x.name === c.category)?._id));
        if (cat) cat.revenue += item.totalPrice;
      }
    }
    for (const cat of categoryRevenue) {
      cat.percentage = itemRevenueTotal ? Math.round((cat.revenue / itemRevenueTotal) * 100) : 0;
    }

    const topSellingProducts = Array.from(productSales.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: users,
      totalProducts: products.length,
      pendingOrders,
      lowStockCount,
      revenueChangePct: 0,
      ordersChangePct: 0,
      customersChangePct: 0,
      salesData: Array.from(salesMap.entries()).map(([date, v]) => ({ date, ...v })),
      categoryDistribution: categoryRevenue.filter((c) => c.revenue > 0).slice(0, 6),
      topSellingProducts,
    };
  }

  async getAdminLogs() {
    await ensureConnection();
    return AdminLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
  }
}

export const storeDb = new StoreDatabase();
export { ensureSeeded, ensureConnection };
