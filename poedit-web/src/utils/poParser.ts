/**
 * PO File Parser and Compiler
 * Wrapper around gettext-parser to handle PO/POT files
 * Preserves all metadata, comments, flags, and formatting
 */

import * as gettextParser from 'gettext-parser';
import type { PoFile, PoTranslation } from '../types';

/**
 * Parse a PO file buffer into a structured object
 */
export function parsePoFile(buffer: Buffer | Uint8Array): PoFile {
  const parsed = gettextParser.po.parse(buffer);
  return parsed as unknown as PoFile;
}

/**
 * Compile a PoFile object back to a PO file buffer
 * Preserves all original formatting, comments, and headers
 */
export function compilePoFile(poFile: PoFile, charset: string = 'utf-8'): Buffer {
  return gettextParser.po.compile(poFile as unknown as gettextParser.GetTextTranslations, {
    charset,
    foldLength: false, // Don't fold long lines
  });
}

/**
 * Extract headers from PO file
 */
export function getHeaders(poFile: PoFile): Record<string, string> {
  return poFile.headers || {};
}

/**
 * Update a specific header value
 */
export function updateHeader(poFile: PoFile, key: string, value: string): PoFile {
  return {
    ...poFile,
    headers: {
      ...poFile.headers,
      [key]: value,
    },
  };
}

/**
 * Get the plural forms definition from headers
 * Returns nplurals and plural expression
 */
export function getPluralForms(headers: Record<string, string>): { nplurals: number; plural: string } {
  const pluralFormsHeader = headers['plural-forms'] || headers['Plural-Forms'] || '';
  
  // Parse "nplurals=2; plural=(n != 1);"
  const npluralsMatch = pluralFormsHeader.match(/nplurals\s*=\s*(\d+)/i);
  const pluralMatch = pluralFormsHeader.match(/plural\s*=\s*([^;]+)/i);
  
  return {
    nplurals: npluralsMatch ? parseInt(npluralsMatch[1], 10) : 2,
    plural: pluralMatch ? pluralMatch[1].trim() : '(n != 1)',
  };
}

/**
 * Convert translations object to flat array of rows
 */
export function flattenTranslations(poFile: PoFile): Array<{
  context: string;
  msgid: string;
  translation: PoTranslation;
}> {
  const rows: Array<{ context: string; msgid: string; translation: PoTranslation }> = [];
  
  for (const [context, translations] of Object.entries(poFile.translations)) {
    for (const [msgid, translation] of Object.entries(translations)) {
      // Skip empty msgid (it contains headers)
      if (msgid === '') continue;
      rows.push({ context, msgid, translation });
    }
  }
  
  return rows;
}

/**
 * Create a new PoTranslation object
 */
export function createTranslation(
  msgid: string,
  msgid_plural?: string,
  msgctxt?: string,
  nplurals: number = 1
): PoTranslation {
  const translation: PoTranslation = {
    msgid,
    msgstr: new Array(nplurals).fill(''),
  };
  
  if (msgid_plural) {
    translation.msgid_plural = msgid_plural;
  }
  
  if (msgctxt) {
    translation.msgctxt = msgctxt;
  }
  
  return translation;
}

/**
 * Determine translation status
 */
export function getTranslationStatus(translation: PoTranslation): 'translated' | 'untranslated' | 'fuzzy' {
  if (translation.fuzzy) {
    return 'fuzzy';
  }
  
  const hasEmptyTranslation = translation.msgstr.some(s => s.trim() === '');
  
  if (hasEmptyTranslation) {
    return 'untranslated';
  }
  
  return 'translated';
}

/**
 * Update translation with new msgstr values
 */
export function updateTranslation(
  translation: PoTranslation,
  msgstr: string[],
  options?: { fuzzy?: boolean; removeFuzzy?: boolean }
): PoTranslation {
  const updated: PoTranslation = {
    ...translation,
    msgstr: [...msgstr],
  };
  
  if (options?.fuzzy !== undefined) {
    updated.fuzzy = options.fuzzy;
  }
  
  // Remove fuzzy flag if requested and translation is complete
  if (options?.removeFuzzy && !updated.msgstr.some(s => s.trim() === '')) {
    updated.fuzzy = false;
    // Also remove 'fuzzy' from flags if present
    if (updated.flags) {
      updated.flags = updated.flags.filter(f => f !== 'fuzzy');
    }
  }
  
  return updated;
}

/**
 * Generate unique ID for a translation row
 */
export function generateTranslationId(context: string, msgid: string): string {
  return `${context}:::${msgid}`;
}

/**
 * Parse translation ID back to context and msgid
 */
export function parseTranslationId(id: string): { context: string; msgid: string } {
  const parts = id.split(':::');
  return {
    context: parts[0] || '',
    msgid: parts[1] || '',
  };
}
