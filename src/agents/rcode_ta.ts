/**
 * R Code TA - R script generation and debugging
 */

import { BaseAgent } from './base_agent.js';
import { SubAgentResult } from '../types/index.js';
import { RTools } from '../tools/r_tools.js';
import { sanitizeFilename } from '../utils/helpers.js';
import { MAX_FILENAME_PREFIX_LENGTH } from '../utils/constants.js';

export class RCodeTA extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are an expert R programming assistant for economics education.

Your responsibilities:
1. Write clean, well-documented R scripts for economics exercises
2. Debug R code and fix errors
3. Create data analysis and visualization scripts
4. Ensure minimal dependencies
5. Include comprehensive comments

R coding guidelines:
- Use <- for assignment (R convention)
- Comment every major step
- Use meaningful variable names
- Minimize package dependencies
- Prefer base R when possible
- Include error handling
- Add example usage

Documentation standards:
- Header comment with description, author, date
- Section comments for major blocks
- Inline comments for complex operations
- Output descriptions
- Required packages listed at top

Script structure:
1. Header with metadata
2. Package loading
3. Data loading/generation
4. Analysis/computation
5. Visualization (if applicable)
6. Output/export

Best practices:
- Set reproducible random seeds
- Validate inputs
- Handle edge cases
- Clear variable names
- Modular functions
- Commented examples`;
  }

  async execute(task: string, context?: string): Promise<SubAgentResult> {
    try {
      console.log('[RCodeTA] Writing R script...');

      let prompt = `Task: ${task}\n\n`;
      
      if (context) {
        prompt += `Additional context: ${context}\n\n`;
      }

      prompt += `Course: ${this.courseState.courseName}\n`;
      prompt += `Language: ${this.courseState.language}\n\n`;

      // Check if debugging existing code
      const fileMatch = task.match(/(?:file|script):\s*([^\s,]+\.R)/i);
      if (fileMatch) {
        const filePath = fileMatch[1];
        try {
          const content = await this.fs.readFile(filePath);
          prompt += `\nCurrent R script (${filePath}):\n\`\`\`r\n${content}\n\`\`\`\n\n`;
          
          // Run syntax checks
          const issues = RTools.checkSyntax(content);
          if (issues.length > 0) {
            prompt += `\nSyntax analysis found ${issues.length} issue(s):\n`;
            issues.forEach(issue => {
              prompt += `  [${issue.type.toUpperCase()}${issue.line ? ` Line ${issue.line}` : ''}] ${issue.message}\n`;
            });
            prompt += '\n';
          }

          // Check dependencies
          const depCheck = RTools.checkDependencies(content);
          if (depCheck.packages.length > 0) {
            prompt += `\nRequired packages: ${depCheck.packages.join(', ')}\n`;
            if (depCheck.suggestions.length > 0) {
              prompt += `Suggestions:\n`;
              depCheck.suggestions.forEach(s => prompt += `  - ${s}\n`);
            }
            prompt += '\n';
          }
        } catch (error: any) {
          prompt += `\nNote: Could not read file ${filePath}: ${error.message}\n\n`;
        }
      }

      prompt += `Requirements:
- Write clean, well-commented R code
- Use minimal dependencies (prefer base R)
- Include example usage
- Add error handling
- Make it educational (students will read this)

Provide the R script in a code block with filename.`;

      // Call Claude
      const response = await this.callClaude(prompt);

      // Extract and save files
      const files = await this.extractAndSaveFiles(response, task);

      return this.createSuccessResult('RCodeTA', response, files);

    } catch (error: any) {
      return this.createErrorResult('RCodeTA', error.message);
    }
  }

  /**
   * Extract and save R scripts
   */
  private async extractAndSaveFiles(response: string, task: string): Promise<string[]> {
    const savedFiles: string[] = [];
    
    // Match R code blocks
    const fileBlockRegex = /```(?:r|R)(?::|\s+)?([^\n]+)?\n([\s\S]*?)```/g;
    
    let match;
    let scriptNumber = 1;
    while ((match = fileBlockRegex.exec(response)) !== null) {
      let filename = match[1]?.trim();
      const content = match[2];
      
      // Generate filename if not provided
      if (!filename || !filename.endsWith('.R')) {
        const topic = sanitizeFilename(task.substring(0, MAX_FILENAME_PREFIX_LENGTH));
        filename = `script_${topic}_${scriptNumber}.R`;
      }
      
      try {
        // Add documentation header if not present
        const documented = content.includes('#\'') ? content : RTools.addDocumentation(content, task);
        
        await this.fs.writeFile(filename, documented);
        savedFiles.push(filename);
        console.log(`[RCodeTA] Saved R script: ${filename}`);
        
        // Run syntax check on saved file
        const issues = RTools.checkSyntax(documented);
        if (issues.length > 0) {
          console.warn(`[RCodeTA] Syntax issues in ${filename}:`);
          issues.forEach(issue => {
            console.warn(`  [${issue.type}${issue.line ? ` Line ${issue.line}` : ''}] ${issue.message}`);
          });
        }
      } catch (error: any) {
        console.error(`[RCodeTA] Failed to save ${filename}: ${error.message}`);
      }
      
      scriptNumber++;
    }

    return savedFiles;
  }
}
