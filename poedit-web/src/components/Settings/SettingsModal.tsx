/**
 * Settings Modal Component
 * Allows configuration of validation rules, Google Translate, and UI preferences
 */

import React from 'react';
import { useAppStore } from '../../store/appStore';
import { SUPPORTED_LANGUAGES } from '../../utils/googleTranslate';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useAppStore();

  if (!isOpen) return null;

  const handleValidationToggle = (key: keyof typeof settings.validation) => {
    updateSettings({
      validation: {
        ...settings.validation,
        [key]: !settings.validation[key],
      },
    });
  };

  const handleLengthThresholdChange = (value: number) => {
    updateSettings({
      validation: {
        ...settings.validation,
        lengthThreshold: value,
      },
    });
  };

  const handleGoogleTranslateChange = (key: keyof typeof settings.googleTranslate, value: string) => {
    updateSettings({
      googleTranslate: {
        ...settings.googleTranslate,
        [key]: value,
      },
    });
  };

  const handleUiChange = (key: keyof typeof settings.ui, value: string) => {
    updateSettings({
      ui: {
        ...settings.ui,
        [key]: value,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Validation Settings */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Quality Checks
              </h3>
              <div className="space-y-4">
                {/* Format Variables */}
                <div className="flex items-start justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Format Variables
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Check that all variables (%s, %d, %(name)s, etc.) are present in translation
                    </p>
                  </div>
                  <button
                    onClick={() => handleValidationToggle('formatVariables')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.validation.formatVariables ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.validation.formatVariables ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Capitalization */}
                <div className="flex items-start justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Capitalization
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Ensure translation starts with same case as original
                    </p>
                  </div>
                  <button
                    onClick={() => handleValidationToggle('capitalization')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.validation.capitalization ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.validation.capitalization ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Punctuation */}
                <div className="flex items-start justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Punctuation
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Match ending punctuation between original and translation
                    </p>
                  </div>
                  <button
                    onClick={() => handleValidationToggle('punctuation')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.validation.punctuation ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.validation.punctuation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Length */}
                <div className="flex items-start justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Length Check
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Warn if translation is significantly longer than original
                    </p>
                  </div>
                  <button
                    onClick={() => handleValidationToggle('length')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.validation.length ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.validation.length ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Length Threshold */}
                {settings.validation.length && (
                  <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Length threshold: {settings.validation.lengthThreshold}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      value={settings.validation.lengthThreshold}
                      onChange={(e) => handleLengthThresholdChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {/* Empty Translation */}
                <div className="flex items-start justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Empty Translation
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Flag translations marked as translated but empty
                    </p>
                  </div>
                  <button
                    onClick={() => handleValidationToggle('emptyTranslation')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.validation.emptyTranslation ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.validation.emptyTranslation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Double Spaces */}
                <div className="flex items-start justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Double Spaces & Typos
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Detect double spaces and spaces before punctuation
                    </p>
                  </div>
                  <button
                    onClick={() => handleValidationToggle('doubleSpaces')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.validation.doubleSpaces ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.validation.doubleSpaces ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Google Translate Settings */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Google Translate
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key (optional)
                  </label>
                  <input
                    type="password"
                    value={settings.googleTranslate.apiKey}
                    onChange={(e) => handleGoogleTranslateChange('apiKey', e.target.value)}
                    placeholder="Enter your Google Cloud API key"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to use mock translations for testing
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Source Language
                    </label>
                    <select
                      value={settings.googleTranslate.sourceLanguage}
                      onChange={(e) => handleGoogleTranslateChange('sourceLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Language
                    </label>
                    <select
                      value={settings.googleTranslate.targetLanguage}
                      onChange={(e) => handleGoogleTranslateChange('targetLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* UI Settings */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Interface
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => handleUiChange('theme', theme)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          settings.ui.theme === theme
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interface Language
                  </label>
                  <select
                    value={settings.ui.language}
                    onChange={(e) => handleUiChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end sticky bottom-0 bg-white dark:bg-gray-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
