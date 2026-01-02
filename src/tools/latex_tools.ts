/**
 * LaTeX tools - static checks and optional compilation
 */

export interface LaTeXIssue {
  type: 'error' | 'warning';
  line?: number;
  message: string;
}

export class LaTeXTools {
  /**
   * Run static checks on LaTeX content
   */
  static checkSyntax(content: string): LaTeXIssue[] {
    const issues: LaTeXIssue[] = [];
    const lines = content.split('\n');

    // Check for common LaTeX errors
    let braceDepth = 0;
    let bracketDepth = 0;
    const environmentStack: string[] = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Check for mismatched braces
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth--;
      }

      // Check for begin/end environment matching
      const beginMatch = line.match(/\\begin\{([^}]+)\}/);
      if (beginMatch) {
        environmentStack.push(beginMatch[1]);
      }

      const endMatch = line.match(/\\end\{([^}]+)\}/);
      if (endMatch) {
        const env = endMatch[1];
        const lastEnv = environmentStack.pop();
        if (lastEnv !== env) {
          issues.push({
            type: 'error',
            line: lineNum,
            message: `Environment mismatch: \\end{${env}} but expected \\end{${lastEnv}}`
          });
        }
      }

      // Check for common mistakes
      if (line.includes('$$') && !line.trim().startsWith('%')) {
        issues.push({
          type: 'warning',
          line: lineNum,
          message: 'Use \\[ \\] instead of $$ $$ for display math'
        });
      }

      if (line.includes('\\\\\\\\')) {
        issues.push({
          type: 'warning',
          line: lineNum,
          message: 'Double line break \\\\\\\\ detected - usually a mistake'
        });
      }
    });

    // Final checks
    if (braceDepth !== 0) {
      issues.push({
        type: 'error',
        message: `Mismatched braces: ${braceDepth > 0 ? braceDepth + ' unclosed' : Math.abs(braceDepth) + ' extra closing'}`
      });
    }

    if (environmentStack.length > 0) {
      issues.push({
        type: 'error',
        message: `Unclosed environments: ${environmentStack.join(', ')}`
      });
    }

    return issues;
  }

  /**
   * Extract macro definitions from LaTeX content
   */
  static extractMacros(content: string): Map<string, string> {
    const macros = new Map<string, string>();
    const newcommandRegex = /\\newcommand\{\\([^}]+)\}(?:\[(\d+)\])?\{([^}]+)\}/g;
    
    let match;
    while ((match = newcommandRegex.exec(content)) !== null) {
      const [_, name, numArgs, definition] = match;
      macros.set(name, definition);
    }

    return macros;
  }

  /**
   * Check for consistent macro usage
   */
  static checkMacroConsistency(content: string, expectedMacros: Map<string, string>): LaTeXIssue[] {
    const issues: LaTeXIssue[] = [];
    const definedMacros = this.extractMacros(content);

    // Check for redefinitions with different values
    for (const [name, definition] of definedMacros.entries()) {
      if (expectedMacros.has(name)) {
        const expected = expectedMacros.get(name);
        if (expected !== definition) {
          issues.push({
            type: 'warning',
            message: `Macro \\${name} redefined: expected "${expected}", got "${definition}"`
          });
        }
      }
    }

    return issues;
  }

  /**
   * Format LaTeX content with basic cleanup
   */
  static formatContent(content: string): string {
    let formatted = content;

    // Remove trailing whitespace
    formatted = formatted.split('\n').map(line => line.trimEnd()).join('\n');

    // Ensure blank line before \begin{document}
    formatted = formatted.replace(/([^\n])\n(\\begin\{document\})/g, '$1\n\n$2');

    // Ensure blank line before section headings
    formatted = formatted.replace(/([^\n])\n(\\(?:section|subsection|subsubsection)\{)/g, '$1\n\n$2');

    return formatted;
  }
}
