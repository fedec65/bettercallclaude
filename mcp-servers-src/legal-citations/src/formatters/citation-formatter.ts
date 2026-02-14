/**
 * Multi-lingual citation formatter for Swiss legal citations
 * Converts between DE/FR/IT/EN formats while preserving meaning
 */

import type {
  Language,
  FormatOptions,
  FormattedCitation,
  CitationComponents,
  CitationType
} from '../types.js';

export class CitationFormatter {
  // Statute name mappings across languages
  private static readonly STATUTE_NAMES: Record<string, Record<Language, string>> = {
    'ZGB': {
      de: 'ZGB',
      fr: 'CC',
      it: 'CC',
      en: 'CC' // Swiss Civil Code
    },
    'CC': {
      de: 'ZGB',
      fr: 'CC',
      it: 'CC',
      en: 'CC'
    },
    'OR': {
      de: 'OR',
      fr: 'CO',
      it: 'CO',
      en: 'CO' // Code of Obligations
    },
    'CO': {
      de: 'OR',
      fr: 'CO',
      it: 'CO',
      en: 'CO'
    },
    'STGB': {
      de: 'StGB',
      fr: 'CP',
      it: 'CP',
      en: 'CP' // Criminal Code
    },
    'CP': {
      de: 'StGB',
      fr: 'CP',
      it: 'CP',
      en: 'CP'
    },
    'STPO': {
      de: 'StPO',
      fr: 'CPP',
      it: 'CPP',
      en: 'CPP' // Criminal Procedure Code
    },
    'CPP': {
      de: 'StPO',
      fr: 'CPP',
      it: 'CPP',
      en: 'CPP'
    },
    'ZPO': {
      de: 'ZPO',
      fr: 'CPC',
      it: 'CPC',
      en: 'CPC' // Civil Procedure Code
    },
    'CPC': {
      de: 'ZPO',
      fr: 'CPC',
      it: 'CPC',
      en: 'CPC'
    },
    'BV': {
      de: 'BV',
      fr: 'Cst',
      it: 'Cost',
      en: 'Cst' // Federal Constitution
    },
    'CST': {
      de: 'BV',
      fr: 'Cst',
      it: 'Cost',
      en: 'Cst'
    },
    'COST': {
      de: 'BV',
      fr: 'Cst',
      it: 'Cost',
      en: 'Cst'
    },
    'SCHKG': {
      de: 'SchKG',
      fr: 'LP',
      it: 'LEF',
      en: 'DEBA' // Debt Collection and Bankruptcy Act
    },
    'LP': {
      de: 'SchKG',
      fr: 'LP',
      it: 'LEF',
      en: 'DEBA'
    },
    'LEF': {
      de: 'SchKG',
      fr: 'LP',
      it: 'LEF',
      en: 'DEBA'
    },
    'DSG': {
      de: 'DSG',
      fr: 'LPD',
      it: 'LPD',
      en: 'DPA' // Data Protection Act
    },
    'LPD': {
      de: 'DSG',
      fr: 'LPD',
      it: 'LPD',
      en: 'DPA'
    }
  };

  // Full statute names
  private static readonly STATUTE_FULL_NAMES: Record<string, Record<Language, string>> = {
    'ZGB': {
      de: 'Schweizerisches Zivilgesetzbuch',
      fr: 'Code civil suisse',
      it: 'Codice civile svizzero',
      en: 'Swiss Civil Code'
    },
    'OR': {
      de: 'Obligationenrecht',
      fr: 'Code des obligations',
      it: 'Codice delle obbligazioni',
      en: 'Code of Obligations'
    },
    'StGB': {
      de: 'Schweizerisches Strafgesetzbuch',
      fr: 'Code pénal suisse',
      it: 'Codice penale svizzero',
      en: 'Swiss Criminal Code'
    },
    'BV': {
      de: 'Bundesverfassung der Schweizerischen Eidgenossenschaft',
      fr: 'Constitution fédérale de la Confédération suisse',
      it: 'Costituzione federale della Confederazione Svizzera',
      en: 'Federal Constitution of the Swiss Confederation'
    }
  };

  // Citation component labels by language
  private static readonly LABELS: Record<Language, {
    article: string;
    paragraph: string;
    letter: string;
    number: string;
  }> = {
    de: {
      article: 'Art.',
      paragraph: 'Abs.',
      letter: 'lit.',
      number: 'Ziff.'
    },
    fr: {
      article: 'art.',
      paragraph: 'al.',
      letter: 'let.',
      number: 'ch.'
    },
    it: {
      article: 'art.',
      paragraph: 'cpv.',
      letter: 'lett.',
      number: 'n.'
    },
    en: {
      article: 'Art.',
      paragraph: 'para.',
      letter: 'let.',
      number: 'no.'
    }
  };

