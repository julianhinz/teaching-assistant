/**
 * Global constants for the Economics Teaching Assistant
 */

// Default Claude model configuration (for OpenRouter or direct Anthropic API)
export const DEFAULT_MODEL = 'anthropic/claude-4.5-opus';
export const DEFAULT_MAX_TOKENS = 4096;

// OpenRouter API configuration
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Text truncation limits
export const MAX_FILENAME_PREFIX_LENGTH = 30;
export const MAX_TASK_DESCRIPTION_LENGTH = 60;
