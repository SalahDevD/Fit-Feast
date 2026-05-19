import React from 'react';
import { FaChevronLeft, FaChevronRight, FaEdit, FaEye, FaTrash } from 'react-icons/fa';

const formatCellValue = (column, row) => {
  const rawValue = row[column.key];

  if (typeof column.render === 'function') {
    return column.render(rawValue, row);
  }

  if (typeof rawValue === 'boolean') {
    return rawValue ? (
      <span className="ff-status-badge bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
        Yes
      </span>
    ) : (
      <span className="ff-status-badge bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
        No
      </span>
    );
  }

  if (column.type === 'date' && typeof rawValue === 'string') {
    return new Date(rawValue).toLocaleDateString('en-GB');
  }

  if (column.type === 'currency' && rawValue !== undefined && rawValue !== null && rawValue !== '') {
    return `${Number(rawValue).toFixed(2)} MAD`;
  }

  return rawValue || '-';
};

const ActionButton = ({ children, className, title, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${className}`}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

export const AdminTable = ({
  columns = [],
  data = [],
  loading = false,
  onEdit = null,
  onDelete = null,
  onView = null,
  page = 1,
  onPageChange = null,
  total = 0,
  pageSize = 20,
  showActions = true,
  selectedRows = [],
  onRowSelect = null,
  nextUrl = null,
  previousUrl = null,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoNext = nextUrl !== null && nextUrl !== undefined;
  const canGoPrevious = previousUrl !== null && previousUrl !== undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No data to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="ff-table-shell">
        <div className="overflow-x-auto">
          <table className="ff-table min-w-full">
            <thead>
              <tr>
                {onRowSelect ? (
                  <th className="w-14">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={data.length > 0 && selectedRows.length === data.length}
                      onChange={(event) => {
                        if (event.target.checked) {
                          onRowSelect(data.map((row) => row.id));
                        } else {
                          onRowSelect([]);
                        }
                      }}
                    />
                  </th>
                ) : null}

                {columns.map((col) => (
                  <th key={col.key} style={{ width: col.width }}>
                    {col.label}
                  </th>
                ))}

                {showActions ? <th className="w-40">Actions</th> : null}
              </tr>
            </thead>

            <tbody>
              {data.map((row, idx) => (
                <tr key={row.id || idx}>
                  {onRowSelect ? (
                    <td>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={selectedRows.includes(row.id)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            onRowSelect([...selectedRows, row.id]);
                          } else {
                            onRowSelect(selectedRows.filter((id) => id !== row.id));
                          }
                        }}
                      />
                    </td>
                  ) : null}

                  {columns.map((col) => (
                    <td key={`${row.id || idx}-${col.key}`}>{formatCellValue(col, row)}</td>
                  ))}

                  {showActions ? (
                    <td>
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        {onView ? (
                          <ActionButton
                            title="View"
                            onClick={() => onView(row.id)}
                            className="border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300"
                          >
                            <FaEye size={14} />
                          </ActionButton>
                        ) : null}

                        {onEdit ? (
                          <ActionButton
                            title="Edit"
                            onClick={() => onEdit(row)}
                            className="border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
                          >
                            <FaEdit size={14} />
                          </ActionButton>
                        ) : null}

                        {onDelete ? (
                          <ActionButton
                            title="Delete"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this item?')) {
                                onDelete(row.id);
                              }
                            }}
                            className="border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
                          >
                            <FaTrash size={14} />
                          </ActionButton>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange?.(page - 1)}
              disabled={!canGoPrevious || page === 1}
              className="ff-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <FaChevronLeft size={12} />
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((currentPage) => Math.abs(currentPage - page) <= 2 || currentPage === 1 || currentPage === totalPages)
              .map((currentPage, index, visiblePages) => (
                <React.Fragment key={currentPage}>
                  {index > 0 && visiblePages[index - 1] !== currentPage - 1 ? (
                    <span className="px-1 text-sm text-slate-400">...</span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onPageChange?.(currentPage)}
                    className={
                      page === currentPage
                        ? 'ff-button-primary min-w-[3rem] px-4 py-2'
                        : 'ff-button-secondary min-w-[3rem] px-4 py-2'
                    }
                  >
                    {currentPage}
                  </button>
                </React.Fragment>
              ))}

            <button
              type="button"
              onClick={() => onPageChange?.(page + 1)}
              disabled={!canGoNext || page === totalPages}
              className="ff-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
