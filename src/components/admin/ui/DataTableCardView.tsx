'use client';

import { ReactNode } from 'react';
// import Image from 'next/image';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string;
  skipMobile?: boolean;
}

export interface CardField<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
  isHeader?: boolean;
  isFooter?: boolean;
}

interface DataTableCardViewProps<T> {
  data: T[];
  isLoading: boolean;
  columns: Column<T>[];
  cardFields: CardField<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyFilteredMessage?: string;
  isFiltered?: boolean;
  actions?: (item: T) => ReactNode;
}

export default function DataTableCardView<T>({
  data,
  isLoading,
  columns,
  cardFields,
  keyExtractor,
  emptyMessage = 'No items found.',
  emptyFilteredMessage = 'No items match your filters.',
  isFiltered = false,
  actions,
}: DataTableCardViewProps<T>) {
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand/40"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow">
      <div className="overflow-x-auto">
        {/* Desktop Table View */}
        <table className="hidden md:table min-w-full divide-y divide-border">
          <thead className="bg-surface-2">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider ${
                    column.className || ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-soft uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-4 text-center text-soft"
                >
                  {isFiltered ? emptyFilteredMessage : emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)}>
                  {columns.map((column) => (
                    <td
                      key={`${keyExtractor(item)}-${column.key}`}
                      className={`px-6 py-4 whitespace-nowrap ${
                        column.className || ''
                      }`}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden grid grid-cols-1 gap-4 p-4">
          {data.length === 0 ? (
            <div className="px-4 py-6 text-center text-soft">
              {isFiltered ? emptyFilteredMessage : emptyMessage}
            </div>
          ) : (
            data.map((item) => (
              <div
                key={keyExtractor(item)}
                className="p-4 bg-surface rounded-lg shadow-sm border border-border"
              >
                {/* Header section (if any) */}
                {cardFields
                  .filter((field) => field.isHeader)
                  .map((field) => (
                    <div
                      key={`${keyExtractor(item)}-${field.key}`}
                      className={`mb-3 ${field.className || ''}`}
                    >
                      {field.render(item)}
                    </div>
                  ))}

                {/* Body fields - rendered as a grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {cardFields
                    .filter((field) => !field.isHeader && !field.isFooter)
                    .map((field) => (
                      <div
                        key={`${keyExtractor(item)}-${field.key}`}
                        className={field.className || ''}
                      >
                        <div className="text-xs text-soft uppercase mb-1">
                          {field.label}
                        </div>
                        <div>{field.render(item)}</div>
                      </div>
                    ))}
                </div>

                {/* Footer section (if any) */}
                {cardFields
                  .filter((field) => field.isFooter)
                  .map((field) => (
                    <div
                      key={`${keyExtractor(item)}-${field.key}`}
                      className={`mb-3 ${field.className || ''}`}
                    >
                      <div className="text-xs text-soft uppercase mb-1">
                        {field.label}
                      </div>
                      <div>{field.render(item)}</div>
                    </div>
                  ))}

                {/* Actions */}
                {actions && (
                  <div className="flex justify-between text-sm font-medium">
                    {actions(item)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
