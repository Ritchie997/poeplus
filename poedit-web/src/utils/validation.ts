/**
 * Translation Validation Module
 * Provides various quality checks for translations
 * Each check can be enabled/disabled via settings
 */

import type { ValidationError, ValidationSettings } from '../types';

/**
 * Extract format variables from a string
 * Supports: %s, %d, %f, %1$s, %2$d, %(name)s, {0}, {name}
 */
export function extractFormatVariables(text: string): string[] {
  const variables: string[] = [];
  
  // Match %s, %d, %f, %x$y patterns
  const percentMatches = text.match(/%(\d+\$)?[sdfoxXeEgGc]/g) || [];
  variables.push(...percentMatches);
  
  // Match %(name)s patterns
  const namedMatches = text.match(/%\([a-zA-Z_][a-zA-Z0-9_]*\)s/g) || [];
  variables.push(...namedMatches);
  
  // Match {0}, {name} patterns
  const braceMatches = text.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}|\{\d+\}/g) || [];
  variables.push(...braceMatches);
  
  return variables;
}

/**
 * Check 1: Format Variables Validation
 * Ensures all variables from msgid are present in msgstr
 */
export function validateFormatVariables(
  msgid: string,
  msgstr: string,
  enabled: boolean
): ValidationError | null {
  if (!enabled) return null;
  
  const sourceVars = extractFormatVariables(msgid);
  const targetVars = extractFormatVariables(msgstr);
  
  // Check for missing variables
  const missingVars = sourceVars.filter(v => !targetVars.includes(v));
  if (missingVars.length > 0) {
    return {
      type: 'format-variables',
      message: `Missing format variables: ${missingVars.join(', ')}`,
      severity: 'error',
    };
  }
  
  // Check for extra variables
  const extraVars = targetVars.filter(v => !sourceVars.includes(v));
  if (extraVars.length > 0) {
    return {
      type: 'format-variables',
      message: `Extra format variables: ${extraVars.join(', ')}`,
      severity: 'warning',
    };
  }
  
  // Check for case mismatches (e.g., %S instead of %s)
  const sourceLower = sourceVars.map(v => v.toLowerCase());
  const targetLower = targetVars.map(v => v.toLowerCase());
  
  for (let i = 0; i < sourceVars.length; i++) {
    const sourceVar = sourceVars[i];
    const targetIndex = targetLower.indexOf(sourceVar.toLowerCase());
    
    if (targetIndex !== -1 && targetVars[targetIndex] !== sourceVar) {
      return {
        type: 'format-variables',
        message: `Case mismatch: "${sourceVar}" should be "${targetVars[targetIndex]}"`,
        severity: 'error',
      };
    }
  }
  
  return null;
}

/**
 * Check 2: Capitalization Validation
 * If msgid starts with uppercase, msgstr should too
 */
