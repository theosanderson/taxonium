const ProcessRunner = require('../utils/process_runner');
const path = require('path');
const fs = require('fs').promises;

class AlignmentService {
  constructor(referenceFile = 'reference/reference.fasta') {
    this.referenceFile = referenceFile;
  }

  async alignSequences(inputFasta, outputSam, progressCallback = null) {
    if (progressCallback) {
      progressCallback({ step: 'alignment', progress: 0, message: 'Starting alignment' });
    }

    try {
      // Check if reference file exists
      const refExists = await this.checkReference();
      if (!refExists) {
        throw new Error(`Reference file not found: ${this.referenceFile}`);
      }

      // Check if minimap2 is available
      const minimap2Available = await ProcessRunner.checkCommand('minimap2');
      if (!minimap2Available) {
        throw new Error('minimap2 not found. Please install minimap2.');
      }

      if (progressCallback) {
        progressCallback({ step: 'alignment', progress: 10, message: 'Running minimap2' });
      }

      // Run minimap2 alignment
      const args = [
        '-ax', 'asm20',  // Assembly to reference alignment
        this.referenceFile,
        inputFasta
      ];

      let progressCount = 0;
      const result = await ProcessRunner.runCommand('minimap2', args, {
        onProgress: (data) => {
          progressCount++;
          if (progressCallback && progressCount % 10 === 0) {
            const progress = Math.min(10 + (progressCount * 2), 90);
            progressCallback({ 
              step: 'alignment', 
              progress, 
              message: 'Aligning sequences...' 
            });
          }
        }
      });

      // Save SAM output
      await fs.writeFile(outputSam, result.stdout);

      if (progressCallback) {
        progressCallback({ step: 'alignment', progress: 100, message: 'Alignment completed' });
      }

      return {
        success: true,
        outputFile: outputSam,
        alignedSequences: this.countAlignedSequences(result.stdout),
        stats: this.parseAlignmentStats(result.stderr)
      };

    } catch (error) {
      if (progressCallback) {
        progressCallback({ 
          step: 'alignment', 
          progress: 0, 
          error: error.message 
        });
      }
      throw error;
    }
  }

  async checkReference() {
    try {
      await fs.access(this.referenceFile);
      return true;
    } catch {
      return false;
    }
  }

  countAlignedSequences(samContent) {
    const lines = samContent.split('\n');
    let count = 0;
    for (const line of lines) {
      if (line && !line.startsWith('@')) {
        count++;
      }
    }
    return count;
  }

  parseAlignmentStats(stderr) {
    // Parse minimap2 statistics from stderr
    const stats = {
      totalReads: 0,
      mappedReads: 0,
      mappingRate: 0
    };

    const lines = stderr.split('\n');
    for (const line of lines) {
      if (line.includes('mapped')) {
        // Extract mapping statistics if available
        const match = line.match(/(\d+)\s+mapped/);
        if (match) {
          stats.mappedReads = parseInt(match[1]);
        }
      }
    }

    return stats;
  }

  async validateSamFile(samFile) {
    try {
      const content = await fs.readFile(samFile, 'utf8');
      const lines = content.split('\n');
      
      let hasHeader = false;
      let hasAlignments = false;
      
      for (const line of lines) {
        if (line.startsWith('@')) {
          hasHeader = true;
        } else if (line.trim() && !line.startsWith('@')) {
          hasAlignments = true;
          break;
        }
      }
      
      return { valid: hasHeader && hasAlignments, hasHeader, hasAlignments };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = AlignmentService;