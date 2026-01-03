#!/bin/bash

# Demo script for Economics Teaching Assistant
# This demonstrates the key features without making actual API calls

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Economics Teaching Assistant - Demo                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if built
if [ ! -d "dist" ]; then
    echo "Building project..."
    npm run build
    echo ""
fi

# Example 1: Initialize a course
echo "═══ Example 1: Initialize a Course ═══"
echo ""
echo "Command:"
echo "  node dist/cli.js init \\"
echo "    --course \"Intermediate Microeconomics\" \\"
echo "    --lang en \\"
echo "    --path ./demo_course \\"
echo "    --state ./demo_state.json"
echo ""

node dist/cli.js init \
  --course "Intermediate Microeconomics" \
  --lang en \
  --path ./demo_course \
  --state ./demo_state.json

echo ""
echo "✓ Course state created at demo_state.json"
echo ""
cat demo_state.json
echo ""
echo ""

# Example 2: Show available commands
echo "═══ Example 2: Available Commands ═══"
echo ""
node dist/cli.js --help
echo ""
echo ""

echo "═══ Example 3: Run Command Options ═══"
echo ""
node dist/cli.js run --help
echo ""
echo ""

# Example 4: Show what a real task would look like (without API call)
echo "═══ Example 4: Task Command Structure ═══"
echo ""
echo "To fix LaTeX errors (requires ANTHROPIC_API_KEY):"
echo ""
echo "  node dist/cli.js run \\"
echo "    --task \"Fix lecture 3 slides LaTeX errors and unify notation\" \\"
echo "    --course \"Intermediate Microeconomics\" \\"
echo "    --lang en \\"
echo "    --path ./demo_course \\"
echo "    --state ./demo_state.json \\"
echo "    --context \"file: lecture3_monopoly.tex\""
echo ""
echo "What would happen:"
echo "  1. MasterTA classifies task as 'latex'"
echo "  2. Spawns LatexTA sub-agent"
echo "  3. LatexTA reads file and runs syntax checks"
echo "  4. Fixes errors and unifies notation"
echo "  5. Updates notation registry in course state"
echo "  6. Generates change log"
echo ""
echo ""

echo "═══ Example 5: Mixed Task ═══"
echo ""
echo "To create a complete lecture package:"
echo ""
echo "  node dist/cli.js run \\"
echo "    --task \"Create lecture 5 materials: polish slides, generate 5-problem homework with solutions, and create R code for game theory simulation\" \\"
echo "    --course \"Intermediate Microeconomics\" \\"
echo "    --lang en \\"
echo "    --path ./demo_course \\"
echo "    --state ./demo_state.json"
echo ""
echo "What would happen:"
echo "  1. MasterTA classifies as 'mixed' task"
echo "  2. Spawns 3 agents in parallel:"
echo "     - LatexTA for slide polishing"
echo "     - ProblemSetTA for homework generation"
echo "     - RCodeTA for R simulation"
echo "  3. Integrates all outputs"
echo "  4. Verifies consistency"
echo "  5. Updates course state"
echo ""
echo ""

# Example 6: Project structure
echo "═══ Example 6: Project Structure ═══"
echo ""
if command -v tree >/dev/null 2>&1; then
    tree -L 2 -I 'node_modules|dist'
else
    echo "(Note: 'tree' command not found; showing a simplified view with 'find'.)"
    echo "       You can usually install 'tree' via your package manager, e.g."
    echo "       'sudo apt-get install tree' or 'brew install tree'.)"
    find . -type d -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.git/*' | head -20
fi
echo ""
echo ""

# Cleanup
echo "═══ Cleaning Up Demo Files ═══"
rm -rf demo_course demo_state.json
echo "✓ Demo files cleaned up"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Demo Complete!                                        ║"
echo "║                                                        ║"
echo "║  To use for real:                                      ║"
echo "║  1. Set ANTHROPIC_API_KEY in .env                      ║"
echo "║  2. Run: node dist/cli.js run --task \"...\"            ║"
echo "║                                                        ║"
echo "║  See QUICKSTART.md for more examples                   ║"
echo "╚════════════════════════════════════════════════════════╝"
