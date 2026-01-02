/**
 * Core type definitions for the Economics Teaching Assistant
 */

export type Language = 'en' | 'de';

export type TaskType = 'latex' | 'problemset' | 'research' | 'rcode' | 'mixed';

export interface TaskRequest {
  task: string;
  lang: Language;
  course: string;
  materialsPath: string;
  context?: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  name: string;
  input: Record<string, any>;
  output?: any;
}

export interface SubAgentResult {
  agentType: string;
  success: boolean;
  output: string;
  files?: string[];
  errors?: string[];
}

export interface VerificationResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

export interface ChangeLogEntry {
  timestamp: string;
  agent: string;
  action: string;
  files: string[];
  description: string;
}
