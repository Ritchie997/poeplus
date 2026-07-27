/**
 * Editor Panel Component
 * Displays and edits the selected translation with validation warnings
 */

import React, { useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { getPluralForms } from '../../utils/poParser';
import { highlightFormatVariables } from '../../utils/validation';

export function Editor() {
  const {
    poFile,
    activeRowId,
    rows,
    updateTranslation,
    setRowFuzzy,
    setActiveRow,
    settings,
  } = useAppStore();

  const activeRow = useMemo(() => 
    rows.find(r => r.id === activeRowId),
    [rows, activeRowId]
  );

  const nplurals = useMemo(() => {
    if (!poFile?.headers) return 2;
    const { nplurals: count } = getPluralForms(poFile.headers);
    return count;
  }, [poFile]);

  const [localMsgstr, setLocalMsgstr] = React.useState<string[]>([]);
  const [translatorComment, setTranslatorComment] = React.useState('');

  useEffect(() => {
    if (activeRow) {
      setLocalMsgstr([...activeRow.msgstr]);
      setTranslatorComment(activeRow.comments?.translator?.join('\n') || '');
    }
  }, [activeRow]);

  const handleMsgstrChange = (index: number, value: string) => {
    const newMsgstr = [...localMsgstr];
    newMsgstr[index] = value;
    setLocalMsgstr(newMsgstr);
    updateTranslation(activeRowId!, newMsgstr);
  };

  const handleFuzzyToggle = () => {
    if (activeRow) {
      setRowFuzzy(activeRow.id, !activeRow.fuzzy);
    }
  };

  const renderHighlightedText = (text: string) => {
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

  const getValidationColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  if (!activeRow) {
    return (
      <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Select a translation to edit</p>
      </div>
    );
  }

  return (
    <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">Editor</h2>
        <button
          onClick={() => setActiveRow(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status and Fuzzy */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            activeRow.status === 'translated' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            activeRow.status === 'fuzzy' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {activeRow.status.charAt(0).toUpperCase() + activeRow.status.slice(1)}
          </span>
          
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!activeRow.fuzzy}
              onChange={handleFuzzyToggle}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Mark as fuzzy
          </label>
        </div>

        {/* Context */}
        {activeRow.msgctxt && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Context (msgctxt)
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white">
              {activeRow.msgctxt}
            </div>
          </div>
        )}

        {/* Original Text */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Original (msgid)
          </label>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white">
            {renderHighlightedText(activeRow.msgid)}
          </div>
          
          {activeRow.msgid_plural && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Plural Form (msgid_plural)
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white">
                {activeRow.msgid_plural}
              </div>
            </div>
          )}
        </div>

        {/* Translation Fields */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Translation (msgstr)
            {activeRow.msgstr.length > 1 && ` - ${nplurals} plural form${nplurals > 1 ? 's' : ''}`}
          </label>
          
          <div className="space-y-3">
            {localMsgstr.map((str, idx) => (
              <div key={idx}>
                {activeRow.msgstr.length > 1 && (
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Form {idx}: {idx === 0 ? 'singular' : idx === 1 ? 'dual/paucal' : 'plural'}
                  </label>
                )}
                <textarea
                  value={str}
                  onChange={(e) => handleMsgstrChange(idx, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter translation..."
                />
              </div>
            ))}
          </div>
        </div>

        {/* Validation Warnings */}
        {activeRow.validationErrors && activeRow.validationErrors.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Validation Warnings
            </label>
            <div className="space-y-2">
              {activeRow.validationErrors.map((error, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-md border text-sm ${getValidationColor(error.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    {error.severity === 'error' && (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {error.severity === 'warning' && (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {error.severity === 'info' && (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span>{error.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Translator Comments */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Translator Comments (#.)
          </label>
          <textarea
            value={translatorComment}
            onChange={(e) => setTranslatorComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Add comments for other translators..."
          />
        </div>

        {/* Previous Context (if exists) */}
        {activeRow.previous && (activeRow.previous.msgid || activeRow.previous.msgctxt) && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Previous Context
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
              {activeRow.previous.msgctxt && (
                <div className="mb-1">
                  <span className="text-gray-500">Context:</span> {activeRow.previous.msgctxt}
                </div>
              )}
              {activeRow.previous.msgid && (
                <div>
                  <span className="text-gray-500">Original:</span> {activeRow.previous.msgid}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
