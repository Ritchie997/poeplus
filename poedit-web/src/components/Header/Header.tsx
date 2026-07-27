/**
 * Header Component
 * Contains file import/export, statistics, and auto-translate controls
 */

import React, { useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { batchTranslate } from '../../utils/googleTranslate';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    fileName,
    loadPoFile,
    savePoFile,
    selectedIds,
    rows,
    translateRow,
    settings,
    getStatistics,
  } = useAppStore();

  const stats = getStatistics();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      loadPoFile(new Uint8Array(buffer), file.name);
    };
    reader.readAsArrayBuffer(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith('.po') && !file.name.endsWith('.pot')) {
      alert('Please drop a .po or .pot file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      loadPoFile(new Uint8Array(buffer), file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSave = () => {
    const buffer = savePoFile();
    if (!buffer) return;

    // Convert Buffer to Blob - use type assertion to handle TypeScript strictness
    const blob = new Blob([buffer as unknown as ArrayBuffer], { 
      type: 'text/plain;charset=utf-8' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'translations.po';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAutoTranslate = async () => {
    const selectedRows = rows.filter(r => selectedIds.has(r.id));
    const rowsToTranslate = selectedRows.length > 0 ? selectedRows : rows.filter(r => r.status === 'untranslated');

    if (rowsToTranslate.length === 0) {
      alert('No rows to translate');
      return;
    }

    try {
      const results = await batchTranslate(
        rowsToTranslate,
        {
          apiKey: settings.googleTranslate.apiKey,
          sourceLanguage: settings.googleTranslate.sourceLanguage,
          targetLanguage: settings.googleTranslate.targetLanguage,
        }
      );

      // Apply translations
      for (const [id, translations] of results.entries()) {
        const row = rows.find(r => r.id === id);
        if (row) {
          // Handle plurals
          const nplurals = row.msgid_plural ? 2 : 1;
          const translatedTexts = translations.length > 0 
            ? translations[0]
            : '';
          
          if (row.msgid_plural) {
            // For plural forms, repeat translation for all forms
            const pluralTranslations = Array(nplurals).fill(translatedTexts);
            translateRow(id, pluralTranslations);
          } else {
            translateRow(id, translatedTexts);
          }
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
      alert(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left section - File operations */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Poedit Web</h1>
          
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".po,.pot"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Open File
            </button>
            
            <button
              onClick={handleSave}
              disabled={!fileName}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
          
          {!fileName && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2"
            >
              Drag & drop .po file here
            </div>
          )}
        </div>

        {/* Center section - Statistics */}
        {fileName && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Total:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Translated:</span>
              <span className="font-semibold text-green-600">{stats.translated}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Untranslated:</span>
              <span className="font-semibold text-red-600">{stats.untranslated}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Fuzzy:</span>
              <span className="font-semibold text-yellow-600">{stats.fuzzy}</span>
            </div>
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.progress}%
            </span>
          </div>
        )}

        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          {fileName && (
            <>
              <button
                onClick={handleAutoTranslate}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Auto Translate
                {selectedIds.size > 0 && ` (${selectedIds.size})`}
              </button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            </>
          )}
          
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
