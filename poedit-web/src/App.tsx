/**
 * Main App Component - Poedit Web Application
 * Full-featured PO file editor with Google Translate integration
 */

import { useState } from 'react';
import { Header } from './components/Header/Header';
import { Table } from './components/Table/Table';
import { Editor } from './components/Editor/Editor';
import { SettingsModal } from './components/Settings/SettingsModal';
import { useAppStore } from './store/appStore';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { fileName } = useAppStore();

  const handleRowSelect = (_id: string) => {
    // Row selection is handled by the store
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!fileName ? (
            // Empty state - no file loaded
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No file loaded
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Open a .po or .pot file to start editing translations, or drag and drop a file onto the header area.
                </p>
              </div>
            </div>
          ) : (
            // File loaded - show table and editor
            <>
              <Table onRowSelect={handleRowSelect} />
              <Editor />
            </>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
