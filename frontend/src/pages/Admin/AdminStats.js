import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { adminAPI } from '../../api/axios';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { StatCard } from '../../components/Admin/StatCard';


export const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await adminAPI.getStats();
        setStats({
          users: { total: 0, customers: 0, employees: 0, admins: 0, active: 0, ...response.data?.users },
          orders: { total: 0, pending: 0, paid: 0, preparing: 0, delivered: 0, ...response.data?.orders },
          payments: { total: 0, successful: 0, failed: 0, pending: 0, ...response.data?.payments },
          revenue: response.data?.revenue || 0,
          dishes: { total: 0, available: 0, ...response.data?.dishes },
          posts: response.data?.posts || 0,
          challenges: { total: 0, active: 0, ...response.data?.challenges },
        });
      } catch (error) {
        console.error('Admin stats error:', error);
        toast.error('Unable to load admin overview.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Overview" subtitle="Platform-wide health at a glance.">
        <div className="flex items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title="Overview" subtitle="Platform-wide health at a glance.">
        <p className="text-sm text-slate-500">No data available right now.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Overview" subtitle="Platform-wide health at a glance.">
      <div className="space-y-10">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Users</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Total" value={stats.users.total} icon="👥" color="blue" />
            <StatCard title="Customers" value={stats.users.customers} icon="🛍️" color="green" />
            <StatCard title="Employees" value={stats.users.employees} icon="👩‍🍳" color="yellow" />
            <StatCard title="Admins" value={stats.users.admins} icon="🛡️" color="purple" />
            <StatCard title="Active" value={stats.users.active} icon="✅" color="blue" />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Commerce</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Orders" value={stats.orders.total} icon="📦" color="blue" />
            <StatCard title="Revenue" value={`${Number(stats.revenue).toFixed(2)} MAD`} icon="💰" color="green" />
            <StatCard title="Paid orders" value={stats.orders.paid} icon="💳" color="green" />
            <StatCard title="Preparing" value={stats.orders.preparing} icon="🍽️" color="yellow" />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Payments</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Transactions" value={stats.payments.total} icon="💳" color="blue" />
            <StatCard title="Succeeded" value={stats.payments.successful} icon="✅" color="green" />
            <StatCard title="Pending" value={stats.payments.pending} icon="⏳" color="yellow" />
            <StatCard title="Failed" value={stats.payments.failed} icon="⚠️" color="red" />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Catalog and community</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Dishes" value={stats.dishes.total} icon="🥗" color="blue" />
            <StatCard title="Available" value={stats.dishes.available} icon="🌿" color="green" />
            <StatCard title="Posts" value={stats.posts} icon="💬" color="purple" />
            <StatCard title="Active challenges" value={stats.challenges.active} icon="🎯" color="yellow" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};


export default AdminStats;
