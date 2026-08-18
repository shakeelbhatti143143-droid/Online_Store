'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Sparkles, FolderTree } from 'lucide-react';
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

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
    setImageUrl('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setImageUrl(cat.imageUrl);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<Category> = {
      name,
      slug: slugify(name),
      description,
      imageUrl,
    };

    if (editingCategory) {
      await storeDb.updateCategory(editingCategory.id, payload);
      showToast({ type: 'success', title: 'Department Updated', message: `${name} saved.` });
    } else {
      await storeDb.createCategory(payload);
      showToast({ type: 'success', title: 'Department Added', message: `${name} created.` });
    }

    setIsModalOpen(false);
    await loadData();
  };

  const handleDelete = async (id: string, catName: string) => {
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      await storeDb.deleteCategory(id);
      showToast({ type: 'info', title: 'Category Removed', message: `${catName} deleted.` });
      await loadData();
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
            Vault Categories & Departments ({categories.length})
          </h1>
        </div>

        <Button variant="gold" size="md" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
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
              <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-4 text-[11px] font-bold uppercase tracking-wider bg-black/60 px-2.5 py-1 rounded-full text-gold-400 border border-white/10">
                {cat.productCount || 0} Pieces
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">{cat.name}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cat.description}</p>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-500">slug: {cat.slug}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gold-400 hover:bg-surface-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
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
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        title={editingCategory ? `Edit Department "${editingCategory.name}"` : 'Create Department'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Department Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fine Horology"
            required
          />
          <Input
            label="High-Res Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            required
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Curatorial Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-100 border border-border-light rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="md">
              Save Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
