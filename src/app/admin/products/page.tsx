'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  AlertTriangle,
  Check,
  X,
  Package,
} from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { INITIAL_CATEGORIES } from '@/lib/data/initial-data';
import { Product, Category, ProductBadge } from '@/types';
import { formatPrice, slugify, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

function ProductsAdminContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [brandName, setBrandName] = useState('Luxe Atelier');
  const [categoryId, setCategoryId] = useState(INITIAL_CATEGORIES[0].id);
  const [price, setPrice] = useState('1250');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('3');
  const [badge, setBadge] = useState<ProductBadge | ''>('NEW');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const loadData = async () => {
    const prods = await storeDb.getProducts();
    const cats = await storeDb.getCategories();
    setProducts(prods);
    setCategories(cats);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setTitle('');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setBrandName('Luxe Atelier');
    setCategoryId(categories[0]?.id || 'cat-1');
    setPrice('1250');
    setOriginalPrice('1450');
    setStockQuantity('12');
    setLowStockThreshold('3');
    setBadge('NEW');
    setShortDescription('Handcrafted titanium and sapphire crystal masterwork.');
    setDescription('Precision engineered using aerospace materials and hand-finished by master artisans.');
    setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setSku(prod.sku);
    setBrandName(prod.brandName || 'Luxe Atelier');
    setCategoryId(prod.categoryId);
    setPrice(prod.price.toString());
    setOriginalPrice(prod.originalPrice ? prod.originalPrice.toString() : '');
    setStockQuantity(prod.stockQuantity.toString());
    setLowStockThreshold(prod.lowStockThreshold.toString());
    setBadge(prod.badge || '');
    setShortDescription(prod.shortDescription);
    setDescription(prod.description);
    setImageUrl(prod.images[0] || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const catObj = categories.find((c) => c.id === categoryId);
    const productPayload: Partial<Product> = {
      title,
      slug: slugify(title),
      sku,
      brandName,
      categoryId,
      categoryName: catObj?.name || 'General',
      price: parseFloat(price) || 0,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      lowStockThreshold: parseInt(lowStockThreshold, 10) || 3,
      badge: (badge as ProductBadge) || undefined,
      shortDescription,
      description,
      images: [imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'],
    };

    if (editingProduct) {
      await storeDb.updateProduct(editingProduct.id, productPayload);
      showToast({
        type: 'success',
        title: 'Product Updated',
        message: `${title} was updated and Redis cache was invalidated.`,
      });
    } else {
      await storeDb.createProduct(productPayload);
      showToast({
        type: 'success',
        title: 'Product Created',
        message: `${title} has been added to the master vault catalog.`,
      });
    }

    setIsModalOpen(false);
    await loadData();
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    await storeDb.deleteProduct(deletingProduct.id);
    showToast({
      type: 'info',
      title: 'Product Removed',
      message: `${deletingProduct.title} was removed from the catalog.`,
    });
    setDeletingProduct(null);
    await loadData();
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brandName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (selectedBadge && p.badge !== selectedBadge) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catalog Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Products & Inventory Management ({products.length})
          </h1>
        </div>

        <Button
          variant="gold"
          size="md"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Product
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-border-light bg-surface-200/90 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, SKU, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-100 border border-border-light rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-gold-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBadge}
            onChange={(e) => setSelectedBadge(e.target.value)}
            className="bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-gold-500"
          >
            <option value="">All Badges</option>
            <option value="NEW">New</option>
            <option value="BEST SELLER">Best Seller</option>
            <option value="SALE">Sale</option>
            <option value="LIMITED">Limited</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl glass-panel border border-border-light bg-surface-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-border-subtle font-bold uppercase tracking-wider bg-surface-100/50">
                <th className="p-4">Piece</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Badge</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stockQuantity <= 0;
                const isLowStock = !isOutOfStock && product.stockQuantity <= product.lowStockThreshold;

                return (
                  <tr key={product.id} className="hover:bg-white/[0.01] transition-colors">
                    {/* Title & Image */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-100 shrink-0 border border-white/5">
                          <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <h4 className="text-xs font-bold text-white truncate">{product.title}</h4>
                          <p className="text-[11px] text-gray-400">{product.brandName || 'Luxe Atelier'}</p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="p-4 font-mono text-gray-300">{product.sku}</td>

                    {/* Category */}
                    <td className="p-4 text-gray-300">{product.categoryName}</td>

                    {/* Price */}
                    <td className="p-4">
                      <span className="font-bold text-white">{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-gray-500 line-through ml-1.5">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-400' : 'bg-emerald-400'
                          )}
                        />
                        <span
                          className={cn(
                            isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-gray-200'
                          )}
                        >
                          {product.stockQuantity} units
                        </span>
                      </div>
                    </td>

                    {/* Badge */}
                    <td className="p-4">
                      {product.badge ? (
                        <Badge variant="gold" size="sm">
                          {product.badge}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-100"
                          title="View on live storefront"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gold-400 hover:bg-surface-100"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-surface-100"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="2xl"
        title={editingProduct ? `Edit Piece "${editingProduct.title}"` : 'Create New Luxury Piece'}
        description="Add specifications and assets. Changes automatically update Redis cache."
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <Input
            label="Product Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Aethelgard Chrono 02 Titanium"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="SKU Identifier"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="WTC-ATH-002"
              required
            />
            <Input
              label="Brand / Atelier"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Aethelgard"
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Department
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-gold-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              label="Regular Price ($)"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Original Price ($)"
              type="number"
              step="0.01"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Stock Qty"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Badge
              </label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value as any)}
                className="w-full bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-gold-500"
              >
                <option value="">None</option>
                <option value="NEW">NEW</option>
                <option value="BEST SELLER">BEST SELLER</option>
                <option value="SALE">SALE</option>
                <option value="LIMITED">LIMITED</option>
              </select>
            </div>
          </div>

          <Input
            label="Primary High-Res Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            required
          />

          <Input
            label="Short Punchy Tagline"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="One-line summary for cards"
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Full Curatorial Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-100 border border-border-light rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              placeholder="Detailed heritage, materials, caliber, and dimensions..."
            />
          </div>

          <div className="pt-3 border-t border-border-subtle flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="md">
              {editingProduct ? 'Save Changes' : 'Publish Piece'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safety Confirmation Modal for Deletion */}
      <Modal
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        maxWidth="md"
        title="Confirm Permanent Deletion"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">Irreversible Catalog Deletion</p>
              <p className="mt-1">
                You are about to delete <strong className="text-white">{deletingProduct?.title}</strong> ({deletingProduct?.sku}). This will purge the piece from all active sessions and invalidate Redis cache keys.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="md" onClick={() => setDeletingProduct(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-400">Loading catalog...</div>}>
      <ProductsAdminContent />
    </Suspense>
  );
}
