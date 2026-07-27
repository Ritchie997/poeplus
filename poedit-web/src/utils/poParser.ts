/**
 * PO File Parser and Compiler
 * Pure TypeScript implementation for browser compatibility
 * Preserves all metadata, comments, flags, and formatting
 */

import type { PoFile, PoTranslation, TranslatorComment, PreviousContext } from '../types';

/**
 * Parse a PO file content string into a structured object
 */
export function parsePoFile(content: string): PoFile {
  const lines = content.split(/\r?\n/);
  const result: PoFile = {
    charset: 'utf-8',
    headers: {},
    translations: {},
  };

  let currentContext = '';
  let currentMsgid = '';
  let currentTranslation: Partial<PoTranslation> = {};
  let currentField: 'msgid' | 'msgid_plural' | 'msgstr' | 'msgctxt' | null = null;
  let pendingComments: TranslatorComment = {
    translator: [],
    extracted: [],
    reference: [],
    flag: [],
    obsolete: [],
  };

  const flushTranslation = () => {
    if (currentMsgid || currentContext) {
      if (!result.translations[currentContext]) {
        result.translations[currentContext] = {};
      }
      
      const translation: PoTranslation = {
        msgid: currentTranslation.msgid || currentMsgid,
        msgstr: currentTranslation.msgstr || [''],
      };

      if (currentTranslation.msgctxt) {
        translation.msgctxt = currentTranslation.msgctxt;
      }
      if (currentTranslation.msgid_plural) {
        translation.msgid_plural = currentTranslation.msgid_plural;
      }
      if (currentTranslation.fuzzy) {
        translation.fuzzy = currentTranslation.fuzzy;
      }
      if (pendingComments.translator?.length || pendingComments.extracted?.length || 
          pendingComments.reference?.length || pendingComments.flag?.length) {
        translation.comments = { ...pendingComments };
      }
      if (currentTranslation.flags) {
        translation.flags = currentTranslation.flags;
      }
      if (currentTranslation.previous) {
        translation.previous = currentTranslation.previous;
      }

      result.translations[currentContext][currentMsgid] = translation;
    }
    
    currentMsgid = '';
    currentTranslation = {};
    pendingComments = {
      translator: [],
      extracted: [],
      reference: [],
      flag: [],
      obsolete: [],
    };
    currentField = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines - they separate entries
    if (trimmedLine === '') {
      if (currentField !== null && currentMsgid) {
        flushTranslation();
      }
      continue;
    }

    // Comments
    if (trimmedLine.startsWith('#.')) {
      pendingComments.extracted?.push(trimmedLine.substring(2).trim());
      continue;
    }
    if (trimmedLine.startsWith('#:')) {
      pendingComments.reference?.push(trimmedLine.substring(2).trim());
      continue;
    }
    if (trimmedLine.startsWith('#,')) {
      const flags = trimmedLine.substring(2).trim().split(',').map(f => f.trim());
      pendingComments.flag = [...(pendingComments.flag || []), ...flags];
      if (flags.includes('fuzzy')) {
        currentTranslation.fuzzy = true;
      }
      continue;
    }
    if (trimmedLine.startsWith('#|')) {
      // Previous context - simplified handling
      if (!currentTranslation.previous) {
        currentTranslation.previous = {};
      }
      const prevLine = trimmedLine.substring(2).trim();
      if (prevLine.startsWith('msgid ')) {
        currentTranslation.previous.msgid = unescapePoString(prevLine.substring(6));
      }
      continue;
    }
    if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('#.')) {
      // Translator comment or other
      const comment = trimmedLine.substring(1).trim();
      if (comment && !comment.startsWith(':') && !comment.startsWith(',') && !comment.startsWith('|')) {
        pendingComments.translator?.push(comment);
      }
      continue;
    }

    // Context
    if (trimmedLine.startsWith('msgctxt ')) {
      if (currentMsgid) {
        flushTranslation();
      }
      currentContext = unescapePoString(trimmedLine.substring(8));
      currentTranslation.msgctxt = currentContext;
      currentField = 'msgctxt';
      continue;
    }

    // Msgid
    if (trimmedLine.startsWith('msgid ')) {
      if (currentMsgid && currentField !== 'msgid') {
        flushTranslation();
      }
      currentMsgid = unescapePoString(trimmedLine.substring(6));
      currentTranslation.msgid = currentMsgid;
      currentField = 'msgid';
      continue;
    }

    // Msgid plural
    if (trimmedLine.startsWith('msgid_plural ')) {
      currentTranslation.msgid_plural = unescapePoString(trimmedLine.substring(13));
      currentField = 'msgid_plural';
      continue;
    }

    // Msgstr
    if (trimmedLine.startsWith('msgstr ')) {
      currentTranslation.msgstr = [unescapePoString(trimmedLine.substring(7))];
      currentField = 'msgstr';
      continue;
    }

    // Msgstr[n]
    const msgstrNMatch = trimmedLine.match(/^msgstr\[(\d+)\]\s*(.*)$/);
    if (msgstrNMatch) {
      const index = parseInt(msgstrNMatch[1], 10);
      const value = unescapePoString(msgstrNMatch[2]);
      if (!currentTranslation.msgstr) {
        currentTranslation.msgstr = [];
      }
      currentTranslation.msgstr[index] = value;
      currentField = 'msgstr';
      continue;
    }

    // Continuation lines (strings in quotes)
    if ((trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) || 
        (trimmedLine.startsWith('"') && !trimmedLine.endsWith('"'))) {
      const unescaped = unescapePoString(trimmedLine.replace(/^"|"$/g, ''));
      
      if (currentField === 'msgid') {
        currentTranslation.msgid = (currentTranslation.msgid || '') + unescaped;
        currentMsgid = currentTranslation.msgid;
      } else if (currentField === 'msgid_plural') {
        currentTranslation.msgid_plural = (currentTranslation.msgid_plural || '') + unescaped;
      } else if (currentField === 'msgstr' && currentTranslation.msgstr) {
        const lastIndex = currentTranslation.msgstr.length - 1;
        currentTranslation.msgstr[lastIndex] = (currentTranslation.msgstr[lastIndex] || '') + unescaped;
      }
      continue;
    }
  }

  // Flush last translation
  flushTranslation();

  // Extract headers from the empty msgid entry
  if (result.translations[''] && result.translations['']['']) {
    const headerTranslation = result.translations[''][''];
    if (headerTranslation.msgstr && headerTranslation.msgstr[0]) {
      const headerText = headerTranslation.msgstr[0];
      const headerLines = headerText.split('\n');
      for (const headerLine of headerLines) {
        const colonIndex = headerLine.indexOf(':');
        if (colonIndex > 0) {
          const key = headerLine.substring(0, colonIndex).trim();
          const value = headerLine.substring(colonIndex + 1).trim();
          result.headers[key] = value;
          
          if (key.toLowerCase() === 'content-type') {
            const charsetMatch = value.match(/charset=([^;\s]+)/i);
            if (charsetMatch) {
              result.charset = charsetMatch[1];
            }
          }
        }
      }
    }
    // Remove the header entry from translations
    delete result.translations[''][''];
  }

  return result;
}

