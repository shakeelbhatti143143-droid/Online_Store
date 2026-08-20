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
  Sparkles,
  AlertTriangle,
  Check,
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
  const [categories, setCategories] =
    useState<Category[]>(INITIAL_CATEGORIES);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(
    searchParams.get('action') === 'new'
  );

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [deletingProduct, setDeletingProduct] =
    useState<Product | null>(null);

  // =========================================================
  // FORM FIELDS
  // =========================================================

  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [brandName, setBrandName] = useState('Luxe Atelier');
  const [categoryId, setCategoryId] = useState(
    INITIAL_CATEGORIES[0]?.id || 'cat-1'
  );

  const [price, setPrice] = useState('1250');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('3');
  const [badge, setBadge] =
    useState<ProductBadge | ''>('NEW');

  const [shortDescription, setShortDescription] =
    useState('');

  const [description, setDescription] =
    useState('');

  // =========================================================
  // THREE PRODUCT IMAGES
  // =========================================================

  const [imageUrls, setImageUrls] = useState([
    '',
    '',
    '',
  ]);

  // Which image is currently being imported
  const [importingImage, setImportingImage] =
    useState<number | null>(null);

  // =========================================================
  // LOAD PRODUCTS + CATEGORIES
  // =========================================================

  const loadData = async () => {
    try {
      const prods = await storeDb.getProducts();
      const cats = await storeDb.getCategories();

      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load product data:', error);

      showToast({
        type: 'error',
        title: 'Loading Failed',
        message: 'Unable to load products and categories.',
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // OPEN ADD PRODUCT
  // =========================================================

  const handleOpenAdd = () => {
    setEditingProduct(null);

    setTitle('');

    setSku(
      `SKU-${Math.floor(
        1000 + Math.random() * 9000
      )}`
    );

    setBrandName('Luxe Atelier');

    setCategoryId(
      categories[0]?.id || 'cat-1'
    );

    setPrice('1250');
    setOriginalPrice('1450');
    setStockQuantity('12');
    setLowStockThreshold('3');
    setBadge('NEW');

    setShortDescription(
      'Handcrafted titanium and sapphire crystal masterwork.'
    );

    setDescription(
      'Precision engineered using aerospace materials and hand-finished by master artisans.'
    );

    // Reset all 3 images
    setImageUrls([
      '',
      '',
      '',
    ]);

    setIsModalOpen(true);
  };

  // =========================================================
  // OPEN EDIT PRODUCT
  // =========================================================

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);

    setTitle(prod.title);

    setSku(prod.sku);

    setBrandName(
      prod.brandName || 'Luxe Atelier'
    );

    setCategoryId(prod.categoryId);

    setPrice(
      prod.price.toString()
    );

    setOriginalPrice(
      prod.originalPrice
        ? prod.originalPrice.toString()
        : ''
    );

    setStockQuantity(
      prod.stockQuantity.toString()
    );

    setLowStockThreshold(
      prod.lowStockThreshold.toString()
    );

    setBadge(
      prod.badge || ''
    );

    setShortDescription(
      prod.shortDescription
    );

    setDescription(
      prod.description
    );

    // Load up to 3 existing images
    setImageUrls([
      prod.images?.[0] || '',
      prod.images?.[1] || '',
      prod.images?.[2] || '',
    ]);

    setIsModalOpen(true);
  };

  // =========================================================
  // IMPORT ONE IMAGE INTO CLOUDINARY
  // =========================================================

  const handleImportImageUrl = async (
    index: number
  ) => {
    const url = imageUrls[index].trim();

    if (!url) {
      showToast({
        type: 'error',
        title: 'Image URL Required',
        message: `Please paste image ${index + 1} URL first.`,
      });

      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      showToast({
        type: 'error',
        title: 'Invalid Image URL',
        message:
          'Please enter a valid HTTP or HTTPS image URL.',
      });

      return;
    }

    if (
      !['http:', 'https:'].includes(
        parsedUrl.protocol
      )
    ) {
      showToast({
        type: 'error',
        title: 'Invalid Image URL',
        message:
          'Only HTTP and HTTPS image URLs are supported.',
      });

      return;
    }

    setImportingImage(index);

    try {
      const response = await fetch(
        '/api/upload-url',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            url,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'Failed to import image into Cloudinary.'
        );
      }

      // Replace external URL with Cloudinary URL
      setImageUrls((prev) => {
        const updated = [...prev];

        updated[index] = data.url;

        return updated;
      });

      showToast({
        type: 'success',
        title: `Image ${index + 1} Imported`,
        message:
          'The image has been uploaded to Cloudinary.',
      });
    } catch (error) {
      console.error(
        'Image import error:',
        error
      );

      showToast({
        type: 'error',
        title: `Image ${index + 1} Import Failed`,
        message:
          error instanceof Error
            ? error.message
            : 'Could not import the image into Cloudinary.',
      });
    } finally {
      setImportingImage(null);
    }
  };

  // =========================================================
  // SAVE PRODUCT
  // =========================================================

  const handleSaveProduct = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // Prevent saving while image is uploading
    if (importingImage !== null) {
      showToast({
        type: 'error',
        title: 'Image Still Uploading',
        message:
          'Please wait until the image finishes importing.',
      });

      return;
    }

    // Get only images that have values
    const validImages = imageUrls.filter(
      (url) => url.trim()
    );

    // At least one image is required
    if (validImages.length === 0) {
      showToast({
        type: 'error',
        title: 'Product Image Required',
        message:
          'Please provide at least one product image.',
      });

      return;
    }

    // New products require Cloudinary images
    if (
      !editingProduct &&
      validImages.some(
        (url) =>
          !url.startsWith(
            'https://res.cloudinary.com/'
          )
      )
    ) {
      showToast({
        type: 'error',
        title: 'Image Not Imported',
        message:
          'Please click "Import to Cloudinary" for every image before publishing.',
      });

      return;
    }

    const catObj = categories.find(
      (c) => c.id === categoryId
    );

    // =====================================================
    // PRODUCT PAYLOAD
    // =====================================================

    const productPayload: Partial<Product> = {
      title,

      slug: slugify(title),

      sku,

      brandName,

      categoryId,

      categoryName:
        catObj?.name || 'General',

      price:
        parseFloat(price) || 0,

      originalPrice: originalPrice
        ? parseFloat(originalPrice)
        : undefined,

      stockQuantity:
        parseInt(
          stockQuantity,
          10
        ) || 0,

      lowStockThreshold:
        parseInt(
          lowStockThreshold,
          10
        ) || 3,

      badge:
        (badge as ProductBadge) ||
        undefined,

      shortDescription,

      description,

      // IMPORTANT:
      // Save all product images
      images: validImages,
    };

    // =====================================================
    // CREATE / UPDATE
    // =====================================================

    try {
      if (editingProduct) {
        await storeDb.updateProduct(
          editingProduct.id,
          productPayload
        );

        showToast({
          type: 'success',
          title: 'Product Updated',
          message:
            `${title} was updated successfully.`,
        });
      } else {
        await storeDb.createProduct(
          productPayload
        );

        showToast({
          type: 'success',
          title: 'Product Created',
          message:
            `${title} has been added to the catalog.`,
        });
      }

      setIsModalOpen(false);

      await loadData();
    } catch (error) {
      console.error(
        'Product save error:',
        error
      );

      showToast({
        type: 'error',
        title: 'Product Save Failed',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to save the product.',
      });
    }
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDelete = async () => {
    if (!deletingProduct) {
      return;
    }

    try {
      await storeDb.deleteProduct(
        deletingProduct.id
      );

      showToast({
        type: 'info',
        title: 'Product Removed',
        message:
          `${deletingProduct.title} was removed from the catalog.`,
      });

      setDeletingProduct(null);

      await loadData();
    } catch (error) {
      console.error(
        'Product deletion error:',
        error
      );

      showToast({
        type: 'error',
        title: 'Delete Failed',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete the product.',
      });
    }
  };

  // =========================================================
  // FILTER PRODUCTS
  // =========================================================

  const filteredProducts =
    products.filter((p) => {
      if (searchQuery.trim()) {
        const q =
          searchQuery.toLowerCase();

        const match =
          p.title
            .toLowerCase()
            .includes(q) ||
          p.sku
            .toLowerCase()
            .includes(q) ||
          p.brandName
            ?.toLowerCase()
            .includes(q);

        if (!match) {
          return false;
        }
      }

      if (
        selectedCategory &&
        p.categoryId !==
          selectedCategory
      ) {
        return false;
      }

      if (
        selectedBadge &&
        p.badge !== selectedBadge
      ) {
        return false;
      }

      return true;
    });

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-8 pb-12">

      {/* =================================================== */}
      {/* HEADER */}
      {/* =================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">

        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">

            <Sparkles className="w-3.5 h-3.5" />

            <span>
              Catalog Control
            </span>

          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Products & Inventory
            Management ({products.length})
          </h1>
        </div>

        <Button
          variant="gold"
          size="md"
          onClick={handleOpenAdd}
          leftIcon={
            <Plus className="w-4 h-4" />
          }
        >
          Create New Product
        </Button>

      </div>

      {/* =================================================== */}
      {/* FILTER BAR */}
      {/* =================================================== */}

      <div className="p-4 rounded-2xl glass-panel border border-border-light bg-surface-200/90 flex flex-col md:flex-row items-center justify-between gap-4">

        <div className="relative w-full md:w-80">

          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            placeholder="Search by title, SKU, brand..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            className="w-full bg-surface-100 border border-border-light rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
          />

        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
            className="bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-gold-500"
          >

            <option value="">
              All Categories
            </option>

            {categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}

          </select>

          <select
            value={selectedBadge}
            onChange={(e) =>
              setSelectedBadge(
                e.target.value
              )
            }
            className="bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-gold-500"
          >

            <option value="">
              All Badges
            </option>

            <option value="NEW">
              New
            </option>

            <option value="BEST SELLER">
              Best Seller
            </option>

            <option value="SALE">
              Sale
            </option>

            <option value="LIMITED">
              Limited
            </option>

          </select>

        </div>

      </div>

      {/* =================================================== */}
      {/* PRODUCTS TABLE */}
      {/* =================================================== */}

      <div className="rounded-3xl glass-panel border border-border-light bg-surface-200/90 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs">

            <thead>

              <tr className="text-gray-400 border-b border-border-subtle font-bold uppercase tracking-wider bg-surface-100/50">

                <th className="p-4">
                  Piece
                </th>

                <th className="p-4">
                  SKU
                </th>

                <th className="p-4">
                  Category
                </th>

                <th className="p-4">
                  Price
                </th>

                <th className="p-4">
                  Stock
                </th>

                <th className="p-4">
                  Badge
                </th>

                <th className="p-4 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-border-subtle">

              {filteredProducts.map(
                (product) => {

                  const isOutOfStock =
                    product.stockQuantity <=
                    0;

                  const isLowStock =
                    !isOutOfStock &&
                    product.stockQuantity <=
                      product.lowStockThreshold;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-white/[0.01] transition-colors"
                    >

                      {/* PRODUCT IMAGE */}

                      <td className="p-4">

                        <div className="flex items-center gap-3">

                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-100 shrink-0 border border-white/5">

                            {product.images?.[0] ? (
                              <Image
                                src={
                                  product.images[0]
                                }
                                alt={
                                  product.title
                                }
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                —
                              </div>
                            )}

                          </div>

                          <div className="min-w-0 max-w-xs">

                            <h4 className="text-xs font-bold text-white truncate">
                              {product.title}
                            </h4>

                            <p className="text-[11px] text-gray-400">
                              {product.brandName ||
                                'Luxe Atelier'}
                            </p>

                            {product.images?.length >
                              1 && (
                              <p className="text-[10px] text-gold-400 mt-0.5">
                                {product.images.length}{' '}
                                images
                              </p>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* SKU */}

                      <td className="p-4 font-mono text-gray-300">
                        {product.sku}
                      </td>

                      {/* CATEGORY */}

                      <td className="p-4 text-gray-300">
                        {product.categoryName}
                      </td>

                      {/* PRICE */}

                      <td className="p-4">

                        <span className="font-bold text-white">
                          {formatPrice(
                            product.price
                          )}
                        </span>

                        {product.originalPrice && (
                          <span className="text-[10px] text-gray-500 line-through ml-1.5">
                            {formatPrice(
                              product.originalPrice
                            )}
                          </span>
                        )}

                      </td>

                      {/* STOCK */}

                      <td className="p-4">

                        <div className="flex items-center gap-1.5 font-semibold">

                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              isOutOfStock
                                ? 'bg-rose-500'
                                : isLowStock
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            )}
                          />

                          <span
                            className={cn(
                              isOutOfStock
                                ? 'text-rose-400'
                                : isLowStock
                                ? 'text-amber-400'
                                : 'text-gray-200'
                            )}
                          >
                            {
                              product.stockQuantity
                            }{' '}
                            units
                          </span>

                        </div>

                      </td>

                      {/* BADGE */}

                      <td className="p-4">

                        {product.badge ? (
                          <Badge
                            variant="gold"
                            size="sm"
                          >
                            {product.badge}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">
                            —
                          </span>
                        )}

                      </td>

                      {/* ACTIONS */}

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
                            onClick={() =>
                              handleOpenEdit(
                                product
                              )
                            }
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gold-400 hover:bg-surface-100"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              setDeletingProduct(
                                product
                              )
                            }
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-surface-100"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================== */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {/* =================================================== */}

      <Modal
        isOpen={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        maxWidth="2xl"
        title={
          editingProduct
            ? `Edit Piece "${editingProduct.title}"`
            : 'Create New Luxury Piece'
        }
        description="Add specifications and up to 3 product images."
      >

        <form
          onSubmit={
            handleSaveProduct
          }
          className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"
        >

          {/* PRODUCT TITLE */}

          <Input
            label="Product Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="e.g. Aethelgard Chrono 02 Titanium"
            required
          />

          {/* SKU / BRAND / CATEGORY */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <Input
              label="SKU Identifier"
              value={sku}
              onChange={(e) =>
                setSku(e.target.value)
              }
              placeholder="WTC-ATH-002"
              required
            />

            <Input
              label="Brand / Atelier"
              value={brandName}
              onChange={(e) =>
                setBrandName(
                  e.target.value
                )
              }
              placeholder="Aethelgard"
            />

            <div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Department
              </label>

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
                className="w-full bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-gold-500"
              >

                {categories.map(
                  (c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.name}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          {/* PRICE / STOCK / BADGE */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

            <Input
              label="Regular Price ($)"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              required
            />

            <Input
              label="Original Price ($)"
              type="number"
              step="0.01"
              value={
                originalPrice
              }
              onChange={(e) =>
                setOriginalPrice(
                  e.target.value
                )
              }
              placeholder="Optional"
            />

            <Input
              label="Stock Qty"
              type="number"
              value={
                stockQuantity
              }
              onChange={(e) =>
                setStockQuantity(
                  e.target.value
                )
              }
              required
            />

            <div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Badge
              </label>

              <select
                value={badge}
                onChange={(e) =>
                  setBadge(
                    e.target.value as
                      | ProductBadge
                      | ''
                  )
                }
                className="w-full bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-gold-500"
              >

                <option value="">
                  None
                </option>

                <option value="NEW">
                  NEW
                </option>

                <option value="BEST SELLER">
                  BEST SELLER
                </option>

                <option value="SALE">
                  SALE
                </option>

                <option value="LIMITED">
                  LIMITED
                </option>

              </select>

            </div>

          </div>

          {/* ================================================= */}
          {/* THREE CLOUDINARY PRODUCT IMAGES */}
          {/* ================================================= */}

          <div className="space-y-4">

            <div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Product Images
              </label>

              <p className="text-[11px] text-gray-500">
                Add up to 3 high-resolution
                product images. Each image
                must be imported into
                Cloudinary before publishing.
              </p>

            </div>

            {imageUrls.map(
              (url, index) => (

                <div
                  key={index}
                  className="p-4 rounded-2xl border border-border-light bg-surface-100/50 space-y-3"
                >

                  {/* IMAGE HEADER */}

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-bold text-white">

                      Image {index + 1}

                      {index === 0 && (
                        <span className="ml-2 text-gold-400">
                          Primary
                        </span>
                      )}

                    </span>

                    {url.startsWith(
                      'https://res.cloudinary.com/'
                    ) && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">

                        <Check className="w-4 h-4" />

                        <span>
                          Stored in Cloudinary
                        </span>

                      </div>
                    )}

                  </div>

                  {/* URL + IMPORT BUTTON */}

                  <div className="flex flex-col sm:flex-row gap-2">

                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {

                        const value =
                          e.target.value;

                        setImageUrls(
                          (prev) => {

                            const updated =
                              [...prev];

                            updated[index] =
                              value;

                            return updated;
                          }
                        );

                      }}
                      placeholder={`Paste image ${
                        index + 1
                      } URL...`}
                      className="flex-1 w-full bg-surface-100 border border-border-light text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-gold-500"
                    />

                    <Button
                      type="button"
                      variant="gold"
                      size="md"
                      onClick={() =>
                        handleImportImageUrl(
                          index
                        )
                      }
                      disabled={
                        importingImage !==
                          null ||
                        !url.trim()
                      }
                    >

                      {importingImage ===
                      index
                        ? 'Importing...'
                        : 'Import to Cloudinary'}

                    </Button>

                  </div>

                  {/* IMAGE PREVIEW */}

                  {url && (
                    <div className="relative overflow-hidden rounded-2xl border border-border-light bg-surface-100 aspect-[4/3]">

                      <Image
                        src={url}
                        alt={`${title || 'Product'} image ${
                          index + 1
                        }`}
                        fill
                        className="object-cover"
                        unoptimized
                      />

                    </div>
                  )}

                </div>

              )
            )}

          </div>

          {/* SHORT DESCRIPTION */}

          <Input
            label="Short Punchy Tagline"
            value={
              shortDescription
            }
            onChange={(e) =>
              setShortDescription(
                e.target.value
              )
            }
            placeholder="One-line summary for cards"
          />

          {/* DESCRIPTION */}

          <div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Full Curatorial Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              className="w-full bg-surface-100 border border-border-light rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              placeholder="Detailed heritage, materials, caliber, and dimensions..."
            />

          </div>

          {/* ================================================= */}
          {/* FORM BUTTONS */}
          {/* ================================================= */}

          <div className="pt-3 border-t border-border-subtle flex justify-end gap-3">

            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() =>
                setIsModalOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="gold"
              size="md"
              disabled={
                importingImage !== null
              }
            >
              {editingProduct
                ? 'Save Changes'
                : 'Publish Piece'}
            </Button>

          </div>

        </form>

      </Modal>

      {/* =================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* =================================================== */}

      <Modal
        isOpen={Boolean(
          deletingProduct
        )}
        onClose={() =>
          setDeletingProduct(null)
        }
        maxWidth="md"
        title="Confirm Permanent Deletion"
      >

        <div className="space-y-4">

          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">

            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />

            <div>

              <p className="font-bold text-rose-300">
                Irreversible Catalog Deletion
              </p>

              <p className="mt-1">

                You are about to delete{' '}

                <strong className="text-white">

                  {deletingProduct?.title}

                </strong>{' '}

                (
                {deletingProduct?.sku}
                ).

                This will permanently
                remove the product from
                the catalog.

              </p>

            </div>

          </div>

          <div className="flex justify-end gap-3 pt-2">

            <Button
              variant="ghost"
              size="md"
              onClick={() =>
                setDeletingProduct(
                  null
                )
              }
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              size="md"
              onClick={
                handleDelete
              }
            >
              Confirm Delete
            </Button>

          </div>

        </div>

      </Modal>

    </div>
  );
}

// =========================================================
// PAGE
// =========================================================

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-gray-400">
          Loading catalog...
        </div>
      }
    >
      <ProductsAdminContent />
    </Suspense>
  );
}