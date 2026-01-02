/**
 * Course state management - maintains syllabus, notation registry,
 * assumptions, and lecture progression for consistency
 */

import { Language } from '../types/index.js';

export interface LearningObjective {
  id: string;
  description: string;
  level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  lectureNumber?: number;
}

export interface NotationEntry {
  symbol: string;
  meaning: string;
  introducedIn: number; // lecture number
  context?: string;
}

export interface Assumption {
  id: string;
  description: string;
  introducedIn: number;
  validFrom: number;
  validTo?: number; // undefined means still valid
}

export interface LectureMetadata {
  number: number;
  title: string;
  objectives: string[];
  prerequisites: string[];
  notationIntroduced: string[];
  assumptionsIntroduced: string[];
  files: string[];
}

export class CourseState {
  courseName: string;
  language: Language;
  syllabus: string;
  learningObjectives: LearningObjective[];
  notationRegistry: NotationEntry[];
  assumptions: Assumption[];
  lectures: Map<number, LectureMetadata>;
  
  constructor(courseName: string, language: Language = 'en') {
    this.courseName = courseName;
    this.language = language;
    this.syllabus = '';
    this.learningObjectives = [];
    this.notationRegistry = [];
    this.assumptions = [];
    this.lectures = new Map();
  }

  /**
   * Add or update a notation entry
   */
  registerNotation(symbol: string, meaning: string, lectureNumber: number, context?: string): void {
    const existing = this.notationRegistry.find(n => n.symbol === symbol);
    if (existing) {
      // Update existing notation
      existing.meaning = meaning;
      if (context) existing.context = context;
    } else {
      this.notationRegistry.push({
        symbol,
        meaning,
        introducedIn: lectureNumber,
        context
      });
    }
  }

  /**
   * Get all notation introduced up to a given lecture
   */
  getNotationUpToLecture(lectureNumber: number): NotationEntry[] {
    return this.notationRegistry.filter(n => n.introducedIn <= lectureNumber);
  }

  /**
   * Register an assumption for a lecture range
   */
  registerAssumption(
    description: string,
    introducedIn: number,
    validFrom: number,
    validTo?: number
  ): string {
    const id = `assumption_${this.assumptions.length + 1}`;
    this.assumptions.push({
      id,
      description,
      introducedIn,
      validFrom,
      validTo
    });
    return id;
  }

  /**
   * Get all active assumptions for a given lecture
   */
  getActiveAssumptions(lectureNumber: number): Assumption[] {
    return this.assumptions.filter(a => 
      a.validFrom <= lectureNumber && 
      (a.validTo === undefined || a.validTo >= lectureNumber)
    );
  }

  /**
   * Add or update lecture metadata
   */
  updateLecture(metadata: LectureMetadata): void {
    this.lectures.set(metadata.number, metadata);
  }

  /**
   * Get prerequisites for a lecture (all content from earlier lectures)
   */
  getPrerequisites(lectureNumber: number): string[] {
    const prereqs: string[] = [];
    
    // Collect objectives from earlier lectures
    for (let i = 1; i < lectureNumber; i++) {
      const lecture = this.lectures.get(i);
      if (lecture) {
        prereqs.push(...lecture.objectives);
      }
    }
    
    return prereqs;
  }

  /**
   * Verify notation consistency across lectures
   */
  verifyNotationConsistency(): { consistent: boolean; conflicts: string[] } {
    const conflicts: string[] = [];
    const symbolMap = new Map<string, NotationEntry[]>();
    
    // Group by symbol
    for (const entry of this.notationRegistry) {
      const entries = symbolMap.get(entry.symbol) || [];
      entries.push(entry);
      symbolMap.set(entry.symbol, entries);
    }
    
    // Check for conflicting meanings
    for (const [symbol, entries] of symbolMap.entries()) {
      const meanings = new Set(entries.map(e => e.meaning));
      if (meanings.size > 1) {
        conflicts.push(
          `Symbol "${symbol}" has conflicting meanings: ${Array.from(meanings).join(', ')}`
        );
      }
    }
    
    return {
      consistent: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Export state to JSON for persistence
   */
  toJSON(): string {
    return JSON.stringify({
      courseName: this.courseName,
      language: this.language,
      syllabus: this.syllabus,
      learningObjectives: this.learningObjectives,
      notationRegistry: this.notationRegistry,
      assumptions: this.assumptions,
      lectures: Array.from(this.lectures.entries())
    }, null, 2);
  }

  /**
   * Load state from JSON
   */
  static fromJSON(json: string): CourseState {
    const data = JSON.parse(json);
    const state = new CourseState(data.courseName, data.language);
    state.syllabus = data.syllabus;
    state.learningObjectives = data.learningObjectives;
    state.notationRegistry = data.notationRegistry;
    state.assumptions = data.assumptions;
    state.lectures = new Map(data.lectures);
    return state;
  }
}
