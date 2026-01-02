/**
 * Problem Set TA - Generates problem sets and solutions
 */

import { BaseAgent } from './base_agent.js';
import { SubAgentResult } from '../types/index.js';
import { extractLectureNumber, sanitizeFilename } from '../utils/helpers.js';

export class ProblemSetTA extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are an expert economics problem set creator and educator.

Your responsibilities:
1. Generate high-quality economics problems aligned with lecture objectives
2. Create detailed solutions with step-by-step explanations
3. Ensure problems build on prerequisites from earlier lectures
4. Vary difficulty levels appropriately
5. Include both computational and conceptual problems

Problem design principles:
- Start with clear problem statements
- Provide all necessary information
- Test understanding of key concepts
- Include real-world context when appropriate
- Progressive difficulty (warm-up → challenging)
- Mix problem types (calculation, graphical, theoretical)

Solution guidelines:
- Show all work step-by-step
- Explain economic reasoning, not just math
- Include graphs/diagrams where helpful
- Highlight common mistakes
- Provide intuition for answers

Format:
- Use LaTeX for mathematical expressions
- Clear section headers
- Numbered problems
- Separate solution documents
- Include point values`;
  }

  async execute(task: string, context?: string): Promise<SubAgentResult> {
    try {
      console.log('[ProblemSetTA] Generating problem set...');

      // Extract lecture number if mentioned
      const lectureNum = extractLectureNumber(task);
      
      // Build context-aware prompt
      let prompt = `Task: ${task}\n\n`;
      
      if (context) {
        prompt += `Additional context: ${context}\n\n`;
      }

      prompt += `Course: ${this.courseState.courseName}\n`;
      prompt += `Language: ${this.courseState.language}\n\n`;

      // Add lecture-specific context
      if (lectureNum) {
        const lecture = this.courseState.lectures.get(lectureNum);
        if (lecture) {
          prompt += `Lecture ${lectureNum}: ${lecture.title}\n`;
          prompt += `Learning objectives:\n`;
          lecture.objectives.forEach(obj => {
            prompt += `  - ${obj}\n`;
          });
          prompt += '\n';
        }

        // Get prerequisites
        const prereqs = this.courseState.getPrerequisites(lectureNum);
        if (prereqs.length > 0) {
          prompt += `Prerequisites (from earlier lectures):\n`;
          prereqs.forEach(prereq => {
            prompt += `  - ${prereq}\n`;
          });
          prompt += '\n';
        }

        // Get available notation
        const notation = this.courseState.getNotationUpToLecture(lectureNum);
        if (notation.length > 0) {
          prompt += `Available notation:\n`;
          notation.forEach(n => {
            prompt += `  ${n.symbol}: ${n.meaning}\n`;
          });
          prompt += '\n';
        }
      }

      prompt += `Please create a problem set with:
- 4-6 problems covering the key concepts
- Mix of difficulty levels (label as: Basic, Intermediate, Advanced)
- Both computational and conceptual questions
- Clear problem statements with all necessary information

Provide:
1. Problem set document (problems only)
2. Solutions document (with detailed step-by-step solutions)

Format each in a LaTeX-compatible markdown code block with filename.`;

      // Call Claude
      const response = await this.callClaude(prompt);

      // Extract and save files
      const files = await this.extractAndSaveFiles(response, lectureNum);

      return this.createSuccessResult('ProblemSetTA', response, files);

    } catch (error: any) {
      return this.createErrorResult('ProblemSetTA', error.message);
    }
  }

  /**
   * Extract and save problem set files
   */
  private async extractAndSaveFiles(response: string, lectureNum: number | null): Promise<string[]> {
    const savedFiles: string[] = [];
    
    // Match markdown or LaTeX code blocks with filenames
    const fileBlockRegex = /```(?:latex|tex|markdown)?(?::|\s+)?([^\n]+)?\n([\s\S]*?)```/g;
    
    let problemSetContent: string | null = null;
    let solutionsContent: string | null = null;
    
    let match;
    let blockIndex = 0;
    while ((match = fileBlockRegex.exec(response)) !== null) {
      const suggestedFilename = match[1]?.trim();
      const content = match[2];
      
      // Determine if this is problems or solutions
      const isProblems = content.toLowerCase().includes('problem set') || 
                        suggestedFilename?.toLowerCase().includes('problem');
      const isSolutions = content.toLowerCase().includes('solution') ||
                         suggestedFilename?.toLowerCase().includes('solution');
      
      if (isProblems && !problemSetContent) {
        problemSetContent = content;
      } else if (isSolutions && !solutionsContent) {
        solutionsContent = content;
      }
      
      blockIndex++;
    }

    // Generate filenames
    const lecturePrefix = lectureNum ? `lecture${lectureNum}_` : '';
    const baseName = sanitizeFilename(this.courseState.courseName || 'course');
    
    // Save problem set
    if (problemSetContent) {
      const problemsFile = `${lecturePrefix}problemset_${baseName}.tex`;
      try {
        await this.fs.writeFile(problemsFile, problemSetContent);
        savedFiles.push(problemsFile);
        console.log(`[ProblemSetTA] Saved problems: ${problemsFile}`);
      } catch (error: any) {
        console.error(`[ProblemSetTA] Failed to save problems: ${error.message}`);
      }
    }

    // Save solutions
    if (solutionsContent) {
      const solutionsFile = `${lecturePrefix}solutions_${baseName}.tex`;
      try {
        await this.fs.writeFile(solutionsFile, solutionsContent);
        savedFiles.push(solutionsFile);
        console.log(`[ProblemSetTA] Saved solutions: ${solutionsFile}`);
      } catch (error: any) {
        console.error(`[ProblemSetTA] Failed to save solutions: ${error.message}`);
      }
    }

    return savedFiles;
  }
}
