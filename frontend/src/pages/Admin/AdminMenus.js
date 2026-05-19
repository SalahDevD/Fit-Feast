import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { InlineErrorState } from '../../components/Feedback/InlineErrorState';
import { AdminForm } from '../../components/Admin/AdminForm';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminModal } from '../../components/Admin/AdminModal';
import {
  useAdminCategoriesQuery,
  useAdminCategoryMutations,
} from '../../queries/useAdminQueries';

export const AdminMenus = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const categoriesQuery = useAdminCategoriesQuery({ page_size: 200 });
  const { createCategory, updateCategory, deleteCategory } = useAdminCategoryMutations();
  const categories = useMemo(() => categoriesQuery.data?.rows || [], [categoriesQuery.data]);
  const loading = categoriesQuery.isPending && !categories.length;
  const saving = createCategory.isPending || updateCategory.isPending;

  const normalizeCategoryPayload = (formData) => {
    const parentValue = formData.parent;
    const normalizedParent =
      parentValue === undefined ||
      parentValue === null ||
      parentValue === '' ||
      parentValue === 'None'
        ? editingCategory?.parent ?? null
        : Number.isNaN(Number(parentValue))
          ? parentValue
          : Number(parentValue);

    return {
      ...formData,
      parent: normalizedParent,
      is_active: formData.is_active ?? true,
    };
  };

  const showCategoryError = (error, fallbackMessage) => {
    const errors = error.response?.data;

    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`;
          }
          return `${field}: ${messages}`;
        })
        .join('\n');

      toast.error(`Error:\n${errorMessages}`);
      return;
    }

    toast.error(errors?.detail || errors?.error || fallbackMessage);
  };

  const handleCreate = async (formData) => {
    try {
      await createCategory.mutateAsync(normalizeCategoryPayload(formData));
      setShowModal(false);
    } catch (error) {
      showCategoryError(error, 'The category could not be created.');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        payload: normalizeCategoryPayload(formData),
      });
      setShowModal(false);
      setEditingCategory(null);
    } catch (error) {
      showCategoryError(error, 'The category could not be updated.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory.mutateAsync(id);
    } catch (error) {
      showCategoryError(error, 'The category could not be deleted.');
    }
  };

  const categoryFields = useMemo(
    () => [
      { name: 'name', label: 'Name', type: 'text', required: true },
    ],
    []
  );

  const renderCategoryTree = (parentId = null, level = 0) => {
    const childCategories = categories.filter(
      (category) => (parentId ? category.parent === parentId : !category.parent)
    );

    if (childCategories.length === 0 && parentId) return null;

    return (
      <div style={{ paddingLeft: `${level * 20}px` }}>
        {childCategories.map((category) => {
          const hasChildren = categories.some((item) => item.parent === category.id);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="mb-2">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                {hasChildren ? (
                  <button
                    onClick={() => {
                      const nextExpanded = new Set(expandedCategories);
                      if (isExpanded) {
                        nextExpanded.delete(category.id);
                      } else {
                        nextExpanded.add(category.id);
                      }
                      setExpandedCategories(nextExpanded);
                    }}
                    className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {isExpanded ? 'v' : '>'}
                  </button>
                ) : (
                  <span className="w-4" />
                )}

                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {category.name}
                  </p>
                  {!category.is_active ? (
                    <span className="text-xs font-semibold text-rose-500">Inactive</span>
                  ) : null}
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(category);
                    setShowModal(true);
                  }}
                  className="ff-button-secondary px-3 py-2 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="ff-button-secondary border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
                >
                  Delete
                </button>
              </div>

              {hasChildren && isExpanded ? (
                <div className="mt-2">
                  {renderCategoryTree(category.id, level + 1)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Menu Categories" subtitle="Shape the navigation of your food catalog with clearer parent and child categories.">
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Menu Categories" subtitle="Shape the navigation of your food catalog with clearer parent and child categories.">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
          className="ff-button-primary"
        >
          Add category
        </button>

        <span className="text-sm text-slate-500">
          {categoriesQuery.isFetching ? 'Syncing categories...' : `${categories.length} categories`}
        </span>
      </div>

      {categoriesQuery.isError ? (
        <div className="mb-6">
          <InlineErrorState
            title="The categories could not be loaded"
            description="The admin menu structure could not be synchronized."
            onRetry={() => categoriesQuery.refetch()}
          />
        </div>
      ) : null}

      <div className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        {categories.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No categories yet</p>
        ) : (
          renderCategoryTree()
        )}
      </div>

      <AdminModal
        isOpen={showModal}
        onClose={() => {
          if (saving) {
            return;
          }
          setShowModal(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit category' : 'Add category'}
      >
        <AdminForm
          fields={categoryFields}
          initialValues={
            editingCategory
              ? {
                  ...editingCategory,
                  is_active: editingCategory.is_active ?? true,
                }
              : {
                  is_active: true,
                }
          }
          onSubmit={(formData) => {
            if (editingCategory) {
              handleUpdate(formData);
            } else {
              handleCreate(formData);
            }
          }}
          loading={saving}
          submitLabel={editingCategory ? 'Update category' : 'Create category'}
        />
      </AdminModal>
    </AdminLayout>
  );
};

export default AdminMenus;
