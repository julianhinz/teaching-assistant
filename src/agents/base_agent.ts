/**
 * Base agent class with common functionality
 */

import Anthropic from '@anthropic-ai/sdk';
import { SubAgentResult } from '../types/index.js';
import { FileSystemTools } from '../tools/fs_tools.js';
import { CourseState } from '../state/course_state.js';
import { DEFAULT_MODEL, DEFAULT_MAX_TOKENS } from '../utils/constants.js';

export interface AgentConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export abstract class BaseAgent {
  protected client: Anthropic;
  protected model: string;
  protected maxTokens: number;
  protected fs: FileSystemTools;
  protected courseState: CourseState;

  constructor(
    config: AgentConfig,
    fs: FileSystemTools,
    courseState: CourseState
  ) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || DEFAULT_MODEL;
    this.maxTokens = config.maxTokens || DEFAULT_MAX_TOKENS;
    this.fs = fs;
    this.courseState = courseState;
  }

  /**
   * Abstract method - each agent implements its own system prompt
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Abstract method - each agent implements its own task execution
   */
  abstract execute(task: string, context?: string): Promise<SubAgentResult>;

  /**
   * Helper to call Claude API
   */
  protected async callClaude(
    userMessage: string,
    systemPrompt?: string
  ): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt || this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      return textContent.text;
    } catch (error: any) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult(
    agentType: string,
    output: string,
    files: string[] = []
  ): SubAgentResult {
    return {
      agentType,
      success: true,
      output,
      files
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    agentType: string,
    errorMessage: string
  ): SubAgentResult {
    return {
      agentType,
      success: false,
      output: '',
      errors: [errorMessage]
    };
  }
}
