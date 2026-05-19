import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { adminAPI } from '../../api/axios';
import { AdminForm } from '../../components/Admin/AdminForm';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminModal } from '../../components/Admin/AdminModal';
import { AdminTable } from '../../components/Admin/AdminTable';

const normalizeUsersResponse = (payload) => {
  if (Array.isArray(payload)) {
    return {
      results: payload,
      count: payload.length,
      next: null,
      previous: null,
    };
  }

  return {
    results: Array.isArray(payload?.results) ? payload.results : [],
    count: typeof payload?.count === 'number' ? payload.count : 0,
    next: payload?.next || null,
    previous: payload?.previous || null,
  };
};

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [previousUrl, setPreviousUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const latestRequestIdRef = useRef(0);
  const usersRef = useRef(users);
  const pageSize = 20;

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const fetchUsers = useCallback(async ({ pageOverride = page, preserveOnEmpty = false } = {}) => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setLoading(true);

    try {
      const params = {
        page: pageOverride,
        search: searchQuery,
        ...(filterRole ? { role: filterRole } : {}),
      };
      const res = await adminAPI.listUsers(params);
      const normalized = normalizeUsersResponse(res.data);
      const hasActiveFilters = Boolean(searchQuery.trim() || filterRole);
      const shouldPreserveCurrentList =
        preserveOnEmpty &&
        normalized.results.length === 0 &&
        !hasActiveFilters &&
        usersRef.current.length > 0;

      if (requestId !== latestRequestIdRef.current) {
        return normalized;
      }

      if (!shouldPreserveCurrentList) {
        setUsers(normalized.results);
      }
      setTotal(normalized.count);
      setNextUrl(normalized.next);
      setPreviousUrl(normalized.previous);

      return normalized;
    } catch (error) {
      if (requestId !== latestRequestIdRef.current) {
        return null;
      }

      if (error.response?.status === 404 && pageOverride > 1) {
        toast.error('That page no longer exists. Returning to the previous page.');
        setPage(pageOverride - 1);
      } else {
        toast.error('The users could not be loaded.');
        if (error.response?.status === 404) {
          setPage(1);
        }
        console.error(error);
      }

      return null;
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [filterRole, page, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (formData) => {
    try {
      const response = await adminAPI.createUser(formData);
      const createdUser = response.data;

      if (
        page === 1 &&
        !searchQuery.trim() &&
        (!filterRole || filterRole === createdUser?.role) &&
        createdUser?.id
      ) {
        setUsers((currentUsers) => {
          const withoutDuplicate = currentUsers.filter((user) => user.id !== createdUser.id);
          return [createdUser, ...withoutDuplicate].slice(0, pageSize);
        });
        setTotal((currentTotal) => currentTotal + 1);
      }

      toast.success('User created successfully.');
      setShowModal(false);
      setEditingUser(null);

      if (page !== 1) {
        setPage(1);
      }

      await fetchUsers({ pageOverride: 1, preserveOnEmpty: true });
    } catch (error) {
      const errors = error.response?.data;
      if (errors && typeof errors === 'object') {
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) =>
            Array.isArray(messages) ? `${field}: ${messages.join(', ')}` : `${field}: ${messages}`
          )
          .join('\n');
        toast.error(`Error:\n${errorMessages}`);
      } else {
        toast.error(errors?.detail || 'The user could not be created.');
      }
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await adminAPI.updateUser(editingUser.id, formData);
      toast.success('User updated.');
      setShowModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'The user could not be updated.');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted.');
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchUsers();
      }
    } catch (error) {
      toast.error('The user could not be deleted.');
      console.error(error);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Select at least one user.');
      return;
    }

    try {
      await adminAPI.activateUsers(selectedUsers);
      toast.success(`${selectedUsers.length} user(s) activated.`);
      setSelectedUsers([]);
      await fetchUsers();
    } catch (error) {
      toast.error('The bulk activation could not be completed.');
      console.error(error);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Select at least one user.');
      return;
    }

    try {
      await adminAPI.deactivateUsers(selectedUsers);
      toast.success(`${selectedUsers.length} user(s) deactivated.`);
      setSelectedUsers([]);
      await fetchUsers();
    } catch (error) {
      toast.error('The bulk deactivation could not be completed.');
      console.error(error);
    }
  };

  const userFields = [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'first_name', label: 'First name', type: 'text' },
    { name: 'last_name', label: 'Last name', type: 'text' },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { label: 'Customer', value: 'CUSTOMER' },
        { label: 'Employee', value: 'EMPLOYEE' },
        { label: 'Admin', value: 'ADMIN' },
      ],
    },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'is_active', label: 'Active account', type: 'checkbox' },
    ...(editingUser
      ? []
      : [
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            required: true,
            validation: (value) =>
              value && value.length < 4 ? 'Password must contain at least 4 characters.' : null,
          },
        ]),
  ];

  return (
    <AdminLayout title="User Management" subtitle="Control accounts, roles, and activation status with a clearer workspace.">
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(1);
          }}
          className="ff-input flex-1"
        />
        <select
          value={filterRole}
          onChange={(event) => {
            setFilterRole(event.target.value);
            setPage(1);
          }}
          className="ff-select"
        >
          <option value="">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {selectedUsers.length > 0 ? (
        <div className="mb-6 flex flex-col gap-3 rounded-[26px] border border-sky-200 bg-sky-50/90 p-4 dark:border-sky-400/20 dark:bg-sky-400/10 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-100">
            {selectedUsers.length} user(s) selected
          </span>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleBulkActivate} className="ff-button-primary px-4 py-2 text-sm">
              Activate
            </button>
            <button
              onClick={handleBulkDeactivate}
              className="ff-button-secondary border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
            >
              Deactivate
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="ff-button-primary"
        >
          Add user
        </button>
      </div>

      <AdminTable
        columns={[
          { key: 'email', label: 'Email', width: '25%' },
          { key: 'username', label: 'Username', width: '20%' },
          { key: 'first_name', label: 'First name', width: '15%' },
          { key: 'role', label: 'Role', width: '15%' },
          { key: 'is_active', label: 'Status', width: '15%' },
        ]}
        data={users}
        loading={loading}
        onEdit={(nextUser) => {
          setEditingUser(nextUser);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        page={page}
        onPageChange={setPage}
        total={total}
        pageSize={pageSize}
        selectedRows={selectedUsers}
        onRowSelect={setSelectedUsers}
        nextUrl={nextUrl}
        previousUrl={previousUrl}
      />

      <AdminModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
        }}
        title={editingUser ? 'Edit user' : 'Add user'}
        size="md"
      >
        <AdminForm
          fields={userFields}
          initialValues={editingUser || { is_active: true }}
          onSubmit={(formData) => {
            if (editingUser) {
              handleUpdate(formData);
            } else {
              handleCreate(formData);
            }
          }}
          submitLabel={editingUser ? 'Update user' : 'Create user'}
        />
      </AdminModal>
    </AdminLayout>
  );
};

export default AdminUsers;
