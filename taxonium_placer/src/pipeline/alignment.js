const ProcessRunner = require('../utils/process_runner');
const path = require('path');
const fs = require('fs').promises;

class AlignmentService {
  constructor(referenceFile = 'reference/reference.fasta') {
    this.referenceFile = referenceFile;
  }

  async alignSequences(inputFasta, outputMsa, progressCallback = null) {
    if (progressCallback) {
      progressCallback({ step: 'alignment', progress: 0, message: 'Starting ViralMSA alignment' });
    }

    try {
      // Check if reference file exists
      const refExists = await this.checkReference();
      if (!refExists) {
        throw new Error(`Reference file not found: ${this.referenceFile}`);
      }

      // Check if ViralMSA is available
      const viralMsaAvailable = await ProcessRunner.checkCommand('ViralMSA.py');
      if (!viralMsaAvailable) {
        throw new Error('ViralMSA.py not found. Please install ViralMSA.');
      }

      if (progressCallback) {
        progressCallback({ step: 'alignment', progress: 10, message: 'Running ViralMSA with minimap2' });
      }

      // Create unique output directory for ViralMSA
      const outputDir = path.dirname(outputMsa);
      const jobId = path.basename(outputMsa).split('_')[0]; // Extract job ID from filename
      const viralMsaDir = path.join(outputDir, `viralmsa_${jobId}`);
      
      // Clean up any existing output directory
      try {
        await fs.rmdir(viralMsaDir, { recursive: true });
      } catch (error) {
        // Directory doesn't exist, which is fine
      }
      
      // Run ViralMSA alignment
      const args = [
        '-s', inputFasta,           // Input sequences
        '-r', this.referenceFile,   // Reference genome
        '-o', viralMsaDir,          // Output directory
        '-a', 'minimap2',           // Use minimap2 as aligner
        '--omit_ref'                // Don't include reference in output alignment
      ];

      let progressCount = 0;
      const result = await ProcessRunner.runCommand('ViralMSA.py', args, {
        onProgress: (data) => {
          progressCount++;
          if (progressCallback && progressCount % 5 === 0) {
            const progress = Math.min(10 + (progressCount * 3), 90);
            progressCallback({ 
              step: 'alignment', 
              progress, 
              message: 'ViralMSA aligning sequences...' 
            });
          }
        }
      });

      // ViralMSA creates output files in the specified directory
      // The output file is named after the input file with .aln extension
      const inputBasename = path.basename(inputFasta);
      const expectedOutput = `${inputBasename}.aln`;
      const msaOutputFile = path.join(viralMsaDir, expectedOutput);
      
      // Check if the file exists
      try {
        await fs.access(msaOutputFile);
      } catch (error) {
        // If expected file doesn't exist, list all files for debugging
        try {
          const files = await fs.readdir(viralMsaDir);
          throw new Error(`ViralMSA output file not found. Expected: ${expectedOutput}, Available files: ${files.join(', ')}`);
        } catch (listError) {
          throw new Error(`ViralMSA output directory not found or empty: ${viralMsaDir}`);
        }
      }
      
      // Copy the MSA output to our expected location
      try {
        await fs.copyFile(msaOutputFile, outputMsa);
      } catch (copyError) {
        throw new Error(`Failed to copy ViralMSA output: ${copyError.message}`);
      }

      if (progressCallback) {
        progressCallback({ step: 'alignment', progress: 100, message: 'ViralMSA alignment completed' });
      }

      return {
        success: true,
        outputFile: outputMsa,
        alignedSequences: await this.countAlignedSequences(outputMsa),
        stats: this.parseViralMsaStats(result.stderr),
        viralMsaDir: viralMsaDir
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

  async countAlignedSequences(msaFile) {
    try {
      const content = await fs.readFile(msaFile, 'utf8');
      const lines = content.split('\n');
      let count = 0;
      
      for (const line of lines) {
        if (line.startsWith('>')) {
          count++;
        }
      }
      
      return count;
    } catch (error) {
      console.warn('Failed to count aligned sequences:', error.message);
      return 0;
    }
  }

  parseViralMsaStats(stderr) {
    // Parse ViralMSA statistics from stderr
    const stats = {
      totalSequences: 0,
      alignedSequences: 0,
      alignmentRate: 0,
      tool: 'ViralMSA'
    };

    const lines = stderr.split('\n');
    for (const line of lines) {
      // Look for ViralMSA progress messages
      if (line.includes('sequences') || line.includes('aligned')) {
        // Try to extract sequence counts
        const numbers = line.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          stats.alignedSequences = parseInt(numbers[0]);
        }
      }
    }

    return stats;
  }

  async validateMsaFile(msaFile) {
    try {
      const content = await fs.readFile(msaFile, 'utf8');
      const lines = content.split('\n');
      
      let hasSequences = false;
      let sequenceCount = 0;
      let hasValidFormat = true;
      
      for (const line of lines) {
        if (line.startsWith('>')) {
          hasSequences = true;
          sequenceCount++;
        } else if (line.trim() && !line.startsWith('>')) {
          // Check if sequence line contains valid nucleotides
          if (!/^[ATCGN-]+$/i.test(line.trim())) {
            hasValidFormat = false;
          }
        }
      }
      
      return { 
        valid: hasSequences && hasValidFormat && sequenceCount > 0, 
        sequenceCount, 
        hasValidFormat 
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = AlignmentService;