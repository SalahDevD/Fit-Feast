import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { adminAPI } from '../../api/axios';
import { InlineErrorState } from '../../components/Feedback/InlineErrorState';
import { AdminForm } from '../../components/Admin/AdminForm';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminModal } from '../../components/Admin/AdminModal';
import { AdminTable } from '../../components/Admin/AdminTable';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  useAdminCategoriesQuery,
  useAdminDishMutations,
  useAdminDishesQuery,
} from '../../queries/useAdminQueries';

export const AdminDishes = () => {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 350);
  const pageSize = 10;

  const dishesQuery = useAdminDishesQuery({
    page,
    page_size: pageSize,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filterCategory ? { categories: filterCategory } : {}),
  });
  const categoriesQuery = useAdminCategoriesQuery({ page_size: 200 });
  const { createDish, updateDish, deleteDish } = useAdminDishMutations();

  const dishes = dishesQuery.data?.rows || [];
  const total = dishesQuery.data?.total || 0;
  const categories = categoriesQuery.data?.rows || [];
  const saving = createDish.isPending || updateDish.isPending;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages || 1);
    }
  }, [page, totalPages]);

  const showDishError = (error, fallbackMessage) => {
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

  const normalizeDishPayload = (formData) => ({
    ...formData,
    categories: Array.isArray(formData.categories)
      ? formData.categories.map((value) => Number(value))
      : formData.categories
        ? [Number(formData.categories)]
        : [],
  });

  const handleCreate = async (formData) => {
    try {
      await createDish.mutateAsync(normalizeDishPayload(formData));
      setShowModal(false);
    } catch (error) {
      showDishError(error, 'The dish could not be created.');
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingDish?.id) {
      return;
    }

    try {
      await updateDish.mutateAsync({
        id: editingDish.id,
        payload: normalizeDishPayload(formData),
      });
      setShowModal(false);
      setEditingDish(null);
    } catch (error) {
      showDishError(error, 'The dish could not be updated.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDish.mutateAsync(id);
    } catch (error) {
      toast.error('The dish could not be deleted.');
      console.error(error);
    }
  };

  const handleEdit = async (dish) => {
    try {
      const response = await adminAPI.getDish(dish.id);
      const detail = response.data;
      setEditingDish({
        ...detail,
        categories: Array.isArray(detail.categories) ? detail.categories.map(String) : [],
      });
      setShowModal(true);
    } catch (error) {
      console.error('Dish detail error:', error);
      toast.error('The dish details could not be loaded.');
    }
  };

  const dishFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    { name: 'base_price', label: 'Price (MAD)', type: 'number', required: true },
    { name: 'preparation_time', label: 'Preparation time (min)', type: 'number' },
    { name: 'calories_kcal', label: 'Calories (kcal)', type: 'number' },
    { name: 'protein_g', label: 'Protein (g)', type: 'number' },
    { name: 'carbs_g', label: 'Carbs (g)', type: 'number' },
    { name: 'fat_g', label: 'Fat (g)', type: 'number' },
    { name: 'image', label: 'Image', type: 'file', accept: 'image/*' },
    {
      name: 'categories',
      label: 'Categories',
      type: 'select',
      required: true,
      multiple: true,
      options: categories.map((category) => ({ label: category.name, value: category.id })),
    },
    { name: 'is_available', label: 'Available', type: 'checkbox' },
    { name: 'is_customizable', label: 'Customizable', type: 'checkbox' },
  ];

  return (
    <AdminLayout title="Dish Management" subtitle="Curate the catalog with richer product cards, cleaner controls, and faster edits.">
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Search dishes..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(1);
          }}
          className="ff-input flex-1"
        />
        <select
          value={filterCategory}
          onChange={(event) => {
            setFilterCategory(event.target.value);
            setPage(1);
          }}
          className="ff-select"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            setEditingDish(null);
            setShowModal(true);
          }}
          className="ff-button-primary"
        >
          Add dish
        </button>

        <span className="text-sm text-slate-500">
          {dishesQuery.isFetching ? 'Syncing catalog...' : `${total} dishes`}
        </span>
      </div>

      {dishesQuery.isError ? (
        <div className="mb-6">
          <InlineErrorState
            title="The dishes could not be loaded"
            description="The admin catalog could not be synchronized."
            onRetry={() => dishesQuery.refetch()}
          />
        </div>
      ) : null}

      <AdminTable
        columns={[
          { key: 'name', label: 'Name', width: '30%' },
          { key: 'base_price', label: 'Price', width: '16%', type: 'currency' },
          {
            key: 'categories_names',
            label: 'Categories',
            width: '24%',
            render: (value) => (Array.isArray(value) && value.length ? value.join(', ') : '-'),
          },
          { key: 'preparation_time', label: 'Prep time', width: '14%' },
          { key: 'is_available', label: 'Available', width: '16%' },
        ]}
        data={dishes}
        loading={dishesQuery.isPending && !dishes.length}
        onEdit={handleEdit}
        onDelete={handleDelete}
        page={page}
        onPageChange={(nextPage) => {
          const safePage = Math.min(Math.max(nextPage, 1), totalPages);
          setPage(safePage);
        }}
        total={total}
        pageSize={pageSize}
        previousUrl={page > 1 ? true : null}
        nextUrl={page < totalPages ? true : null}
      />

      <AdminModal
        isOpen={showModal}
        onClose={() => {
          if (saving) {
            return;
          }
          setShowModal(false);
          setEditingDish(null);
        }}
        title={editingDish ? 'Edit dish' : 'Add dish'}
        size="lg"
      >
        <AdminForm
          fields={dishFields}
          initialValues={editingDish || { categories: [], is_available: true, is_customizable: false }}
          onSubmit={(formData) => {
            if (editingDish) {
              handleUpdate(formData);
            } else {
              handleCreate(formData);
            }
          }}
          loading={saving}
          submitLabel={editingDish ? 'Update dish' : 'Create dish'}
        />
      </AdminModal>
    </AdminLayout>
  );
};

export default AdminDishes;
