const ProcessRunner = require('../utils/process_runner');
const fs = require('fs').promises;
const path = require('path');

class TaxoniumConversionService {
  constructor() {
    this.taxoniumtools = 'taxoniumtools';
  }

  async convertToTaxonium(treeFile, outputJsonl, progressCallback = null) {
    if (progressCallback) {
      progressCallback({ step: 'taxonium_conversion', progress: 0, message: 'Starting Taxonium conversion' });
    }

    try {
      // Check if taxoniumtools is available
      const toolsAvailable = await ProcessRunner.checkCommand(this.taxoniumtools);
      if (!toolsAvailable) {
        throw new Error('taxoniumtools not found. Please install taxoniumtools.');
      }

      if (progressCallback) {
        progressCallback({ step: 'taxonium_conversion', progress: 10, message: 'Validating tree file' });
      }

      // Validate input tree file
      const treeValid = await this.validateTreeFile(treeFile);
      if (!treeValid.valid) {
        throw new Error(`Invalid tree file: ${treeValid.error}`);
      }

      if (progressCallback) {
        progressCallback({ step: 'taxonium_conversion', progress: 20, message: 'Running taxoniumtools conversion' });
      }

      // Run taxoniumtools conversion
      const result = await this.runTaxoniumTools(treeFile, outputJsonl, progressCallback);

      if (progressCallback) {
        progressCallback({ step: 'taxonium_conversion', progress: 100, message: 'Taxonium conversion completed' });
      }

      return result;

    } catch (error) {
      if (progressCallback) {
        progressCallback({ 
          step: 'taxonium_conversion', 
          progress: 0, 
          error: error.message 
        });
      }
      throw error;
    }
  }

  async validateTreeFile(treeFile) {
    try {
      const stats = await fs.stat(treeFile);
      if (stats.size === 0) {
        return { valid: false, error: 'Tree file is empty' };
      }

      // Check if it's a protobuf file (UShER format)
      // Protobuf files typically start with specific bytes, but this is a basic check
      const buffer = await fs.readFile(treeFile);
      if (buffer.length < 10) {
        return { valid: false, error: 'Tree file too small to be valid' };
      }

      return { valid: true, size: stats.size };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async runTaxoniumTools(treeFile, outputJsonl, progressCallback = null) {
    // taxoniumtools command for converting UShER protobuf to Taxonium JSONL
    const args = [
      treeFile,
      '--output', outputJsonl,
      '--format', 'jsonl'
    ];

    let lineCount = 0;
    const result = await ProcessRunner.runCommand(this.taxoniumtools, args, {
      onProgress: (data) => {
        if (progressCallback) {
          // Parse taxoniumtools output for progress
          if (data.includes('Processing node') || data.includes('Writing')) {
            lineCount++;
            const progress = 20 + Math.min(lineCount * 2, 70);
            progressCallback({ 
              step: 'taxonium_conversion', 
              progress, 
              message: `Processing nodes: ${lineCount}` 
            });
          } else if (data.includes('Finished')) {
            progressCallback({ 
              step: 'taxonium_conversion', 
              progress: 95, 
              message: 'Finalizing output' 
            });
          }
        }
      }
    });

    // Validate output file
    const outputValid = await this.validateJsonlOutput(outputJsonl);
    if (!outputValid.valid) {
      throw new Error(`Failed to create valid JSONL output: ${outputValid.error}`);
    }

    // Parse conversion statistics
    const stats = this.parseConversionOutput(result.stderr);

    return {
      success: true,
      outputFile: outputJsonl,
      stats,
      outputInfo: outputValid,
      conversionOutput: result.stderr
    };
  }

  async validateJsonlOutput(jsonlFile) {
    try {
      const content = await fs.readFile(jsonlFile, 'utf8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0) {
        return { valid: false, error: 'JSONL file is empty' };
      }

      // Validate first few lines are valid JSON
      let validLines = 0;
      let nodeCount = 0;
      
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        try {
          const parsed = JSON.parse(lines[i]);
          validLines++;
          if (parsed.node_id !== undefined) {
            nodeCount++;
          }
        } catch (error) {
          return { valid: false, error: `Invalid JSON on line ${i + 1}: ${error.message}` };
        }
      }

      return { 
        valid: true, 
        totalLines: lines.length,
        validLines,
        estimatedNodes: nodeCount,
        fileSize: content.length
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  parseConversionOutput(stderr) {
    const stats = {
      totalNodes: 0,
      processedNodes: 0,
      mutations: 0,
      executionTime: null,
      memoryUsage: null
    };

    const lines = stderr.split('\n');
    for (const line of lines) {
      if (line.includes('nodes processed')) {
        const match = line.match(/(\d+)\s+nodes processed/);
        if (match) {
          stats.processedNodes = parseInt(match[1]);
        }
      } else if (line.includes('mutations')) {
        const match = line.match(/(\d+)\s+mutations/);
        if (match) {
          stats.mutations = parseInt(match[1]);
        }
      } else if (line.includes('Execution time')) {
        const match = line.match(/Execution time:\s*(.+)/);
        if (match) {
          stats.executionTime = match[1].trim();
        }
      } else if (line.includes('Memory usage')) {
        const match = line.match(/Memory usage:\s*(.+)/);
        if (match) {
          stats.memoryUsage = match[1].trim();
        }
      }
    }

    return stats;
  }

  async getJsonlInfo(jsonlFile) {
    try {
      const content = await fs.readFile(jsonlFile, 'utf8');
      const lines = content.trim().split('\n');
      
      let nodeCount = 0;
      let leafCount = 0;
      let mutationCount = 0;
      
      for (const line of lines) {
        try {
          const node = JSON.parse(line);
          nodeCount++;
          
          if (node.children && node.children.length === 0) {
            leafCount++;
          }
          
          if (node.mutations) {
            mutationCount += node.mutations.length;
          }
        } catch (error) {
          // Skip invalid lines
        }
      }
      
      return {
        success: true,
        totalNodes: nodeCount,
        leafNodes: leafCount,
        totalMutations: mutationCount,
        fileSize: content.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = TaxoniumConversionService;