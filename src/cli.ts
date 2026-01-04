#!/usr/bin/env node
/**
 * CLI entry point for Economics Teaching Assistant
 */

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';
import { MasterTA } from './agents/master.js';
import { FileSystemTools } from './tools/fs_tools.js';
import { CourseState } from './state/course_state.js';
import { Language } from './types/index.js';
import { DEFAULT_MODEL, DEFAULT_MAX_TOKENS, OPENROUTER_BASE_URL } from './utils/constants.js';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('economics-ta')
  .description('Multi-agent Economics Teaching Assistant CLI')
  .version('0.1.0');

program
  .command('run')
  .description('Run a teaching assistant task')
  .requiredOption('--task <text>', 'Task description')
  .option('--lang <language>', 'Language (en|de)', 'en')
  .option('--course <name>', 'Course name', 'Economics Course')
  .option('--path <directory>', 'Materials directory path', './course_materials')
  .option('--context <text>', 'Additional context for the task')
  .option('--state <file>', 'Path to course state JSON file')
  .option('--model <model>', 'Model to use (e.g., anthropic/claude-4.5-opus for OpenRouter)', DEFAULT_MODEL)
  .action(async (options) => {
    try {
      // Validate language
      const lang = options.lang as Language;
      if (lang !== 'en' && lang !== 'de') {
        console.error('Error: Language must be "en" or "de"');
        process.exit(1);
      }

      // Determine API configuration based on model
      const model = options.model;
      const isOpenRouter = model.includes('/');
      
      let apiKey: string | undefined;
      let baseURL: string | undefined;
      
      if (isOpenRouter) {
        apiKey = process.env.OPENROUTER_API_KEY;
        baseURL = OPENROUTER_BASE_URL;
        if (!apiKey) {
          console.error('Error: OPENROUTER_API_KEY environment variable not set');
          console.error('OpenRouter API key is required for models like "anthropic/claude-4.5-opus"');
          console.error('Please create a .env file with your API key or export it');
          process.exit(1);
        }
      } else {
        apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          console.error('Error: ANTHROPIC_API_KEY environment variable not set');
          console.error('Please create a .env file with your API key or export it');
          process.exit(1);
        }
      }

      // Setup filesystem tools
      const materialsPath = path.resolve(options.path);
      const fsTools = new FileSystemTools(materialsPath);
      
      // Ensure materials directory exists
      await fs.mkdir(materialsPath, { recursive: true });

      // Load or create course state
      let courseState: CourseState;
      
      if (options.state) {
        try {
          const stateJson = await fs.readFile(options.state, 'utf-8');
          courseState = CourseState.fromJSON(stateJson);
          console.log(`Loaded course state from ${options.state}`);
        } catch (error) {
          console.warn(`Could not load state file, creating new state: ${error}`);
          courseState = new CourseState(options.course, lang);
        }
      } else {
        courseState = new CourseState(options.course, lang);
      }

      console.log('\n╔════════════════════════════════════════════════════╗');
      console.log('║    Economics Teaching Assistant                   ║');
      console.log('╚════════════════════════════════════════════════════╝\n');

      // Initialize Master TA
      const masterTA = new MasterTA(
        {
          apiKey,
          model,
          maxTokens: DEFAULT_MAX_TOKENS,
          baseURL
        },
        fsTools,
        courseState
      );

      // Execute task
      console.log('Starting task execution...\n');
      const result = await masterTA.executeWithMetadata(options.task, options.context);

      // Display results
      console.log('\n' + '='.repeat(60));
      console.log('TASK COMPLETED');
      console.log('='.repeat(60) + '\n');

      console.log(result.output);

      // Save updated course state if state file was specified
      if (options.state) {
        const stateJson = courseState.toJSON();
        await fs.writeFile(options.state, stateJson, 'utf-8');
        console.log(`\nCourse state saved to ${options.state}`);
      }

      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);

    } catch (error: any) {
      console.error('\nFatal error:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new course')
  .requiredOption('--course <name>', 'Course name')
  .option('--lang <language>', 'Language (en|de)', 'en')
  .option('--path <directory>', 'Materials directory path', './course_materials')
  .option('--state <file>', 'Path to save course state', './course_state.json')
  .action(async (options) => {
    try {
      const lang = options.lang as Language;
      if (lang !== 'en' && lang !== 'de') {
        console.error('Error: Language must be "en" or "de"');
        process.exit(1);
      }

      // Create course state
      const courseState = new CourseState(options.course, lang);

      // Create materials directory
      const materialsPath = path.resolve(options.path);
      await fs.mkdir(materialsPath, { recursive: true });

      // Save state
      const stateJson = courseState.toJSON();
      await fs.writeFile(options.state, stateJson, 'utf-8');

      console.log('✓ Course initialized successfully');
      console.log(`  Course: ${options.course}`);
      console.log(`  Language: ${lang}`);
      console.log(`  Materials: ${materialsPath}`);
      console.log(`  State: ${options.state}`);

    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
