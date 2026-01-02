/**
 * Master TA - Orchestrator agent that coordinates specialized sub-TAs
 */

import { BaseAgent, AgentConfig } from './base_agent.js';
import { LatexTA } from './latex_ta.js';
import { ProblemSetTA } from './problemset_ta.js';
import { ResearchTA } from './research_ta.js';
import { RCodeTA } from './rcode_ta.js';
import { SubAgentResult, TaskType, VerificationResult, ChangeLogEntry } from '../types/index.js';
import { FileSystemTools } from '../tools/fs_tools.js';
import { CourseState } from '../state/course_state.js';
import { classifyTask, createChangeLogEntry, formatChangeLog } from '../utils/helpers.js';

export interface MasterTAResult {
  success: boolean;
  output: string;
  changeLog: ChangeLogEntry[];
  verification: VerificationResult;
  files: string[];
}

export class MasterTA extends BaseAgent {
  private latexTA: LatexTA;
  private problemSetTA: ProblemSetTA;
  private researchTA: ResearchTA;
  private rcodeTA: RCodeTA;
  private changeLog: ChangeLogEntry[];

  constructor(
    config: AgentConfig,
    fs: FileSystemTools,
    courseState: CourseState
  ) {
    super(config, fs, courseState);
    
    // Initialize sub-agents
    this.latexTA = new LatexTA(config, fs, courseState);
    this.problemSetTA = new ProblemSetTA(config, fs, courseState);
    this.researchTA = new ResearchTA(config, fs, courseState);
    this.rcodeTA = new RCodeTA(config, fs, courseState);
    this.changeLog = [];
  }

  protected getSystemPrompt(): string {
    return `You are the Master Economics Teaching Assistant orchestrator.

Your role:
1. Analyze faculty requests for course development tasks
2. Classify tasks and determine which specialized sub-agents to use
3. Coordinate multiple sub-agents for complex tasks
4. Ensure consistency across lectures (notation, assumptions, progression)
5. Verify outputs meet quality standards
6. Generate comprehensive change logs

Available sub-agents:
- LatexTA: Polish/refactor LaTeX slides, fix errors, ensure consistent macros
- ProblemSetTA: Generate problem sets + solutions aligned with objectives
- ResearchTA: Literature research, summaries, BibTeX citations
- RCodeTA: Write/debug R scripts for exercises and data analysis

Orchestration strategy:
1. PLAN: Classify task, identify required sub-agents, determine order
2. DELEGATE: Spawn appropriate sub-agents with clear instructions
3. INTEGRATE: Combine outputs, normalize style/language, update course state
4. VERIFY: Check compilation, notation consistency, prerequisites

If crucial context is missing, ask 1-3 targeted questions. Otherwise, proceed with sensible defaults.`;
  }

