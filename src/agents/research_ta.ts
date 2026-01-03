/**
 * Research TA - Literature research and citation generation
 */

import { BaseAgent } from './base_agent.js';
import { SubAgentResult } from '../types/index.js';
import { sanitizeFilename } from '../utils/helpers.js';
import { MAX_FILENAME_PREFIX_LENGTH } from '../utils/constants.js';

export class ResearchTA extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are an expert economics research assistant.

Your responsibilities:
1. Research economics literature on specified topics
2. Provide concise summaries of key papers and findings
3. Generate BibTeX citations
4. Identify seminal works and recent developments
5. Suggest relevant datasets and empirical evidence

Research approach:
- Focus on peer-reviewed economics journals
- Include classic foundational papers
- Add recent developments (last 5 years)
- Cover theoretical and empirical work
- Note methodology and key findings

Citation guidelines:
- Provide complete BibTeX entries
- Use consistent citation keys
- Include DOI when available
- Categorize by type (theory, empirical, survey)

Summary format:
- Brief (2-3 sentences) for each paper
- Highlight relevance to the topic
- Note key contributions
- Mention limitations or controversies

Output:
- Research summary document
- BibTeX file with all citations
- Suggested reading list (ordered by importance)`;
  }

  async execute(task: string, context?: string): Promise<SubAgentResult> {
    try {
      console.log('[ResearchTA] Conducting literature research...');

      let prompt = `Task: ${task}\n\n`;
      
      if (context) {
        prompt += `Additional context: ${context}\n\n`;
      }

      prompt += `Course: ${this.courseState.courseName}\n`;
      prompt += `Language: ${this.courseState.language}\n\n`;

      prompt += `Please provide:
1. A concise research summary covering:
   - Key theoretical frameworks
   - Important empirical findings
   - Recent developments
   - Recommended readings (5-10 papers)

2. Complete BibTeX entries for all cited works

3. Categorization:
   - Foundational/classic papers
   - Recent research (2019-2024)
   - Empirical studies
   - Theoretical contributions

Format the response with:
- Markdown summary with sections
- BibTeX code block with all citations
- Reading list ordered by priority`;

      // Call Claude
      const response = await this.callClaude(prompt);

      // Extract and save files
      const files = await this.extractAndSaveFiles(response, task);

      return this.createSuccessResult('ResearchTA', response, files);

    } catch (error: any) {
      return this.createErrorResult('ResearchTA', error.message);
    }
  }

  /**
   * Extract and save research files
   */
  private async extractAndSaveFiles(response: string, task: string): Promise<string[]> {
    const savedFiles: string[] = [];
    
    // Extract BibTeX content
    const bibtexMatch = response.match(/```(?:bibtex|bib)\n([\s\S]*?)```/);
    if (bibtexMatch) {
      const topic = sanitizeFilename(task.substring(0, MAX_FILENAME_PREFIX_LENGTH));
      const bibtexFile = `research_${topic}.bib`;
      
      try {
        await this.fs.writeFile(bibtexFile, bibtexMatch[1]);
        savedFiles.push(bibtexFile);
        console.log(`[ResearchTA] Saved BibTeX: ${bibtexFile}`);
      } catch (error: any) {
        console.error(`[ResearchTA] Failed to save BibTeX: ${error.message}`);
      }
    }

    // Save full research summary
    const topic = sanitizeFilename(task.substring(0, MAX_FILENAME_PREFIX_LENGTH));
    const summaryFile = `research_${topic}.md`;
    
    try {
      await this.fs.writeFile(summaryFile, response);
      savedFiles.push(summaryFile);
      console.log(`[ResearchTA] Saved summary: ${summaryFile}`);
    } catch (error: any) {
      console.error(`[ResearchTA] Failed to save summary: ${error.message}`);
    }

    return savedFiles;
  }
}