export function validateCapitalization(
  msgid: string,
  msgstr: string,
  enabled: boolean
): ValidationError | null {
  if (!enabled) return null;
  
  // Skip if msgid starts with a variable
  if (msgid.match(/^[%{]/)) {
    return null;
  }
  
  const sourceFirstChar = msgid.trim().charAt(0);
  const targetFirstChar = msgstr.trim().charAt(0);
  
  const sourceIsUpper = sourceFirstChar === sourceFirstChar.toUpperCase() 
    && sourceFirstChar !== sourceFirstChar.toLowerCase();
  const targetIsUpper = targetFirstChar === targetFirstChar.toUpperCase() 
    && targetFirstChar !== targetFirstChar.toLowerCase();
  
  // Only check if source starts with a letter
  if (sourceFirstChar.match(/[a-zA-Z]/)) {
    if (sourceIsUpper && !targetIsUpper) {
      return {
        type: 'capitalization',
        message: 'Translation should start with an uppercase letter',
        severity: 'warning',
      };
    }
    
    if (!sourceIsUpper && targetIsUpper && targetFirstChar.match(/[a-zA-Z]/)) {
      return {
        type: 'capitalization',
        message: 'Translation should start with a lowercase letter',
        severity: 'warning',
      };
    }
  }
  
  return null;
}

/**
 * Check 3: Punctuation Validation
 * Ensures matching end punctuation between msgid and msgstr
 */
export function validatePunctuation(
  msgid: string,
  msgstr: string,
  enabled: boolean
): ValidationError | null {
  if (!enabled) return null;
  
  const punctuationMarks = '.!?:;,';
  
  const sourceLastChar = msgid.trim().slice(-1);
  const targetLastChar = msgstr.trim().slice(-1);
  
  const sourceHasPunct = punctuationMarks.includes(sourceLastChar);
  const targetHasPunct = punctuationMarks.includes(targetLastChar);
  
  if (sourceHasPunct && !targetHasPunct) {
    return {
      type: 'punctuation',
      message: `Translation should end with "${sourceLastChar}"`,
      severity: 'warning',
    };
  }
  
  if (!sourceHasPunct && targetHasPunct) {
    return {
      type: 'punctuation',
      message: 'Translation should not end with punctuation',
      severity: 'warning',
    };
  }
  
  if (sourceHasPunct && targetHasPunct && sourceLastChar !== targetLastChar) {
    // Allow some equivalent punctuation marks
    const equivalents: Record<string, string[]> = {
      '.': ['.'],
      '!': ['!'],
      '?': ['?'],
      ':': [':'],
      ';': [';', ','],
      ',': [','],
    };
    
    if (!equivalents[sourceLastChar]?.includes(targetLastChar)) {
      return {
        type: 'punctuation',
        message: `Expected "${sourceLastChar}" at the end, got "${targetLastChar}"`,
        severity: 'info',
      };
    }
  }
  
  return null;
}

/**
 * Check 4: Length Validation
 * Warns if translation is significantly longer than source
 */
export function validateLength(
  msgid: string,
  msgstr: string,
  enabled: boolean,
  threshold: number = 50
): ValidationError | null {
  if (!enabled) return null;
  
  const sourceLength = msgid.length;
  const targetLength = msgstr.length;
  
  if (sourceLength === 0) return null;
  
  const lengthDiffPercent = ((targetLength - sourceLength) / sourceLength) * 100;
  
  if (lengthDiffPercent > threshold) {
    return {
      type: 'length',
      message: `Translation is ${lengthDiffPercent.toFixed(0)}% longer than source`,
      severity: 'info',
    };
  }
  
  return null;
}

/**
 * Check 5: Empty Translation Validation
 * Ensures translated status doesn't have empty msgstr
 */
export function validateEmptyTranslation(
  msgstr: string[],
  enabled: boolean
): ValidationError | null {
  if (!enabled) return null;
  
  const hasEmpty = msgstr.some(s => s.trim() === '');
  
  if (hasEmpty) {
    return {
      type: 'empty-translation',
      message: 'Translation is empty',
      severity: 'error',
    };
  }
  
  return null;
}

/**
 * Check 6: Double Spaces and Typos Validation
 * Warns about common formatting issues
 */
export function validateDoubleSpaces(
  msgstr: string,
  enabled: boolean
): ValidationError | null {
  if (!enabled) return null;
  
  // Check for double spaces
  if (msgstr.includes('  ')) {
    return {
      type: 'double-spaces',
      message: 'Contains double spaces',
      severity: 'info',
    };
  }
  
  // Check for space before punctuation
  const punctBeforeSpace = /[ \t]+[.!?:;,]/g;
  if (punctBeforeSpace.test(msgstr)) {
    return {
      type: 'double-spaces',
      message: 'Contains space before punctuation',
      severity: 'info',
    };
  }
  
  // Check for leading/trailing spaces (unless intentional)
  if (msgstr.startsWith(' ') || msgstr.endsWith(' ')) {
    return {
      type: 'double-spaces',
      message: 'Contains leading or trailing spaces',
      severity: 'info',
    };
  }
  
  return null;
}

/**
 * Run all enabled validations on a translation
 */
export function validateTranslation(
  msgid: string,
  msgstr: string[],
  settings: ValidationSettings
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // For plural forms, validate each msgstr
  for (const str of msgstr) {
    // Format variables check
    const formatError = validateFormatVariables(msgid, str, settings.formatVariables);
    if (formatError) errors.push(formatError);
    
    // Capitalization check
    const capError = validateCapitalization(msgid, str, settings.capitalization);
    if (capError) errors.push(capError);
    
    // Punctuation check
    const punctError = validatePunctuation(msgid, str, settings.punctuation);
    if (punctError) errors.push(punctError);
    
    // Length check
    const lengthError = validateLength(msgid, str, settings.length, settings.lengthThreshold);
    if (lengthError) errors.push(lengthError);
    
    // Double spaces check
    const spaceError = validateDoubleSpaces(str, settings.doubleSpaces);
    if (spaceError) errors.push(spaceError);
  }
  
  // Empty translation check (applies to all msgstr entries)
  const emptyError = validateEmptyTranslation(msgstr, settings.emptyTranslation);
  if (emptyError) errors.push(emptyError);
  
  // Deduplicate errors by type (keep the most severe)
  const uniqueErrors = new Map<string, ValidationError>();
  for (const error of errors) {
    const existing = uniqueErrors.get(error.type);
    if (!existing || error.severity === 'error' || 
        (existing.severity === 'info' && error.severity === 'warning')) {
      uniqueErrors.set(error.type, error);
    }
  }
  
  return Array.from(uniqueErrors.values());
}

/**
 * Highlight format variables in text for display
 */
export function highlightFormatVariables(text: string): Array<{ text: string; isVariable: boolean }> {
  const result: Array<{ text: string; isVariable: boolean }> = [];
  let lastIndex = 0;
  
  // Combined regex for all variable types
  const varRegex = /(%(\d+\$)?[sdfoxXeEgGc])|(%\([a-zA-Z_][a-zA-Z0-9_]*\)s)|(\{[a-zA-Z_][a-zA-Z0-9_]*\})|(\{\d+\})/g;
  
  let match: RegExpExecArray | null;
  while ((match = varRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: text.slice(lastIndex, match.index), isVariable: false });
    }
    result.push({ text: match[0], isVariable: true });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), isVariable: false });
  }
  
  return result;
}
