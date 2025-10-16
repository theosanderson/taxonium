const ProcessRunner = require('../utils/process_runner');
const fs = require('fs').promises;
const path = require('path');

class UsherPlacementService {
  constructor(baseTreeFile = 'reference/tree.pb') {
    this.baseTreeFile = baseTreeFile;
  }

  async placeSequences(vcfFile, outputTreeFile, progressCallback = null) {
    if (progressCallback) {
      progressCallback({ step: 'usher_placement', progress: 0, message: 'Starting UShER placement' });
    }

    try {
      // Check if UShER is available
      const usherAvailable = await ProcessRunner.checkCommand('usher');
      if (!usherAvailable) {
        throw new Error('UShER not found. Please install UShER.');
      }

      // Check if base tree exists
      const treeExists = await this.checkBaseTree();
      if (!treeExists) {
        throw new Error(`Base tree file not found: ${this.baseTreeFile}`);
      }

      if (progressCallback) {
        progressCallback({ step: 'usher_placement', progress: 10, message: 'Validating VCF file' });
      }

      // Validate VCF file
      const vcfValid = await this.validateVcfFile(vcfFile);
      if (!vcfValid.valid) {
        throw new Error(`Invalid VCF file: ${vcfValid.error}`);
      }

      if (progressCallback) {
        progressCallback({ step: 'usher_placement', progress: 20, message: 'Running UShER placement' });
      }

      // Run UShER placement
      const result = await this.runUsher(vcfFile, outputTreeFile, progressCallback);

      if (progressCallback) {
        progressCallback({ step: 'usher_placement', progress: 100, message: 'UShER placement completed' });
      }

      return result;

    } catch (error) {
      if (progressCallback) {
        progressCallback({ 
          step: 'usher_placement', 
          progress: 0, 
          error: error.message 
        });
      }
      throw error;
    }
  }

  async checkBaseTree() {
    try {
      await fs.access(this.baseTreeFile);
      return true;
    } catch {
      return false;
    }
  }

  async validateVcfFile(vcfFile) {
    try {
      const content = await fs.readFile(vcfFile, 'utf8');
      const lines = content.split('\n');
      
      let hasHeader = false;
      let hasVariants = false;
      
      for (const line of lines) {
        if (line.startsWith('##')) {
          hasHeader = true;
        } else if (line.startsWith('#CHROM')) {
          // Column header line
          continue;
        } else if (line.trim() && !line.startsWith('#')) {
          hasVariants = true;
          break;
        }
      }
      
      if (!hasHeader) {
        return { valid: false, error: 'VCF file missing header' };
      }
      
      if (!hasVariants) {
        return { valid: false, error: 'VCF file contains no variants' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async runUsher(vcfFile, outputTreeFile, progressCallback = null) {
    const args = [
      '-i', this.baseTreeFile,  // Input tree
      '-v', vcfFile,            // VCF file with new samples
      '-o', outputTreeFile,     // Output tree
      '-T', '4'                 // Number of threads
    ];

    let placementCount = 0;
    const result = await ProcessRunner.runCommand('usher', args, {
      onProgress: (data) => {
        if (progressCallback) {
          // Parse UShER output for progress
          if (data.includes('Placed sample')) {
            placementCount++;
            const progress = 20 + Math.min(placementCount * 10, 70);
            progressCallback({ 
              step: 'usher_placement', 
              progress, 
              message: `Placed ${placementCount} samples` 
            });
          } else if (data.includes('Optimizing')) {
            progressCallback({ 
              step: 'usher_placement', 
              progress: 90, 
              message: 'Optimizing tree' 
            });
          }
        }
      }
    });

    // Parse UShER output for statistics
    const stats = this.parseUsherOutput(result.stderr);

    // Validate output tree
    const treeValid = await this.validateOutputTree(outputTreeFile);
    if (!treeValid.valid) {
      throw new Error(`UShER failed to create valid output tree: ${treeValid.error}`);
    }

    return {
      success: true,
      outputFile: outputTreeFile,
      placedSamples: placementCount,
      stats,
      usherOutput: result.stderr
    };
  }

  parseUsherOutput(stderr) {
    const stats = {
      totalSamples: 0,
      placedSamples: 0,
      skippedSamples: 0,
      treeNodes: 0,
      executionTime: null
    };

    const lines = stderr.split('\n');
    for (const line of lines) {
      if (line.includes('samples placed')) {
        const match = line.match(/(\d+)\s+samples placed/);
        if (match) {
          stats.placedSamples = parseInt(match[1]);
        }
      } else if (line.includes('samples skipped')) {
        const match = line.match(/(\d+)\s+samples skipped/);
        if (match) {
          stats.skippedSamples = parseInt(match[1]);
        }
      } else if (line.includes('Total time')) {
        const match = line.match(/Total time:\s*(.+)/);
        if (match) {
          stats.executionTime = match[1].trim();
        }
      }
    }

    stats.totalSamples = stats.placedSamples + stats.skippedSamples;
    return stats;
  }

  async validateOutputTree(treeFile) {
    try {
      const stats = await fs.stat(treeFile);
      if (stats.size === 0) {
        return { valid: false, error: 'Output tree file is empty' };
      }

      // Basic validation - UShER outputs protobuf format
      // We can't easily validate the protobuf content without the schema,
      // but we can check if the file exists and has content
      return { valid: true, size: stats.size };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async getTreeInfo(treeFile) {
    try {
      // Try to get basic info about the tree using UShER
      const result = await ProcessRunner.runCommand('usher', ['-i', treeFile, '--print-tree-info']);
      return { success: true, info: result.stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = UsherPlacementService;