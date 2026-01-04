/**
 * Global constants for the Economics Teaching Assistant
 */

// Default Claude model configuration (for OpenRouter or direct Anthropic API)
export const DEFAULT_MODEL = 'anthropic/claude-4.5-opus';
export const DEFAULT_MAX_TOKENS = 4096;

// OpenRouter API configuration
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Known OpenRouter provider prefixes (models in format 'provider/model-name')
export const OPENROUTER_PROVIDERS = [
  'anthropic',
  'openai',
  'google',
  'meta-llama',
  'mistralai',
  'cohere',
  'perplexity',
  'deepseek',
  'qwen'
];

// Text truncation limits
export const MAX_FILENAME_PREFIX_LENGTH = 30;
export const MAX_TASK_DESCRIPTION_LENGTH = 60;
