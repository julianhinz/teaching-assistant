/**
 * Filesystem tools - sandboxed read/write operations for course materials
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileListEntry {
  name: string;
  type: 'file' | 'directory';
  path: string;
}

export class FileSystemTools {
  private basePath: string;

  constructor(basePath: string) {
    // Resolve to absolute path for safety
    this.basePath = path.resolve(basePath);
  }

  /**
   * Ensure path is within the sandboxed base directory
   */
  private validatePath(filePath: string): string {
    const resolved = path.resolve(this.basePath, filePath);
    if (!resolved.startsWith(this.basePath)) {
      throw new Error(`Access denied: path outside sandbox (${filePath})`);
    }
    return resolved;
  }

  /**
   * Read a file's contents
   */
  async readFile(filePath: string): Promise<string> {
    const fullPath = this.validatePath(filePath);
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write content to a file (creates parent directories if needed)
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = this.validatePath(filePath);
    const dir = path.dirname(fullPath);
    
    try {
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  /**
   * List files and directories in a path
   */
  async listDirectory(dirPath: string = '.'): Promise<FileListEntry[]> {
    const fullPath = this.validatePath(dirPath);
    
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath, entry.name)
      }));
    } catch (error: any) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Check if a file exists
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.validatePath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    const fullPath = this.validatePath(dirPath);
    try {
      await fs.mkdir(fullPath, { recursive: true });
    } catch (error: any) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Find files matching a pattern (simple glob support)
   */
  async findFiles(pattern: string, dirPath: string = '.'): Promise<string[]> {
    const fullPath = this.validatePath(dirPath);
    const results: string[] = [];
    
    const searchRecursive = async (currentPath: string, currentRelative: string) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        const entryRelative = path.join(currentRelative, entry.name);
        
        if (entry.isDirectory()) {
          await searchRecursive(entryPath, entryRelative);
        } else if (this.matchesPattern(entry.name, pattern)) {
          results.push(entryRelative);
        }
      }
    };
    
    try {
      await searchRecursive(fullPath, dirPath);
      return results;
    } catch (error: any) {
      throw new Error(`Failed to find files: ${error.message}`);
    }
  }

  /**
   * Simple pattern matching (supports * wildcard)
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(filename);
  }

  /**
   * Get the base path
   */
  getBasePath(): string {
    return this.basePath;
  }
}
