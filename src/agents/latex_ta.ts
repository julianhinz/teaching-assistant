/**
 * LaTeX TA - Specialized agent for LaTeX slides and documents
 */

import { BaseAgent } from './base_agent.js';
import { SubAgentResult } from '../types/index.js';
import { LaTeXTools } from '../tools/latex_tools.js';
import { extractLectureNumber } from '../utils/helpers.js';

export class LatexTA extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are an expert LaTeX teaching assistant specializing in economics course materials.

Your responsibilities:
1. Polish and refactor LaTeX slides for clarity and consistency
2. Fix common LaTeX errors (mismatched braces, unclosed environments, etc.)
3. Ensure consistent macro usage across lectures
4. Improve formatting and structure
5. Check for best practices in Beamer presentations

Guidelines:
- Use consistent notation (check the course notation registry)
- Follow economics LaTeX conventions
- Ensure mathematical expressions are properly formatted
- Use \\newcommand for repeated expressions
- Keep code clean and well-commented
- Use semantic commands (e.g., \\emph instead of \\textit)

When working with files:
- Read existing files to understand context
- Make minimal, focused changes
- Preserve the author's intent and structure
- Document changes clearly

Output format:
- Provide the corrected/improved LaTeX code
- List all changes made
- Highlight any issues that need manual review
- Suggest macro definitions for repeated content`;
  }

  async execute(task: string, context?: string): Promise<SubAgentResult> {
    try {
      console.log('[LatexTA] Processing task...');

      // Build the prompt with context
      let prompt = `Task: ${task}\n\n`;
      
      if (context) {
        prompt += `Additional context: ${context}\n\n`;
      }

      // Add course state context
      const notationInfo = this.courseState.notationRegistry.length > 0
        ? `Notation registry (${this.courseState.notationRegistry.length} entries):\n` +
          this.courseState.notationRegistry.map(n => 
            `  ${n.symbol}: ${n.meaning} (introduced in lecture ${n.introducedIn})`
          ).join('\n')
        : 'No notation registry available yet.';

      prompt += `\nCourse: ${this.courseState.courseName}\n`;
      prompt += `Language: ${this.courseState.language}\n`;
      prompt += `\n${notationInfo}\n\n`;

      // Check if task mentions a specific file
      const fileMatch = task.match(/(?:file|lecture|slides?):\s*([^\s,]+)/i);
      if (fileMatch) {
        const filePath = fileMatch[1];
        try {
          const content = await this.fs.readFile(filePath);
          prompt += `\nCurrent file content (${filePath}):\n\`\`\`latex\n${content}\n\`\`\`\n\n`;
          
          // Run static checks
          const issues = LaTeXTools.checkSyntax(content);
          if (issues.length > 0) {
            prompt += `\nStatic analysis found ${issues.length} issue(s):\n`;
            issues.forEach(issue => {
              prompt += `  [${issue.type.toUpperCase()}${issue.line ? ` Line ${issue.line}` : ''}] ${issue.message}\n`;
            });
            prompt += '\n';
          }

          // Extract macros
          const macros = LaTeXTools.extractMacros(content);
          if (macros.size > 0) {
            prompt += `\nDefined macros:\n`;
            macros.forEach((def, name) => {
              prompt += `  \\${name} = ${def}\n`;
            });
            prompt += '\n';
          }
        } catch (error: any) {
          prompt += `\nNote: Could not read file ${filePath}: ${error.message}\n\n`;
        }
      }

      prompt += `\nPlease complete the task. If you need to modify files, provide the complete updated content in a clearly marked code block with the filename.`;

      // Call Claude
      const response = await this.callClaude(prompt);

      // Extract file updates from response
      const files = await this.extractAndSaveFiles(response);

      // Update course state if lecture number detected
      if (fileMatch) {
        const lectureNum = extractLectureNumber(fileMatch[1]);
        if (lectureNum) {
          // TODO: Extract and update notation/assumptions from the LaTeX content
          console.log(`[LatexTA] Updated lecture ${lectureNum}`);
        }
      }

      return this.createSuccessResult('LatexTA', response, files);

    } catch (error: any) {
      return this.createErrorResult('LatexTA', error.message);
    }
  }

  /**
   * Extract file content from markdown code blocks and save them
   */
  private async extractAndSaveFiles(response: string): Promise<string[]> {
    const savedFiles: string[] = [];
    
    // Match code blocks with filenames: ```latex:filename or ```tex:filename
    const fileBlockRegex = /```(?:latex|tex)(?::|\s+)([^\n]+)\n([\s\S]*?)```/g;
    
    let match;
    while ((match = fileBlockRegex.exec(response)) !== null) {
      const filename = match[1].trim();
      const content = match[2];
      
      try {
        await this.fs.writeFile(filename, content);
        savedFiles.push(filename);
        console.log(`[LatexTA] Saved file: ${filename}`);
      } catch (error: any) {
        console.error(`[LatexTA] Failed to save ${filename}: ${error.message}`);
      }
    }

    return savedFiles;
  }
}
