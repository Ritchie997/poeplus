/**
 * Google Translate Integration
 * Provides translation services via Google Translate API
 */

import type { TranslationRow } from '../types';

export interface TranslateOptions {
  apiKey?: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Mock Google Translate function for demonstration
 * In production, replace with actual API calls
 */
export async function mockGoogleTranslate(
  texts: string[],
  options: TranslateOptions
): Promise<string[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock translations (prefix with target language code)
  return texts.map(text => `[${options.targetLanguage}] ${text}`);
}

/**
 * Real Google Translate API call
 * Uses the official Google Cloud Translation API
 */
export async function translateWithGoogleApi(
  texts: string[],
  options: TranslateOptions
): Promise<string[]> {
  if (!options.apiKey) {
    throw new Error('Google Translate API key is required');
  }
  
  const url = `https://translation.googleapis.com/language/translate/v2?key=${options.apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: texts,
      source: options.sourceLanguage === 'auto' ? undefined : options.sourceLanguage,
      target: options.targetLanguage,
      format: 'text',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Google Translate API error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.data.translations.map((t: { translatedText: string }) => t.translatedText);
}

/**
 * Batch translate multiple texts with rate limiting
 * Processes texts in batches to avoid rate limits
 */
export async function batchTranslate(
  rows: TranslationRow[],
  options: TranslateOptions,
  batchSize: number = 10,
  delayMs: number = 100
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  const useMockApi = !options.apiKey;
  
  // Group texts by msgid_plural presence (for plural handling)
  const textsToTranslate: Array<{ id: string; texts: string[] }> = rows.map(row => ({
    id: row.id,
    texts: [row.msgid], // For now, translate only msgid; plurals need special handling
  }));
  
  // Process in batches
  for (let i = 0; i < textsToTranslate.length; i += batchSize) {
    const batch = textsToTranslate.slice(i, i + batchSize);
    const allTexts = batch.flatMap(item => item.texts);
    
    try {
      const translatedTexts = useMockApi
        ? await mockGoogleTranslate(allTexts, options)
        : await translateWithGoogleApi(allTexts, options);
      
      // Map results back to IDs
      let textIndex = 0;
      for (const item of batch) {
        const count = item.texts.length;
        results.set(item.id, translatedTexts.slice(textIndex, textIndex + count));
        textIndex += count;
      }
    } catch (error) {
      console.error(`Translation batch failed:`, error);
      // Continue with next batch even if one fails
    }
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < textsToTranslate.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Handle plural forms translation
 * For languages with different plural rules, we may need to adapt translations
 */
export function handlePluralTranslation(
  translatedSingular: string,
  nplurals: number,
  _targetLanguage: string
): string[] {
  // Default: repeat the same translation for all plural forms
  // In a more advanced implementation, you could use AI to generate proper plural forms
  
  const results: string[] = [];
  for (let i = 0; i < nplurals; i++) {
    results.push(translatedSingular);
  }
  
  return results;
}

/**
 * Supported languages for Google Translate
 */
export const SUPPORTED_LANGUAGES: Array<{ code: string; name: string }> = [
  { code: 'auto', name: 'Detect Language' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'cs', name: 'Czech' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'et', name: 'Estonian' },
];

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code)?.name || code;
}