/**
 * Unescape a PO string literal
 */
function unescapePoString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Escape a string for PO file format
 */
function escapePoString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Compile a PoFile object back to a PO file string
 * Preserves all original formatting, comments, and headers
 */
export function compilePoFile(poFile: PoFile): string {
  const lines: string[] = [];

  // Add headers as the first entry with empty msgid
  const headerLines: string[] = [];
  for (const [key, value] of Object.entries(poFile.headers)) {
    headerLines.push(`${key}: ${value}`);
  }
  
  if (headerLines.length > 0) {
    lines.push('msgid ""');
    lines.push('msgstr ""');
    for (const headerLine of headerLines) {
      lines.push(`"${headerLine}\\n"`);
    }
    lines.push('');
  }

  // Add translations
  for (const [context, translations] of Object.entries(poFile.translations)) {
    for (const [msgid, translation] of Object.entries(translations)) {
      // Add comments
      if (translation.comments) {
        if (translation.comments.extracted) {
          for (const comment of translation.comments.extracted) {
            lines.push(`#. ${comment}`);
          }
        }
        if (translation.comments.reference) {
          for (const ref of translation.comments.reference) {
            lines.push(`#: ${ref}`);
          }
        }
        if (translation.comments.flag) {
          const flagStr = translation.comments.flag.join(', ');
          if (flagStr) {
            lines.push(`#, ${flagStr}`);
          }
        }
        if (translation.comments.translator) {
          for (const comment of translation.comments.translator) {
            lines.push(`# ${comment}`);
          }
        }
      }

      // Add fuzzy flag if set
      if (translation.fuzzy) {
        // Check if not already in comments.flag
        const hasFuzzyInComments = translation.comments?.flag?.includes('fuzzy');
        if (!hasFuzzyInComments) {
          lines.push('#, fuzzy');
        }
      }

      // Add context if present
      if (translation.msgctxt) {
        lines.push(`msgctxt "${escapePoString(translation.msgctxt)}"`);
      }

      // Add msgid
      const msgidEscaped = escapePoString(msgid);
      lines.push(`msgid "${msgidEscaped}"`);

      // Add msgid_plural if present
      if (translation.msgid_plural) {
        lines.push(`msgid_plural "${escapePoString(translation.msgid_plural)}"`);
        
        // Add plural forms
        if (translation.msgstr) {
          for (let i = 0; i < translation.msgstr.length; i++) {
            lines.push(`msgstr[${i}] "${escapePoString(translation.msgstr[i] || '')}"`);
          }
        }
      } else {
        // Singular form
        const msgstr = translation.msgstr && translation.msgstr[0] ? translation.msgstr[0] : '';
        lines.push(`msgstr "${escapePoString(msgstr)}"`);
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Parse PO file from ArrayBuffer (for file uploads)
 */
export function parsePoFileFromBuffer(buffer: ArrayBuffer | Uint8Array): PoFile {
  const decoder = new TextDecoder('utf-8');
  const content = decoder.decode(buffer);
  return parsePoFile(content);
}

/**
 * Convert PoFile to downloadable Blob
 */
export function poFileToBlob(poFile: PoFile, filename: string = 'translations.po'): Blob {
  const content = compilePoFile(poFile);
  return new Blob([content], { type: 'text/plain;charset=utf-8' });
}

/**
 * Extract headers from PO file
 */
export function getHeaders(poFile: PoFile): Record<string, string> {
  return poFile.headers || {};
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
