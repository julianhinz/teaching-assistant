# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Anthropic API key

## Setup (5 minutes)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API key:**
   ```bash
   echo "ANTHROPIC_API_KEY=your-actual-api-key-here" > .env
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Example Workflow

### 1. Initialize a Course

```bash
node dist/cli.js init \
  --course "Intermediate Microeconomics" \
  --lang en \
  --path ./my_course \
  --state ./micro_state.json
```

### 2. Fix LaTeX Errors (Example Task)

First, create a sample LaTeX file with intentional errors:

```bash
mkdir -p my_course
cat > my_course/lecture3.tex << 'EOF'
\documentclass{beamer}
\begin{document}

\begin{frame}
\frametitle{Monopoly}

A monopoly maximizes profit where $MR = MC$.

The demand curve is:
$$P = 100 - Q$$

Cost function:
$C(Q) = 10Q$

% Missing \end{frame} - intentional error

\begin{frame}
\frametitle{Profit Maximization}

The monopolist sets quantity where:
\begin{equation
MR = MC  % Missing closing brace for equation environment - intentional error
\end{equation}

\end{frame}

\end{document}
EOF
```

Now run the TA to fix it:

```bash
node dist/cli.js run \
  --task "Fix LaTeX errors in lecture 3 and ensure consistent notation" \
  --course "Intermediate Microeconomics" \
  --lang en \
  --path ./my_course \
  --state ./micro_state.json \
  --context "file: lecture3.tex"
```

**Note:** This will call the Claude API and use your API credits.

### 3. Generate a Problem Set

```bash
node dist/cli.js run \
  --task "Create a problem set for lecture 3 on monopoly with 5 problems and solutions" \
  --course "Intermediate Microeconomics" \
  --lang en \
  --path ./my_course \
  --state ./micro_state.json \
  --context "Focus on profit maximization, price discrimination, and deadweight loss"
```

### 4. Research a Topic

```bash
node dist/cli.js run \
  --task "Research behavioral economics and provide BibTeX citations" \
  --course "Behavioral Economics" \
  --lang en \
  --path ./my_course
```

## Output

All commands will:
- Print detailed progress to console
- Generate files in the specified `--path` directory
- Update the course state (if `--state` is provided)
- Show a verification report
- Display a change log

## Troubleshooting

**Error: ANTHROPIC_API_KEY not found**
- Make sure you created `.env` file with your API key

**TypeScript errors during build**
- Run `npm install` again
- Make sure you're using Node.js 18 or higher: `node --version`

**CLI command not found**
- Make sure you built the project: `npm run build`
- Use the full path: `node dist/cli.js` instead of just `economics-ta`

## What's Next?

1. Review the generated files in your materials directory
2. Check the course state JSON to see tracked notation and assumptions
3. Iterate on tasks to refine materials
4. Use `--context` to provide additional guidance to agents

## Example: Complete Lecture Package

```bash
# One command for everything
node dist/cli.js run \
  --task "Create complete lecture 4 package: review slides for errors, generate 6-problem homework set with solutions, and create R code for Cournot duopoly simulation" \
  --course "Industrial Organization" \
  --lang en \
  --path ./io_course \
  --state ./io_state.json \
  --context "Lecture 4 covers oligopoly models - Cournot and Bertrand competition"
```

This will spawn multiple agents in parallel to handle all aspects of the task.
