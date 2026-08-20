'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { Category } from '@/types';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

export default function AdminCategoriesPage() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // New Cloudinary upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    const data = await storeDb.getCategories();
    setCategories(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');

    // Keep your existing default image
    setImageUrl(
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop'
    );

    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setImageUrl(cat.imageUrl);

    setImageFile(null);
    setImagePreview('');

    setIsModalOpen(true);
  };

  /**
   * Upload an image to Cloudinary.
   * The actual image is stored on Cloudinary.
   * Only the returned URL is saved to MongoDB.
   */
  const uploadCategoryImage = async (
    file: File
  ): Promise<string> => {
    const formData = new FormData();

    formData.append('file', file);
    formData.append(
      'folder',
      'online-store/categories'
    );

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
          'Category image upload failed.'
      );
    }

    return result.url;
  };

  /**
   * Handle selecting a category image.
   */
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Invalid Image',
        message: 'Please select a valid image file.',
      });

      e.target.value = '';
      return;
    }

    // 10 MB maximum
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      showToast({
        type: 'error',
        title: 'Image Too Large',
        message: 'Image must be smaller than 10 MB.',
      });

      e.target.value = '';
      return;
    }

    setImageFile(file);

    // Create local preview
    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  /**
   * Remove selected image before saving.
   */
  const handleRemoveSelectedImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      let finalImageUrl = imageUrl;

      /*
       * If the admin selected a new image,
       * upload it to Cloudinary first.
       */
      if (imageFile) {
        setUploadingImage(true);

        try {
          finalImageUrl =
            await uploadCategoryImage(imageFile);
        } finally {
          setUploadingImage(false);
        }
      }

      const payload: Partial<Category> = {
        name,
        slug: slugify(name),
        description,
        imageUrl: finalImageUrl,
      };

      if (editingCategory) {
        await storeDb.updateCategory(
          editingCategory.id,
          payload
        );

        showToast({
          type: 'success',
          title: 'Department Updated',
          message: `${name} saved.`,
        });
      } else {
        await storeDb.createCategory(payload);

        showToast({
          type: 'success',
          title: 'Department Added',
          message: `${name} created.`,
        });
      }

      setIsModalOpen(false);

      setImageFile(null);
      setImagePreview('');

      await loadData();
    } catch (error) {
      console.error(
        'Category save error:',
        error
      );

      showToast({
        type: 'error',
        title: 'Save Failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to save category.',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (
    id: string,
    catName: string
  ) => {
    if (
      confirm(
        `Are you sure you want to delete category "${catName}"?`
      )
    ) {
      try {
        await storeDb.deleteCategory(id);

        showToast({
          type: 'info',
          title: 'Category Removed',
          message: `${catName} deleted.`,
        });

        await loadData();
      } catch (error) {
        console.error(
          'Category delete error:',
          error
        );

        showToast({
          type: 'error',
          title: 'Delete Failed',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to delete category.',
        });
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />

            <span>Taxonomy Control</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Vault Categories & Departments (
            {categories.length})
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
          Create Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-3xl glass-card border border-border-light overflow-hidden bg-surface-200/90 flex flex-col justify-between"
          >
            <div className="relative aspect-[16/10] w-full bg-surface-100">
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <span className="absolute bottom-3 left-4 text-[11px] font-bold uppercase tracking-wider bg-black/60 px-2.5 py-1 rounded-full text-gold-400 border border-white/10">
                {cat.productCount || 0} Pieces
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {cat.name}
                </h3>

                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-500">
                  slug: {cat.slug}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleOpenEdit(cat)
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gold-400 hover:bg-surface-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        cat.id,
                        cat.name
                      )
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-surface-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() =>
          !uploadingImage &&
          setIsModalOpen(false)
        }
        maxWidth="md"
        title={
          editingCategory
            ? `Edit Department "${editingCategory.name}"`
            : 'Create Department'
        }
      >
        <form
          onSubmit={handleSave}
          className="space-y-4"
        >
          <Input
            label="Department Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="e.g. Fine Horology"
            required
          />

          {/* Existing URL input - kept for compatibility */}
          <Input
            label="High-Res Image URL"
            value={imageUrl}
            onChange={(e) =>
              setImageUrl(e.target.value)
            }
            placeholder="https://..."
          />

          {/* Cloudinary Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Upload Category Image
            </label>

            <div className="rounded-xl border border-dashed border-border-light bg-surface-100 p-4">
              <label
                htmlFor="category-image-upload"
                className="flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-6 h-6 text-gold-400" />

                <span className="text-sm text-gray-300">
                  Click to choose an image
                </span>

                <span className="text-xs text-gray-500">
                  PNG, JPG, JPEG or WEBP • Max 10 MB
                </span>

                <input
                  id="category-image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={
                    handleImageChange
                  }
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {/* Selected Image Preview */}
            {imagePreview && (
              <div className="relative mt-3 overflow-hidden rounded-xl border border-border-light">
                <img
                  src={imagePreview}
                  alt="Selected category"
                  className="w-full h-40 object-cover"
                />

                {!uploadingImage && (
                  <button
                    type="button"
                    onClick={
                      handleRemoveSelectedImage
                    }
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                    aria-label="Remove selected image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {imageFile && (
              <p className="mt-2 text-xs text-gray-500">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Curatorial Description
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              className="w-full bg-surface-100 border border-border-light rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() =>
                setIsModalOpen(false)
              }
              disabled={uploadingImage}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="gold"
              size="md"
              disabled={uploadingImage}
            >
              {uploadingImage
                ? 'Uploading Image...'
                : editingCategory
                  ? 'Save Department'
                  : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}