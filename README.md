# Economics Teaching Assistant

A multi-agent system for economics course development using the Claude Agent SDK. The system uses a Master TA orchestrator that coordinates specialized sub-TAs to handle various course development tasks.

## Architecture

The system follows the multi-agent pattern from the [Claude Agent SDK research-agent demo](https://github.com/anthropics/claude-agent-sdk-demos/tree/main/research-agent), adapted for economics course development.

### Agents

**MasterTA (Orchestrator)**
- Classifies incoming tasks
- Coordinates specialized sub-agents
- Enforces cross-lecture consistency
- Maintains notation registry and assumptions
- Verifies outputs and generates change logs

**Specialized Sub-Agents:**

1. **LatexTA**: Polish/refactor LaTeX slides, fix errors, ensure consistent macros
2. **ProblemSetTA**: Generate problem sets + solutions aligned with lecture objectives
3. **ResearchTA**: Literature background, summaries, BibTeX-ready citations
4. **RCodeTA**: Write/debug R scripts for exercises and data analysis

### Course State Management

The system maintains:
- **Syllabus**: Course outline and structure
- **Learning Objectives**: Mapped to lectures
- **Notation Registry**: Consistent mathematical notation across lectures
- **Assumptions**: Track when introduced and their validity range
- **Lecture Map**: Prerequisites, files, and metadata

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/julianhinz/teaching-assistant.git
cd teaching-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Anthropic API key:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

4. Build the project:
```bash
npm run build
```

## Usage

### Initialize a Course

Create a new course with state tracking:

```bash
node dist/cli.js init \
  --course "Intermediate Microeconomics" \
  --lang en \
  --path ./course_materials \
  --state ./course_state.json
```

### Run Tasks

Execute teaching assistant tasks:

```bash
node dist/cli.js run \
  --task "<task description>" \
  --course "Course Name" \
  --lang en|de \
  --path ./course_materials \
  [--context "additional context"] \
  [--state ./course_state.json] \
  [--model "anthropic/claude-4.5-opus"]
```

**Model Option:** The `--model` option allows you to specify which model to use. By default, it uses `anthropic/claude-4.5-opus` via OpenRouter. For OpenRouter models (format: `provider/model-name`), set the `OPENROUTER_API_KEY` environment variable. For direct Anthropic API models (format: `claude-*`), set the `ANTHROPIC_API_KEY` environment variable.

## Examples

### Example 1: Fix LaTeX Errors in Lecture Slides

```bash
node dist/cli.js run \
  --task "Fix lecture 3 slides LaTeX errors and unify notation" \
  --course "Intermediate Microeconomics" \
  --lang en \
  --path ./course_materials \
  --state ./course_state.json \
  --context "file: lecture3_monopoly.tex"
```

### Example 2: Create Problem Set for Lecture

```bash
node dist/cli.js run \
  --task "Create problem set for lecture 5 with solutions" \
  --course "Intermediate Microeconomics" \
  --lang en \
  --path ./course_materials \
  --state ./course_state.json \
  --context "Lecture 5 covers game theory basics and Nash equilibrium"
```

### Example 3: Research Topic and Generate Citations

```bash
node dist/cli.js run \
  --task "Research behavioral economics and prospect theory, generate bibtex entries" \
  --course "Behavioral Economics" \
  --lang en \
  --path ./course_materials \
  --state ./course_state.json
```

## Project Structure

```
teaching-assistant/
├── src/
│   ├── agents/
│   │   ├── base_agent.ts       # Base class for all agents
│   │   ├── master.ts            # MasterTA orchestrator
│   │   ├── latex_ta.ts          # LaTeX specialist
│   │   ├── problemset_ta.ts     # Problem set generator
│   │   ├── research_ta.ts       # Literature research
│   │   └── rcode_ta.ts          # R code specialist
│   ├── state/
│   │   └── course_state.ts      # Course state management
│   ├── tools/
│   │   ├── fs_tools.ts          # Sandboxed file operations
│   │   ├── latex_tools.ts       # LaTeX syntax checking
│   │   └── r_tools.ts           # R syntax checking
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── helpers.ts           # Utility functions
│   └── cli.ts                   # CLI entry point
├── course_materials/            # Generated course files (gitignored)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Features

- **Multi-Agent Orchestration**: MasterTA coordinates specialized sub-agents
- **Cross-Lecture Consistency**: Notation registry, assumption tracking, prerequisite mapping
- **Language Support**: English and German
- **Change Logging**: Detailed audit trail of all modifications
- **Verification Checklist**: Automated quality checks

## Development

Build: `npm run build`  
Clean: `npm run clean`

## License

MIT