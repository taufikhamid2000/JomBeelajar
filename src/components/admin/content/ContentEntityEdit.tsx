'use client';

import { useState, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/AdminNavigation';

// Core entity interface that all entities must implement
export interface ContentEntity {
  id: string;
  [key: string]: unknown;
}

// Form field definition for rendering dynamic form fields
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'custom';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[]; // For select fields
  renderCustom?: (
    value: unknown,
    onChange: (value: unknown) => void,
    disabled: boolean
  ) => ReactNode; // For custom field types
}

// Tab definition for entity-specific tabs
export interface EntityTab {
  id: string;
  label: string;
  count?: number; // Optional count to display (e.g., "Chapters (5)")
  render: () => ReactNode;
}

// Props for the ContentEntityEdit component
export interface ContentEntityEditProps<T extends ContentEntity> {
  // Core data
  entityId: string;
  entityName: string;
  backLink: string;
  backLinkText?: string;

  // Data fetching and saving
  fetchEntity: (id: string) => Promise<T | null>;
  saveEntity: (entity: T) => Promise<{ success: boolean; error: Error | null }>;

  // Form configuration
  formFields: FormField[];
  formState: Record<string, unknown>;
  setFormState: (state: Record<string, unknown>) => void;

  // Additional tabs beside the details tab
  additionalTabs?: EntityTab[];

  // Entity state
  entity: T | null;
  setEntity: (entity: T | null) => void;

  // UI state
  loading: boolean;
  setLoading: (loading: boolean) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  // Optional metadata fields to display
  metadataFields?: {
    key: string;
    label: string;
    format?: (value: unknown) => string;
  }[];
}

export default function ContentEntityEdit<T extends ContentEntity>({
  // Core data
  entityId, // Used by parent components but not in this component
  entityName,
  backLink,
  backLinkText = 'Back to Content',
  // Data fetching and saving
  fetchEntity, // Used by parent components but not in this component
  saveEntity,

  // Form configuration
  formFields,
  formState,
  setFormState,

  // Additional tabs
  additionalTabs = [],

  // Entity state
  entity,
  setEntity,
  // UI state
  loading,
  setLoading, // Used by parent components but not in this component
  saving,
  setSaving,

  // Optional metadata
  metadataFields = [],
}: ContentEntityEditProps<T>) {
  const [activeTab, setActiveTab] = useState<string>('details');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  // Handle form field change
  const handleFieldChange = (key: string, value: unknown) => {
    setFormState({
      ...formState,
      [key]: value,
    });
  };

  // Handle saving the entity
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (!entity) {
        setError(`No ${entityName.toLowerCase()} found to update`);
        return;
      }

      // Create updated entity by merging current entity with form state
      const updatedEntity = {
        ...entity,
        ...formState,
      } as T;

      const { success, error } = await saveEntity(updatedEntity);

      if (error) {
        throw error;
      }

      if (!success) {
        throw new Error(`Failed to update ${entityName.toLowerCase()}`);
      }

      // Update local entity state with the new values
      setEntity(updatedEntity);
      setSuccess(true);

      // Hide success message after a delay
      setTimeout(() => setSuccess(false), 3000);

      logger.log(`${entityName} updated successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Failed to update ${entityName.toLowerCase()}: ${errorMessage}`);
      logger.error(`Error updating ${entityName.toLowerCase()}:`, error);
    } finally {
      setSaving(false);
    }
  };

  // Render form fields based on their type
  const renderFormField = (field: FormField) => {
    const value = formState[field.key] ?? '';
    const disabled = saving || loading;

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.key} className="space-y-1">
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-gray-300 dark:text-gray-700"
            >
              {field.label}{' '}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={field.key}
              rows={4}
              className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              placeholder={field.placeholder}
              value={String(value)}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              disabled={disabled}
              required={field.required}
            />
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {field.helpText}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-1">
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-gray-300 dark:text-gray-700"
            >
              {field.label}{' '}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={field.key}
              className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              value={String(value)}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              disabled={disabled}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {field.helpText}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-1">
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-gray-300 dark:text-gray-700"
            >
              {field.label}{' '}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              id={field.key}
              className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              placeholder={field.placeholder}
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) =>
                handleFieldChange(field.key, Number(e.target.value))
              }
              disabled={disabled}
              required={field.required}
            />
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {field.helpText}
              </p>
            )}
          </div>
        );

      case 'custom':
        return field.renderCustom ? (
          <div key={field.key} className="space-y-1">
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-gray-300 dark:text-gray-700"
            >
              {field.label}{' '}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.renderCustom(
              value,
              (newValue) => handleFieldChange(field.key, newValue),
              disabled
            )}
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {field.helpText}
              </p>
            )}
          </div>
        ) : null;

      case 'text':
      default:
        return (
          <div key={field.key} className="space-y-1">
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-gray-300 dark:text-gray-700"
            >
              {field.label}{' '}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              id={field.key}
              className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              placeholder={field.placeholder}
              value={String(value || '')}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              disabled={disabled}
              required={field.required}
            />
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {field.helpText}
              </p>
            )}
          </div>
        );
    }
  };

  // Render metadata fields
  const renderMetadata = () => {
    if (!entity || metadataFields.length === 0) return null;

    return (
      <div className="pt-4">
        <h3 className="text-sm font-medium text-gray-300 dark:text-gray-700">
          Additional Information
        </h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400 dark:text-gray-500">
          {metadataFields.map((field) => {
            const value = entity[field.key];
            const formattedValue = field.format
              ? field.format(value)
              : typeof value === 'string' &&
                  (value.includes('T') || value.includes('Z'))
                ? new Date(value).toLocaleString()
                : String(value || '');

            return (
              <div key={field.key}>
                <span className="font-medium">{field.label}:</span>{' '}
                {formattedValue}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Loading state render
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
        <div className="flex">
          <AdminNavigation />
          <div className="flex-1 p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Entity not found state
  if (!entity) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
        <div className="flex">
          <AdminNavigation />
          <div className="flex-1 p-8">
            <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 p-4 rounded-lg mb-4">
              <h2 className="text-xl font-bold mb-2">{entityName} Not Found</h2>
              <p className="mb-4">
                The {entityName.toLowerCase()} you are looking for does not
                exist or has been deleted.
              </p>
              <Link
                href={backLink}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {backLinkText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render with tabs
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Link
                href={backLink}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center"
              >
                ← {backLinkText}
              </Link>{' '}
              <h1 className="text-3xl font-bold dark:text-white">
                Edit {entityName}:{' '}
                {String(entity.name || entity.title || entity.id)}
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-blue-900"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 p-4 rounded-lg">
              {entityName} updated successfully!
            </div>
          )}

          <div className="bg-gray-800 dark:bg-white shadow rounded-lg">
            {/* Tabs */}
            <div className="border-b border-gray-700 dark:border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Details
                </button>

                {additionalTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {tab.label}{' '}
                    {tab.count !== undefined ? `(${tab.count})` : ''}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {/* Details tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  {formFields.map(renderFormField)}
                  {renderMetadata()}
                </div>
              )}

              {/* Additional tabs */}
              {additionalTabs.map(
                (tab) =>
                  activeTab === tab.id && <div key={tab.id}>{tab.render()}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
