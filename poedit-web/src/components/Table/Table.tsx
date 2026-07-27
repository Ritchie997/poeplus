/**
 * Translation Table Component
 * Displays translations with multi-select support (Ctrl+Click and checkboxes)
 */

import React, { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { TranslationRow, TranslationStatus } from '../../types';
import { highlightFormatVariables } from '../../utils/validation';

interface TableProps {
  onRowSelect: (id: string) => void;
}

export function Table({ onRowSelect }: TableProps) {
  const {
    rows,
    selectedIds,
    selectRow,
    setActiveRow,
    filters,
    updateFilters,
    getFilteredRows,
  } = useAppStore();

  const filteredRows = getFilteredRows();

  // Keyboard handler for Ctrl+Click and arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to clear selection
      if (e.key === 'Escape') {
        // Could add clear selection here if needed
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRowClick = (row: TranslationRow, event: React.MouseEvent) => {
    const isMultiSelect = event.ctrlKey || event.metaKey;
    selectRow(row.id, isMultiSelect);
    setActiveRow(row.id);
    onRowSelect(row.id);
  };

  const handleCheckboxChange = (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    selectRow(rowId, true); // Always multi-select for checkboxes
  };

  const getStatusBadge = (status: TranslationStatus) => {
    switch (status) {
      case 'translated':
        return <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">Translated</span>;
      case 'untranslated':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium">Untranslated</span>;
      case 'fuzzy':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">Fuzzy</span>;
      case 'needs-review':
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-xs font-medium">Needs Review</span>;
    }
  };

  const getValidationIcon = (row: TranslationRow) => {
    if (!row.validationErrors || row.validationErrors.length === 0) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }

    const hasError = row.validationErrors.some(e => e.severity === 'error');
    if (hasError) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  };

  const renderHighlightedText = (text: string, isSource: boolean = false) => {
    if (!isSource) {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }

    const parts = highlightFormatVariables(text);
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, index) => (
          part.isVariable ? (
            <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded font-mono text-sm">
              {part.text}
            </span>
          ) : (
            <span key={index}>{part.text}</span>
          )
        ))}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Filter bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search translations..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full max-w-md px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value as TranslationStatus | 'all' })}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="translated">Translated</option>
          <option value="untranslated">Untranslated</option>
          <option value="fuzzy">Fuzzy</option>
          <option value="needs-review">Needs Review</option>
        </select>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredRows.length} of {rows.length} shown
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Select all filtered rows
                    } else {
                      // Clear selection
                    }
                  }}
                  checked={filteredRows.length > 0 && filteredRows.every(r => selectedIds.has(r.id))}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="w-8 px-2 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Context</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">Original (msgid)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">Translation (msgstr)</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRows.map((row) => (
              <tr
                key={row.id}
                onClick={(e) => handleRowClick(row, e)}
                className={`
                  cursor-pointer transition-colors
                  ${selectedIds.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                `}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={(e) => handleCheckboxChange(row.id, e)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-2 py-3">
                  {getValidationIcon(row)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(row.status)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
                  {row.msgctxt || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <div className="max-h-20 overflow-y-auto">
                    {renderHighlightedText(row.msgid, true)}
                    {row.msgid_plural && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Plural: {row.msgid_plural}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="max-h-20 overflow-y-auto">
                    {row.msgstr.map((str, idx) => (
                      <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
                        {row.msgstr.length > 1 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                            [{idx}]:
                          </span>
                        )}
                        {str || <span className="text-gray-400 italic">Empty</span>}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRows.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            No translations found
          </div>
        )}
      </div>
    </div>
  );
}
