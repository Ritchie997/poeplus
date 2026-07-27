// Types for PO file handling and application state

export interface PoTranslation {
  msgctxt?: string;
  msgid: string;
  msgid_plural?: string;
  msgstr: string[];
  comments?: TranslatorComment;
  flags?: string[];
  previous?: PreviousContext;
  fuzzy?: boolean;
}

export interface TranslatorComment {
  translator?: string[];
  extracted?: string[];
  reference?: string[];
  flag?: string[];
  obsolete?: string[];
}

export interface PreviousContext {
  msgctxt?: string;
  msgid?: string;
  msgid_plural?: string;
}

export interface PoHeaders {
  [key: string]: string;
}

export interface PoFile {
  charset: string;
  headers: PoHeaders;
  translations: { [context: string]: { [msgid: string]: PoTranslation } };
}

export type TranslationStatus = 'translated' | 'untranslated' | 'fuzzy' | 'needs-review';

export interface TranslationRow extends PoTranslation {
  id: string;
  context: string;
  status: TranslationStatus;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  type: ValidationType;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export type ValidationType = 
  | 'format-variables'
  | 'capitalization'
  | 'punctuation'
  | 'length'
  | 'empty-translation'
  | 'double-spaces';

export interface ValidationSettings {
  formatVariables: boolean;
  capitalization: boolean;
  punctuation: boolean;
  length: boolean;
  emptyTranslation: boolean;
  doubleSpaces: boolean;
  lengthThreshold: number;
}

export interface AppSettings {
  validation: ValidationSettings;
  googleTranslate: {
    apiKey: string;
    sourceLanguage: string;
    targetLanguage: string;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}

export interface FilterState {
  search: string;
  status: TranslationStatus | 'all';
}

export const DEFAULT_VALIDATION_SETTINGS: ValidationSettings = {
  formatVariables: true,
  capitalization: false,
  punctuation: false,
  length: false,
  emptyTranslation: true,
  doubleSpaces: false,
  lengthThreshold: 50,
};

export const DEFAULT_SETTINGS: AppSettings = {
  validation: DEFAULT_VALIDATION_SETTINGS,
  googleTranslate: {
    apiKey: '',
    sourceLanguage: 'auto',
    targetLanguage: 'ru',
  },
  ui: {
    theme: 'system',
    language: 'en',
  },
};
