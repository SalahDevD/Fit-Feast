import React, { useEffect, useState } from 'react';

import FileUploadField from '../Common/FileUploadField';

const FieldLabel = ({ children, required = false }) => (
  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
    {children}
    {required ? <span className="ml-1 text-rose-500">*</span> : null}
  </label>
);

export const AdminForm = ({
  fields = [],
  initialValues = {},
  onSubmit = () => {},
  loading = false,
  submitLabel = 'Save',
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    setValues((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'file'
            ? files?.[0]
            : type === 'select-multiple'
              ? Array.from(event.target.selectedOptions, (option) => option.value)
              : value,
    }));

    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
    validateField(name);
  };

  const buildFieldError = (field, value) => {
    if (field.required) {
      if (Array.isArray(value) && value.length === 0) {
        return `${field.label} is required`;
      }

      if (field.type === 'file' && !(value instanceof File)) {
        return `${field.label} is required`;
      }

      if (field.type === 'checkbox' && !value) {
        return `${field.label} is required`;
      }

      if (value === undefined || value === null || value === '') {
        return `${field.label} is required`;
      }
    }

    if (!field.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    if (field.type === 'file' && value instanceof File) {
      const maxSize = field.maxSize || 10 * 1024 * 1024;
      if (value.size > maxSize) {
        return `${field.label} must be smaller than ${maxSize / (1024 * 1024)}MB`;
      }
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email address';
      }
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  };

  const validateField = (fieldName) => {
    const field = fields.find((item) => item.name === fieldName);
    if (!field) {
      return;
    }

    const error = buildFieldError(field, values[fieldName]);
    setErrors((current) => ({ ...current, [fieldName]: error }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    fields.forEach((field) => {
      const error = buildFieldError(field, values[field.name]);
      if (error) {
        nextErrors[field.name] = error;
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setTouched(fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}));
      return;
    }

    const cleanedValues = {};
    fields.forEach((field) => {
      const value = values[field.name];
      if (value === undefined || value === null) {
        return;
      }

      if (typeof value === 'string' && value.trim() === '' && !field.required) {
        return;
      }

      cleanedValues[field.name] = value;
    });

    onSubmit(cleanedValues);
  };

  const renderField = (field) => {
    const hasError = touched[field.name] && errors[field.name];
    const wrapperClassName = field.fullWidth ? 'md:col-span-2' : '';
    const sharedClassName = hasError
      ? 'ff-input border-rose-300 text-rose-900 focus:border-rose-300 focus:ring-rose-100 dark:border-rose-400/30 dark:text-rose-100'
      : field.type === 'textarea'
        ? 'ff-textarea'
        : field.type === 'select'
          ? 'ff-select'
          : 'ff-input';

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className={`rounded-[22px] border border-slate-200/80 bg-slate-50/70 px-4 py-4 dark:border-white/10 dark:bg-white/5 ${wrapperClassName}`}>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name={field.name}
              checked={values[field.name] || false}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{field.label}</span>
          </label>
          {hasError ? <p className="mt-2 text-sm text-rose-500">{errors[field.name]}</p> : null}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className={wrapperClassName}>
          <FieldLabel required={field.required}>{field.label}</FieldLabel>
          <textarea
            name={field.name}
            value={values[field.name] || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            rows="4"
            disabled={loading}
            className={sharedClassName}
          />
          {hasError ? <p className="mt-2 text-sm text-rose-500">{errors[field.name]}</p> : null}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} className={wrapperClassName}>
          <FieldLabel required={field.required}>{field.label}</FieldLabel>
          <select
            name={field.name}
            value={
              field.multiple
                ? Array.isArray(values[field.name])
                  ? values[field.name].map(String)
                  : []
                : values[field.name] ?? ''
            }
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
            multiple={field.multiple}
            className={sharedClassName}
          >
            {!field.multiple ? <option value="">Select an option...</option> : null}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.multiple ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Hold Ctrl or Cmd to select multiple items.
            </p>
          ) : null}
          {hasError ? <p className="mt-2 text-sm text-rose-500">{errors[field.name]}</p> : null}
        </div>
      );
    }

    if (field.type === 'file') {
      return (
        <div key={field.name} className={wrapperClassName}>
          <FieldLabel required={field.required}>{field.label}</FieldLabel>
          <FileUploadField
            id={field.name}
            name={field.name}
            label=""
            accept={field.accept}
            value={values[field.name] ?? null}
            previewUrl={typeof values[field.name] === 'string' ? values[field.name] : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
            description={field.description}
          />
          {values[field.name] instanceof File ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{values[field.name].name}</p>
          ) : null}
          {hasError ? <p className="mt-2 text-sm text-rose-500">{errors[field.name]}</p> : null}
        </div>
      );
    }

    return (
      <div key={field.name} className={`w-full ${wrapperClassName}`}>
        <FieldLabel required={field.required}>{field.label}</FieldLabel>
        <input
          type={field.type || 'text'}
          name={field.name}
          value={values[field.name] ?? ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={loading}
          className={`w-full ${sharedClassName}`}
        />
        {hasError ? <p className="mt-2 text-sm text-rose-500">{errors[field.name]}</p> : null}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{fields.map(renderField)}</div>

      <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Required fields are marked with an asterisk.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="ff-button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};
