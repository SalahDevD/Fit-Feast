import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaBell,
  FaBox,
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaSpinner,
  FaTruck,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import { employeeAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_META = {
  all: {
    label: 'Toutes',
    icon: FaBox,
    pillClass: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
    cardClass: 'border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/5',
  },
  PENDING: {
    label: 'En attente',
    icon: FaClock,
    pillClass: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
    cardClass: 'border-amber-200 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-400/10',
  },
  PAID: {
    label: 'Payees',
    icon: FaCheckCircle,
    pillClass: 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
    cardClass: 'border-sky-200 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-400/10',
  },
  PREPARING: {
    label: 'En preparation',
    icon: FaSpinner,
    pillClass: 'bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
    cardClass: 'border-orange-200 bg-orange-50/80 dark:border-orange-400/20 dark:bg-orange-400/10',
  },
  READY: {
    label: 'Pretes',
    icon: FaCheckCircle,
    pillClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    cardClass: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10',
  },
  DELIVERED: {
    label: 'Livrees',
    icon: FaTruck,
    pillClass: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
    cardClass: 'border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5',
  },
};

const formatMoney = (value, currency = 'MAD') => `${Number(value || 0).toFixed(2)} ${currency}`;

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState({
    PENDING: 0,
    PAID: 0,
    PREPARING: 0,
    READY: 0,
    DELIVERED: 0,
  });

  const hasAccess =
    user &&
    (user.role === 'employee' ||
      user.role === 'EMPLOYEE' ||
      user.role === 'admin' ||
      user.role === 'ADMIN');

  const calculateStats = useCallback((ordersList) => {
    setStats({
      PENDING: ordersList.filter((order) => order.status === 'PENDING').length,
      PAID: ordersList.filter((order) => order.status === 'PAID').length,
      PREPARING: ordersList.filter((order) => order.status === 'PREPARING').length,
      READY: ordersList.filter((order) => order.status === 'READY').length,
      DELIVERED: ordersList.filter((order) => order.status === 'DELIVERED').length,
    });
  }, []);

  const filterOrders = useCallback((ordersList, status, query) => {
    let nextOrders = [...ordersList];

    if (status !== 'all') {
      nextOrders = nextOrders.filter((order) => order.status === status);
    }

    if (query) {
      const normalizedQuery = query.toLowerCase();
      nextOrders = nextOrders.filter(
        (order) =>
          order.order_number?.toLowerCase().includes(normalizedQuery) ||
          order.customer_name?.toLowerCase().includes(normalizedQuery) ||
          order.user_details?.username?.toLowerCase().includes(normalizedQuery)
      );
    }

    setFilteredOrders(nextOrders);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await employeeAPI.getOrders();
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];

      setOrders(data);
      calculateStats(data);
      filterOrders(data, selectedStatus, searchQuery);
    } catch (error) {
      console.error('Erreur chargement commandes', error);
      toast.error('Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  }, [calculateStats, filterOrders, searchQuery, selectedStatus]);

  useEffect(() => {
    if (!hasAccess) {
      return;
    }

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, hasAccess]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    filterOrders(orders, status, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterOrders(orders, selectedStatus, query);
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      PENDING: 'PREPARING',
      PAID: 'PREPARING',
      PREPARING: 'READY',
      READY: 'DELIVERED',
      DELIVERED: null,
    };

    return flow[currentStatus];
  };

  const getNextStatusText = (currentStatus) => {
    const labels = {
      PENDING: 'Commencer la preparation',
      PAID: 'Commencer la preparation',
      PREPARING: 'Marquer comme prete',
      READY: 'Marquer comme livree',
      DELIVERED: null,
    };

    return labels[currentStatus];
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await employeeAPI.updateOrderStatus(orderId, newStatus);
      toast.success(`Commande #${orderId} mise a jour`);
      await fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const statusCards = useMemo(
    () => [
      { key: 'all', value: orders.length, description: 'Toutes les commandes du flux' },
      { key: 'PENDING', value: stats.PENDING, description: 'Paiement ou validation en attente' },
      { key: 'PAID', value: stats.PAID, description: 'Pretes a partir en cuisine' },
      { key: 'PREPARING', value: stats.PREPARING, description: 'Actuellement en production' },
      { key: 'READY', value: stats.READY, description: 'A expedier ou a remettre' },
      { key: 'DELIVERED', value: stats.DELIVERED, description: 'Terminees avec succes' },
    ],
    [orders.length, stats]
  );

  if (!hasAccess) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="ff-panel ff-panel--strong flex items-center gap-3 px-6 py-5">
          <FaSpinner className="animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Preparation de l&apos;espace employe...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="ff-panel--dark overflow-hidden rounded-[36px] px-6 py-8 sm:px-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
                Employee operations
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Une vue plus nette sur la preparation, la remise, et les priorites du jour.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Suivez les commandes actives, filtrez les charges de travail, puis faites avancer
                chaque commande dans le bon etat sans perdre le rythme en cuisine.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Commandes actives</p>
                <p className="mt-3 text-3xl font-semibold text-white">{stats.PREPARING + stats.READY}</p>
                <p className="mt-2 text-sm text-slate-300">En cours de preparation ou deja pretes.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">En attente</p>
                <p className="mt-3 text-3xl font-semibold text-white">{stats.PENDING + stats.PAID}</p>
                <p className="mt-2 text-sm text-slate-300">Commandes a lancer ou a confirmer.</p>
              </div>
              <div className="rounded-[28px] border border-emerald-400/30 bg-emerald-400/10 px-5 py-5 sm:col-span-2">
                <div className="flex items-center gap-3 text-emerald-200">
                  <FaBell />
                  <span className="text-sm font-semibold uppercase tracking-[0.22em]">Signal live</span>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {filteredOrders.length} commande(s) visibles avec les filtres actuels.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statusCards.map((card) => {
            const meta = STATUS_META[card.key];
            const Icon = meta.icon;
            const isSelected = selectedStatus === card.key;

            return (
              <button
                key={card.key}
                type="button"
                onClick={() => handleStatusChange(card.key)}
                className={`rounded-[28px] border p-5 text-left transition ${
                  isSelected
                    ? 'border-emerald-300 bg-emerald-50/90 shadow-[0_24px_60px_-42px_rgba(22,163,74,0.55)] dark:border-emerald-400/30 dark:bg-emerald-400/10'
                    : `shadow-[0_18px_48px_-42px_rgba(15,23,42,0.28)] ${meta.cardClass}`
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      {meta.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{card.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {card.description}
                    </p>
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-xl ${meta.pillClass}`}>
                    <Icon className={card.key === 'PREPARING' ? 'animate-spin' : ''} />
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        <section className="ff-panel ff-panel--strong rounded-[32px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="ff-eyebrow">Command center</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                Filtrer les commandes visibles
              </h2>
            </div>

            <div className="relative w-full lg:max-w-lg">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par numero de commande ou client..."
                value={searchQuery}
                onChange={(event) => handleSearch(event.target.value)}
                className="ff-input pl-11"
              />
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
                {selectedStatus === 'all'
                  ? 'Toutes les commandes'
                  : `Commandes ${STATUS_META[selectedStatus]?.label?.toLowerCase()}`}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Cliquez sur une commande pour afficher les details et avancer son statut.
              </p>
            </div>
            <button type="button" onClick={fetchOrders} className="ff-button-secondary">
              <FaSpinner className="text-emerald-500" />
              Actualiser
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="ff-panel ff-panel--strong rounded-[32px] px-6 py-14 text-center">
              <FaBox className="mx-auto text-5xl text-emerald-500" />
              <h3 className="mt-5 text-2xl font-semibold text-slate-950 dark:text-white">
                Aucune commande ne correspond aux filtres
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Essayez un autre statut ou une autre recherche pour voir davantage de commandes.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredOrders.map((order, index) => {
                const meta = STATUS_META[order.status] || STATUS_META.all;
                const Icon = meta.icon;
                const isExpanded = selectedOrder === order.id;
                const nextStatus = getNextStatus(order.status);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ delay: index * 0.03 }}
                    className="ff-panel ff-panel--strong rounded-[32px] p-6"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(isExpanded ? null : order.id)}
                      className="w-full text-left"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-2xl px-4 py-4 text-xl ${meta.pillClass}`}>
                            <Icon className={order.status === 'PREPARING' ? 'animate-spin' : ''} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                              Commande
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                              #{order.order_number}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                              {order.user_details?.username || order.customer_name || 'Client'} •{' '}
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="text-right">
                            <p className="text-sm text-slate-400">Montant</p>
                            <p className="text-2xl font-semibold text-slate-950 dark:text-white">
                              {formatMoney(order.total_amount, order.currency || 'MAD')}
                            </p>
                          </div>
                          <span className={`ff-status-badge justify-center ${meta.pillClass}`}>
                            <Icon className={order.status === 'PREPARING' ? 'animate-spin' : ''} />
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 grid gap-5 border-t border-slate-200/70 pt-6 dark:border-white/10 lg:grid-cols-[1.08fr,0.92fr]">
                            <div className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Articles commandes
                              </p>
                              <div className="mt-4 space-y-3">
                                {order.items?.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm dark:bg-white/5"
                                  >
                                    <span className="text-slate-700 dark:text-slate-200">
                                      {item.quantity}x {item.item_name}
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                      {formatMoney(item.unit_price, order.currency || 'MAD')}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-4 text-sm font-semibold text-slate-900 dark:border-white/10 dark:text-white">
                                <span>Total commande</span>
                                <span>{formatMoney(order.total_amount, order.currency || 'MAD')}</span>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="rounded-[26px] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                  Livraison
                                </p>
                                <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                                  {order.delivery_address || 'Adresse non communiquee'}
                                </p>
                                {order.delivery_instructions ? (
                                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Instructions: {order.delivery_instructions}
                                  </p>
                                ) : null}
                                {order.scheduled_time ? (
                                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Livraison programmee: {new Date(order.scheduled_time).toLocaleString()}
                                  </p>
                                ) : null}
                              </div>

                              {nextStatus ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateOrderStatus(order.id, nextStatus);
                                  }}
                                  className="ff-button-primary w-full justify-center"
                                >
                                  {getNextStatusText(order.status)}
                                </button>
                              ) : (
                                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                                  Cette commande est deja terminee.
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </section>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