  /**
   * Format a BGE/ATF/DTF citation to target language
   */
  formatCourtCitation(
    type: 'bge' | 'atf' | 'dtf',
    components: CitationComponents,
    targetLanguage: Language
  ): FormattedCitation {
    const { volume, chamber, page } = components;

    // BGE/ATF/DTF conversions
    const citationPrefix = this.convertCourtCitationPrefix(type, targetLanguage);

    const citation = `${citationPrefix} ${volume} ${chamber} ${page}`;

    return {
      citation,
      language: targetLanguage,
      type,
      abbreviatedReference: citation,
      fullReference: citation
    };
  }

  /**
   * Convert BGE/ATF/DTF prefix based on language
   */
  private convertCourtCitationPrefix(
    sourceType: 'bge' | 'atf' | 'dtf',
    targetLanguage: Language
  ): string {
    const prefixMap: Record<Language, string> = {
      de: 'BGE',
      fr: 'ATF',
      it: 'DTF',
      en: 'BGE' // Use German abbreviation for English
    };

    return prefixMap[targetLanguage];
  }

  /**
   * Format a statutory citation to target language
   */
  formatStatutoryCitation(
    components: CitationComponents,
    targetLanguage: Language,
    options: FormatOptions = { language: targetLanguage }
  ): FormattedCitation {
    const { article, paragraph, letter, number, statute } = components;

    if (!statute || !article) {
      throw new Error('Statute and article are required for statutory citations');
    }

    const labels = CitationFormatter.LABELS[targetLanguage];

    // Convert statute code to target language
    const convertedStatute = this.convertStatuteCode(statute, targetLanguage);

    // Build citation string
    let citation = `${labels.article} ${article}`;

    if (paragraph) {
      citation += ` ${labels.paragraph} ${paragraph}`;
    }

    if (letter) {
      citation += ` ${labels.letter} ${letter}`;
    }

    if (number) {
      citation += ` ${labels.number} ${number}`;
    }

    citation += ` ${convertedStatute}`;

    // Build full reference if requested
    let fullReference = citation;
    if (options.fullStatuteName) {
      const fullName = CitationFormatter.STATUTE_FULL_NAMES[statute]?.[targetLanguage];
      if (fullName) {
        fullReference = `${citation} (${fullName})`;
      }
    }

    return {
      citation,
      language: targetLanguage,
      type: 'statute',
      abbreviatedReference: citation,
      fullReference
    };
  }

  /**
   * Convert statute code between languages
   */
  private convertStatuteCode(statute: string, targetLanguage: Language): string {
    const normalizedStatute = statute.toUpperCase();

    // Direct mapping exists
    if (CitationFormatter.STATUTE_NAMES[normalizedStatute]) {
      return CitationFormatter.STATUTE_NAMES[normalizedStatute][targetLanguage];
    }

    // Reverse lookup - find the base statute
    for (const [baseStatute, translations] of Object.entries(CitationFormatter.STATUTE_NAMES)) {
      for (const translation of Object.values(translations)) {
        if (translation.toUpperCase() === normalizedStatute) {
          return translations[targetLanguage];
        }
      }
    }

    // No mapping found, return original
    return statute;
  }

  /**
   * Format any citation type to target language
   */
  format(
    type: CitationType,
    components: CitationComponents,
    targetLanguage: Language,
    options?: FormatOptions
  ): FormattedCitation {
    const opts: FormatOptions = {
      language: targetLanguage,
      includeAbbreviations: true,
      fullStatuteName: false,
      ...options
    };

    if (type === 'bge' || type === 'atf' || type === 'dtf') {
      return this.formatCourtCitation(type, components, targetLanguage);
    }

    if (type === 'statute' || type === 'article') {
      return this.formatStatutoryCitation(components, targetLanguage, opts);
    }

    throw new Error(`Unsupported citation type for formatting: ${type}`);
  }

  /**
   * Convert citation from one language to another
   */
  convert(
    citation: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    components: CitationComponents,
    type: CitationType
  ): FormattedCitation {
    return this.format(type, components, targetLanguage);
  }

  /**
   * Get all available translations for a citation
   */
  getAllTranslations(
    type: CitationType,
    components: CitationComponents
  ): Record<Language, string> {
    const languages: Language[] = ['de', 'fr', 'it', 'en'];
    const translations: Record<string, string> = {};

    for (const lang of languages) {
      try {
        const formatted = this.format(type, components, lang);
        translations[lang] = formatted.citation;
      } catch (error) {
        // Skip if translation fails
      }
    }

    return translations as Record<Language, string>;
  }
}
