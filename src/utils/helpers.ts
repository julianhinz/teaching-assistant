/**
 * Utility functions for the teaching assistant
 */

import { TaskType, Language, ChangeLogEntry } from '../types/index.js';

/**
 * Classify a task based on keywords
 */
export function classifyTask(taskDescription: string): TaskType {
  const lower = taskDescription.toLowerCase();

  const keywords = {
    latex: ['latex', 'slides', 'beamer', 'compile', 'tex', 'macro', 'polish'],
    problemset: ['problem', 'exercise', 'solution', 'homework', 'assignment', 'quiz'],
    research: ['research', 'literature', 'citation', 'bibtex', 'paper', 'reference', 'background'],
    rcode: ['r code', 'r script', 'rstudio', 'analysis', 'data', 'plot', 'simulation']
  };

  const matches = {
    latex: keywords.latex.some(kw => lower.includes(kw)),
    problemset: keywords.problemset.some(kw => lower.includes(kw)),
    research: keywords.research.some(kw => lower.includes(kw)),
    rcode: keywords.rcode.some(kw => lower.includes(kw))
  };

  const matchCount = Object.values(matches).filter(Boolean).length;

  if (matchCount === 0) {
    return 'mixed'; // Default to mixed if unclear
  } else if (matchCount > 1) {
    return 'mixed';
  } else {
    return Object.entries(matches).find(([_, matched]) => matched)?.[0] as TaskType;
  }
}

/**
 * Create a timestamp string
 */
export function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Create a change log entry
 */
export function createChangeLogEntry(
  agent: string,
  action: string,
  files: string[],
  description: string
): ChangeLogEntry {
  return {
    timestamp: timestamp(),
    agent,
    action,
    files,
    description
  };
}

/**
 * Format change log for display
 */
export function formatChangeLog(entries: ChangeLogEntry[]): string {
  if (entries.length === 0) {
    return 'No changes recorded.';
  }

  let output = '# Change Log\n\n';
  
  for (const entry of entries) {
    output += `## ${entry.timestamp}\n`;
    output += `**Agent:** ${entry.agent}\n`;
    output += `**Action:** ${entry.action}\n`;
    output += `**Files:** ${entry.files.join(', ')}\n`;
    output += `**Description:** ${entry.description}\n\n`;
  }

  return output;
}

/**
 * Translate common terms between English and German
 */
export function translate(text: string, targetLang: Language): string {
  if (targetLang === 'en') {
    return text; // Assume input is English by default
  }

  // Simple translation map for common economics terms
  const translations: Record<string, string> = {
    // Economics basics
    'supply': 'Angebot',
    'demand': 'Nachfrage',
    'price': 'Preis',
    'quantity': 'Menge',
    'market': 'Markt',
    'equilibrium': 'Gleichgewicht',
    
    // Course structure
    'lecture': 'Vorlesung',
    'problem set': 'Übungsblatt',
    'solution': 'Lösung',
    'exercise': 'Übung',
    'assignment': 'Aufgabe',
    
    // Concepts
    'elasticity': 'Elastizität',
    'utility': 'Nutzen',
    'profit': 'Gewinn',
    'cost': 'Kosten',
    'revenue': 'Erlös',
    'consumer': 'Konsument',
    'producer': 'Produzent'
  };

  let translated = text;
  for (const [en, de] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, (match) => {
      // Preserve case: if original is all caps (for multi-letter words), make translation all caps
      const isAllCaps =
        match.length > 1 &&
        match === match.toUpperCase() &&
        match !== match.toLowerCase();
      if (isAllCaps) {
        return de.toUpperCase();
      }
      // If original is title case, make translation title case
      if (match[0] === match[0].toUpperCase()) {
        return de.charAt(0).toUpperCase() + de.slice(1);
      }
      // Otherwise use lowercase
      return de.toLowerCase();
    });
  }

  return translated;
}

/**
 * Extract lecture number from filename or path
 */
export function extractLectureNumber(filePath: string): number | null {
  const match = filePath.match(/lecture[_-]?(\d+)|(\d+)[_-]?lecture/i);
  if (match) {
    return parseInt(match[1] || match[2], 10);
  }
  return null;
}

/**
 * Generate a safe filename from a title
 */
export function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    // Replace any sequence of disallowed characters with a single underscore,
    // but preserve existing hyphens and underscores.
    .replace(/[^a-z0-9_-]+/g, '_')
    // Collapse multiple underscores into a single underscore.
    .replace(/_{2,}/g, '_')
    // Trim leading and trailing underscores or hyphens.
    .replace(/^[_-]+|[_-]+$/g, '');
}
