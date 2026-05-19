import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { AdminModal } from '../../components/Admin/AdminModal';
import { AdminForm } from '../../components/Admin/AdminForm';
import { adminAPI } from '../../api/axios';
import toast from 'react-hot-toast';

const GOAL_TYPE_OPTIONS = [
  { label: 'Nombre de commandes', value: 'ORDERS_COUNT' },
  { label: 'Repas planifies', value: 'MEALS_PLANNED' },
  { label: 'Objectif proteines (g)', value: 'PROTEIN_TARGET' },
];

const GOAL_TYPE_LABELS = GOAL_TYPE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

/**
 * Admin Challenges Management - CRUD challenges
 */
export const AdminChallenges = () => {
  const [challenges, setChallenge] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, search: searchQuery };
      const res = await adminAPI.listChallenges(params);
      setChallenge(res.data.results || res.data);
      setTotal(res.data.count || res.data.length);
    } catch (error) {
      toast.error('Erreur lors du chargement des defis');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const normalizeChallengePayload = (formData) => ({
    ...formData,
    target_value:
      formData.target_value === undefined || formData.target_value === null || formData.target_value === ''
        ? formData.target_value
        : Number(formData.target_value),
    is_active: formData.is_active ?? true,
  });

  const showChallengeError = (error, fallbackMessage) => {
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

      toast.error(`Erreur:\n${errorMessages}`);
      return;
    }

    toast.error(errors?.detail || errors?.error || fallbackMessage);
  };

  const handleCreate = async (formData) => {
    try {
      const normalizedFormData = normalizeChallengePayload(formData);
      await adminAPI.createChallenge(normalizedFormData);
      toast.success('Defi cree');
      setShowModal(false);
      fetchChallenges();
    } catch (error) {
      showChallengeError(error, 'Erreur lors de la creation');
      console.error(error);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      const normalizedFormData = normalizeChallengePayload(formData);
      await adminAPI.updateChallenge(editingChallenge.id, normalizedFormData);
      toast.success('Defi mis a jour');
      setShowModal(false);
      setEditingChallenge(null);
      fetchChallenges();
    } catch (error) {
      showChallengeError(error, 'Erreur lors de la mise a jour');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer?')) {
      try {
        await adminAPI.deleteChallenge(id);
        toast.success('Defi supprime');
        fetchChallenges();
      } catch (error) {
        showChallengeError(error, 'Erreur lors de la suppression');
        console.error(error);
      }
    }
  };

  const challengeFields = [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'start_date', label: 'Date debut', type: 'date', required: true },
    { name: 'end_date', label: 'Date fin', type: 'date', required: true },
    {
      name: 'goal_type',
      label: "Type d'objectif",
      type: 'select',
      required: true,
      options: GOAL_TYPE_OPTIONS,
    },
    {
      name: 'target_value',
      label: 'Valeur cible',
      type: 'number',
      required: true,
      validation: (value) => {
        if (value === undefined || value === null || value === '') {
          return 'La valeur cible est requise';
        }
        const numericValue = Number(value);
        if (Number.isNaN(numericValue) || !Number.isInteger(numericValue)) {
          return 'La valeur cible doit etre un nombre entier';
        }
        if (numericValue <= 0) {
          return 'La valeur cible doit etre superieure a 0';
        }
        return null;
      },
    },
    { name: 'is_active', label: 'Actif', type: 'checkbox' },
  ];

  return (
    <AdminLayout title="Gestion des Defis" subtitle="Launch challenge campaigns with stronger structure and a more polished control flow.">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un defi..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="ff-input"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={() => {
            setEditingChallenge(null);
            setShowModal(true);
          }}
          className="ff-button-primary"
        >
          Ajouter Defi
        </button>
      </div>

      <AdminTable
        columns={[
          { key: 'title', label: 'Titre', width: '30%' },
          {
            key: 'goal_type',
            label: 'Type',
            width: '20%',
            render: (value) => GOAL_TYPE_LABELS[value] || value,
          },
          { key: 'target_value', label: 'Cible', width: '15%' },
          { key: 'start_date', label: 'Debut', width: '15%', type: 'date' },
          { key: 'end_date', label: 'Fin', width: '15%', type: 'date' },
        ]}
        data={challenges}
        loading={loading}
        onEdit={(challenge) => {
          setEditingChallenge(challenge);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        page={page}
        onPageChange={setPage}
        total={total}
        pageSize={pageSize}
      />

      <AdminModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingChallenge(null);
        }}
        title={editingChallenge ? 'Modifier Defi' : 'Ajouter Defi'}
      >
        <AdminForm
          fields={challengeFields}
          initialValues={editingChallenge || { is_active: true }}
          onSubmit={(formData) => {
            if (editingChallenge) {
              handleUpdate(formData);
            } else {
              handleCreate(formData);
            }
          }}
          submitLabel={editingChallenge ? 'Mettre a jour' : 'Creer'}
        />
      </AdminModal>
    </AdminLayout>
  );
};