  /**
   * Main execution method - implements plan-delegate-integrate-verify loop
   */
  async execute(task: string, context?: string): Promise<SubAgentResult> {
    console.log('\n=== Master TA: Starting Task ===');
    console.log(`Task: ${task}`);
    console.log(`Course: ${this.courseState.courseName}`);
    console.log(`Language: ${this.courseState.language}`);
    
    try {
      // STEP 1: PLAN - Classify task and create execution plan
      const plan = await this.createPlan(task, context);
      console.log(`\n[PLAN] Task type: ${plan.taskType}`);
      console.log(`[PLAN] Sub-agents needed: ${plan.agents.join(', ')}`);

      // STEP 2: DELEGATE - Execute sub-agents
      const results = await this.delegateToAgents(plan, task, context);

      // STEP 3: INTEGRATE - Combine results and update state
      const integrated = await this.integrateResults(results, task);

      // STEP 4: VERIFY - Run verification checklist
      const verification = await this.verify(integrated);

      // Generate final output
      const output = this.generateFinalOutput(integrated, verification);

      return {
        agentType: 'MasterTA',
        success: verification.passed,
        output,
        files: integrated.files
      };

    } catch (error: any) {
      console.error(`\n[ERROR] Master TA failed: ${error.message}`);
      return {
        agentType: 'MasterTA',
        success: false,
        output: `Error: ${error.message}`,
        files: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Get full results with additional metadata
   */
  async executeWithMetadata(task: string, context?: string): Promise<MasterTAResult> {
    const result = await this.execute(task, context);
    const verification = await this.getLastVerification();
    
    return {
      success: result.success,
      output: result.output,
      changeLog: this.changeLog,
      verification,
      files: result.files || []
    };
  }

  private lastVerification: VerificationResult = { passed: true, issues: [], warnings: [] };

  private async getLastVerification(): Promise<VerificationResult> {
    return this.lastVerification;
  }

  /**
   * Create execution plan based on task analysis
   */
  private async createPlan(task: string, context?: string): Promise<{
    taskType: TaskType;
    agents: string[];
    parallel: boolean;
  }> {
    const taskType = classifyTask(task);
    const agents: string[] = [];
    let parallel = false;

    switch (taskType) {
      case 'latex':
        agents.push('LatexTA');
        break;
      case 'problemset':
        agents.push('ProblemSetTA');
        break;
      case 'research':
        agents.push('ResearchTA');
        break;
      case 'rcode':
        agents.push('RCodeTA');
        break;
      case 'mixed':
        // Analyze which agents are needed
        const lower = task.toLowerCase();
        if (lower.includes('latex') || lower.includes('slide')) agents.push('LatexTA');
        if (lower.includes('problem') || lower.includes('exercise')) agents.push('ProblemSetTA');
        if (lower.includes('research') || lower.includes('literature')) agents.push('ResearchTA');
        if (lower.includes('r code') || lower.includes('script')) agents.push('RCodeTA');
        
        // Default to all agents if still unclear
        if (agents.length === 0) {
          agents.push('ProblemSetTA', 'LatexTA');
        }
        
        // Can run research and code in parallel with others
        parallel = agents.length > 1;
        break;
    }

    return { taskType, agents, parallel };
  }

  /**
   * Delegate to appropriate sub-agents
   */
  private async delegateToAgents(
    plan: { taskType: TaskType; agents: string[]; parallel: boolean },
    task: string,
    context?: string
  ): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = [];

    console.log(`\n[DELEGATE] Executing ${plan.agents.length} sub-agent(s)${plan.parallel ? ' in parallel' : ' sequentially'}...`);

    if (plan.parallel) {
      // Execute in parallel
      const promises = plan.agents.map(async (agentName) => {
        return await this.executeSubAgent(agentName, task, context);
      });
      
      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);
    } else {
      // Execute sequentially
      for (const agentName of plan.agents) {
        const result = await this.executeSubAgent(agentName, task, context);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Execute a specific sub-agent
   */
  private async executeSubAgent(
    agentName: string,
    task: string,
    context?: string
  ): Promise<SubAgentResult> {
    console.log(`\n[${agentName}] Starting...`);
    
    let result: SubAgentResult;
    
    switch (agentName) {
      case 'LatexTA':
        result = await this.latexTA.execute(task, context);
        break;
      case 'ProblemSetTA':
        result = await this.problemSetTA.execute(task, context);
        break;
      case 'ResearchTA':
        result = await this.researchTA.execute(task, context);
        break;
      case 'RCodeTA':
        result = await this.rcodeTA.execute(task, context);
        break;
      default:
        throw new Error(`Unknown agent: ${agentName}`);
    }

    // Log result
    if (result.success) {
      console.log(`[${agentName}] ✓ Completed successfully`);
      if (result.files && result.files.length > 0) {
        console.log(`[${agentName}] Generated ${result.files.length} file(s): ${result.files.join(', ')}`);
      }
      
      // Add to change log
      this.changeLog.push(createChangeLogEntry(
        agentName,
        'execute',
        result.files || [],
        `Completed task: ${task.substring(0, 60)}${task.length > 60 ? '...' : ''}`
      ));
    } else {
      console.error(`[${agentName}] ✗ Failed: ${result.errors?.join(', ')}`);
    }

    return result;
  }

  /**
   * Integrate results from multiple sub-agents
   */
  private async integrateResults(
    results: SubAgentResult[],
    originalTask: string
  ): Promise<{ output: string; files: string[] }> {
    console.log('\n[INTEGRATE] Combining results...');

    let combinedOutput = `# Task Results\n\n`;
    combinedOutput += `**Original Task:** ${originalTask}\n\n`;
    combinedOutput += `**Course:** ${this.courseState.courseName} (${this.courseState.language})\n\n`;

    const allFiles: string[] = [];

    for (const result of results) {
      combinedOutput += `## ${result.agentType}\n\n`;
      
      if (result.success) {
        combinedOutput += result.output + '\n\n';
        if (result.files) {
          allFiles.push(...result.files);
        }
      } else {
        combinedOutput += `**Errors:**\n`;
        result.errors?.forEach(err => {
          combinedOutput += `- ${err}\n`;
        });
        combinedOutput += '\n';
      }
    }

    // Update course state with any new notation or assumptions
    // (In a full implementation, this would parse the outputs)

    return { output: combinedOutput, files: allFiles };
  }

  /**
   * Verify outputs meet quality standards
   */
  private async verify(integrated: { output: string; files: string[] }): Promise<VerificationResult> {
    console.log('\n[VERIFY] Running verification checks...');

    const issues: string[] = [];
    const warnings: string[] = [];

    // Check notation consistency
    const notationCheck = this.courseState.verifyNotationConsistency();
    if (!notationCheck.consistent) {
      issues.push(...notationCheck.conflicts);
    }

    // Check if files were generated
    if (integrated.files.length === 0) {
      warnings.push('No files were generated');
    }

    // Verify files exist
    for (const file of integrated.files) {
      const exists = await this.fs.exists(file);
      if (!exists) {
        issues.push(`File not found: ${file}`);
      }
    }

    const passed = issues.length === 0;
    
    console.log(`[VERIFY] Result: ${passed ? '✓ PASSED' : '✗ FAILED'}`);
    if (issues.length > 0) {
      console.log(`[VERIFY] Issues: ${issues.length}`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    if (warnings.length > 0) {
      console.log(`[VERIFY] Warnings: ${warnings.length}`);
      warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    // Store for later retrieval
    this.lastVerification = { passed, issues, warnings };

    return this.lastVerification;
  }

  /**
   * Generate final consolidated output
   */
  private generateFinalOutput(
    integrated: { output: string; files: string[] },
    verification: VerificationResult
  ): string {
    let output = integrated.output;

    output += `\n## Verification\n\n`;
    output += `**Status:** ${verification.passed ? '✓ PASSED' : '✗ FAILED'}\n\n`;

    if (verification.issues.length > 0) {
      output += `**Issues:**\n`;
      verification.issues.forEach(issue => {
        output += `- ${issue}\n`;
      });
      output += '\n';
    }

    if (verification.warnings.length > 0) {
      output += `**Warnings:**\n`;
      verification.warnings.forEach(warn => {
        output += `- ${warn}\n`;
      });
      output += '\n';
    }

    output += `\n## Files Generated\n\n`;
    if (integrated.files.length > 0) {
      integrated.files.forEach(file => {
        output += `- ${file}\n`;
      });
    } else {
      output += `*No files generated*\n`;
    }

    output += `\n## Change Log\n\n`;
    output += formatChangeLog(this.changeLog);

    return output;
  }
}
