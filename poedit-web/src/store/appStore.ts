/**
 * Zustand Store for Poedit Web Application
 * Manages PO file state, settings, filters, and UI state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  PoFile, 
  TranslationRow, 
  TranslationStatus, 
  AppSettings, 
  FilterState
} from '../types';
import { 
  DEFAULT_SETTINGS
} from '../types';
import { 
  parsePoFile, 
  compilePoFile, 
  flattenTranslations, 
  getTranslationStatus,
  generateTranslationId,
  updateTranslation,
  getPluralForms
} from '../utils/poParser';
import { validateTranslation } from '../utils/validation';

interface AppState {
  // PO File State
  poFile: PoFile | null;
  fileName: string | null;
  rows: TranslationRow[];
  
  // Settings
  settings: AppSettings;
  
  // Filters
  filters: FilterState;
  
  // Selection
  selectedIds: Set<string>;
  activeRowId: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  isSettingsOpen: boolean;
  
  // Actions
  loadPoFile: (buffer: Uint8Array, fileName: string) => void;
  savePoFile: () => Uint8Array | null;
  updateTranslation: (id: string, msgstr: string[]) => void;
  setRowFuzzy: (id: string, fuzzy: boolean) => void;
  selectRow: (id: string, multiSelect?: boolean) => void;
  selectMultipleRows: (ids: string[]) => void;
  clearSelection: () => void;
  setActiveRow: (id: string | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  translateRow: (id: string, translatedText: string | string[]) => void;
  getFilteredRows: () => TranslationRow[];
  getStatistics: () => { total: number; translated: number; untranslated: number; fuzzy: number; progress: number };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      poFile: null,
      fileName: null,
      rows: [],
      settings: DEFAULT_SETTINGS,
      filters: { search: '', status: 'all' },
      selectedIds: new Set(),
      activeRowId: null,
      isLoading: false,
      error: null,
      isSettingsOpen: false,
      
      // Load PO file from buffer
      loadPoFile: (buffer: Uint8Array, fileName: string) => {
        try {
          const poFile = parsePoFile(Buffer.from(buffer));
          const flattened = flattenTranslations(poFile);
          
          const rows: TranslationRow[] = flattened.map(({ context, msgid, translation }) => {
            const id = generateTranslationId(context, msgid);
            const status = getTranslationStatus(translation);
            const validationErrors = validateTranslation(
              msgid,
              translation.msgstr,
              get().settings.validation
            );
            
            return {
              ...translation,
              id,
              context,
              status,
              validationErrors,
            };
          });
          
          set({ 
            poFile, 
            fileName,
            rows,
            error: null,
          });
        } catch (err) {
          set({ error: `Failed to parse PO file: ${err instanceof Error ? err.message : String(err)}` });
        }
      },
      
      // Compile and return PO file buffer
      savePoFile: () => {
        const { poFile } = get();
        if (!poFile) return null;
        
        // Update translations in poFile from current rows
        const updatedTranslations: { [context: string]: { [msgid: string]: any } } = {};
        
        for (const row of get().rows) {
          if (!updatedTranslations[row.context]) {
            updatedTranslations[row.context] = {};
          }
          updatedTranslations[row.context][row.msgid] = {
            msgctxt: row.msgctxt,
            msgid: row.msgid,
            msgid_plural: row.msgid_plural,
            msgstr: row.msgstr,
            comments: row.comments,
            flags: row.flags,
            previous: row.previous,
            fuzzy: row.fuzzy,
          };
        }
        
        const updatedPoFile: PoFile = {
          ...poFile,
          translations: updatedTranslations,
        };
        
        return compilePoFile(updatedPoFile);
      },
      
      // Update a single translation
      updateTranslation: (id: string, msgstr: string[]) => {
        set((state) => {
          const updatedRows = state.rows.map((row) => {
            if (row.id !== id) return row;
            
            const updated = updateTranslation(row, msgstr, { removeFuzzy: true });
            const status = getTranslationStatus(updated);
            const validationErrors = validateTranslation(
              row.msgid,
              msgstr,
              state.settings.validation
            );
            
            return {
              ...updated,
              id: row.id,
              context: row.context,
              status,
              validationErrors,
            };
          });
          
          return { rows: updatedRows };
        });
      },
      
      // Set fuzzy flag on a row
      setRowFuzzy: (id: string, fuzzy: boolean) => {
        set((state) => {
          const updatedRows = state.rows.map((row) => {
            if (row.id !== id) return row;
            
            const updated = {
              ...row,
              fuzzy,
              flags: fuzzy 
                ? [...(row.flags || []), 'fuzzy'].filter((v, i, a) => a.indexOf(v) === i)
                : (row.flags || []).filter(f => f !== 'fuzzy'),
              status: fuzzy ? 'fuzzy' as TranslationStatus : row.status,
            };
            
            return updated;
          });
          
          return { rows: updatedRows };
        });
      },
      
      // Select/deselect a row
      selectRow: (id: string, multiSelect?: boolean) => {
        set((state) => {
          const newSelected = new Set(state.selectedIds);
          
          if (multiSelect) {
            if (newSelected.has(id)) {
              newSelected.delete(id);
            } else {
              newSelected.add(id);
            }
          } else {
            newSelected.clear();
            newSelected.add(id);
          }
          
          return { selectedIds: newSelected };
        });
      },
      
      // Select multiple rows at once
      selectMultipleRows: (ids: string[]) => {
        set(() => ({
          selectedIds: new Set(ids),
        }));
      },
      
      // Clear all selections
      clearSelection: () => {
        set({ selectedIds: new Set() });
      },
      
      // Set active row (for editor panel)
      setActiveRow: (id: string | null) => {
        set({ activeRowId: id });
      },
      
      // Update settings
      updateSettings: (newSettings: Partial<AppSettings>) => {
        set((state) => {
          const updatedSettings = {
            ...state.settings,
            ...newSettings,
            validation: {
              ...state.settings.validation,
              ...(newSettings.validation || {}),
            },
            googleTranslate: {
              ...state.settings.googleTranslate,
              ...(newSettings.googleTranslate || {}),
            },
            ui: {
              ...state.settings.ui,
              ...(newSettings.ui || {}),
            },
          };
          
          // Re-validate all rows if validation settings changed
          if (newSettings.validation) {
            const updatedRows = state.rows.map((row) => ({
              ...row,
              validationErrors: validateTranslation(
                row.msgid,
                row.msgstr,
                updatedSettings.validation
              ),
            }));
            
            return { 
              settings: updatedSettings,
              rows: updatedRows,
            };
          }
          
          return { settings: updatedSettings };
        });
      },
      
      // Update filters
      updateFilters: (newFilters: Partial<FilterState>) => {
        set((state) => ({
          filters: {
            ...state.filters,
            ...newFilters,
          },
        }));
      },
      
      // Translate a row with provided text
      translateRow: (id: string, translatedText: string | string[]) => {
        set((state) => {
          const updatedRows = state.rows.map((row) => {
            if (row.id !== id) return row;
            
            const msgstr = Array.isArray(translatedText) 
              ? translatedText 
              : [translatedText];
            
            const updated = updateTranslation(row, msgstr);
            const status = getTranslationStatus(updated);
            const validationErrors = validateTranslation(
              row.msgid,
              msgstr,
              state.settings.validation
            );
            
            return {
              ...updated,
              id: row.id,
              context: row.context,
              status,
              validationErrors,
            };
          });
          
          return { rows: updatedRows };
        });
      },
      
      // Get filtered rows based on current filters
      getFilteredRows: () => {
        const { rows, filters } = get();
        
        return rows.filter((row) => {
          // Filter by status
          if (filters.status !== 'all' && row.status !== filters.status) {
            return false;
          }
          
          // Filter by search
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const searchText = `${row.msgid} ${row.msgstr.join(' ')} ${row.msgctxt || ''}`.toLowerCase();
            if (!searchText.includes(searchLower)) {
              return false;
            }
          }
          
          return true;
        });
      },
      
      // Get statistics
      getStatistics: () => {
        const { rows } = get();
        const total = rows.length;
        const translated = rows.filter(r => r.status === 'translated').length;
        const untranslated = rows.filter(r => r.status === 'untranslated').length;
        const fuzzy = rows.filter(r => r.status === 'fuzzy').length;
        const progress = total > 0 ? Math.round((translated / total) * 100) : 0;
        
        return { total, translated, untranslated, fuzzy, progress };
      },
    }),
    {
      name: 'poedit-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

// Helper hook for getting plural forms count
export function usePluralFormsCount(): number {
  const poFile = useAppStore((state) => state.poFile);
  
  if (!poFile?.headers) return 2; // Default
  
  const { nplurals } = getPluralForms(poFile.headers);
  return nplurals;
}
