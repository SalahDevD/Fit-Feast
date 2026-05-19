import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiImage, FiTrash2, FiUploadCloud } from 'react-icons/fi';

const FileUploadField = ({
  accept = '*',
  description = '',
  disabled = false,
  id,
  label,
  name,
  onBlur,
  onChange,
  previewUrl = '',
  value = null,
}) => {
  const inputRef = useRef(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const isFileSelected = value instanceof File;

  useEffect(() => {
    if (!(value instanceof File)) {
      setLocalPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(value);
    setLocalPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  const resolvedPreviewUrl = useMemo(() => {
    if (localPreviewUrl) {
      return localPreviewUrl;
    }

    return typeof previewUrl === 'string' ? previewUrl : '';
  }, [localPreviewUrl, previewUrl]);

  const forwardFile = (file) => {
    if (disabled) {
      return;
    }

    onChange?.({
      target: {
        name,
        type: 'file',
        files: file ? [file] : [],
      },
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    forwardFile(event.dataTransfer.files?.[0]);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-3">
      {label ? (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onKeyDown={handleKeyDown}
        className={`ff-upload-zone ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          name={name}
          accept={accept}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => onChange?.(event)}
          className="sr-only"
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="ff-upload-zone__icon">
              {resolvedPreviewUrl ? <FiImage /> : <FiUploadCloud />}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {isFileSelected ? value.name : 'Drop an image here or browse your device'}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description || 'JPG, PNG, or WebP up to 10MB.'}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 self-start sm:self-center">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              Upload
            </span>

            {isFileSelected ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  forwardFile(null);
                }}
                className="ff-icon-button h-11 w-11"
                aria-label="Clear selected file"
              >
                <FiTrash2 />
              </button>
            ) : null}
          </div>
        </div>

        {resolvedPreviewUrl ? (
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5">
            <img
              src={resolvedPreviewUrl}
              alt="Upload preview"
              className="h-48 w-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FileUploadField;
