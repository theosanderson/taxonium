const ProcessRunner = require('../utils/process_runner');
const fs = require('fs').promises;
const path = require('path');

class VcfConversionService {
  constructor() {
    this.requiredTools = ['samtools', 'bcftools'];
  }

  async convertSamToVcf(samFile, referenceFile, outputVcf, progressCallback = null) {
    if (progressCallback) {
      progressCallback({ step: 'vcf_conversion', progress: 0, message: 'Starting VCF conversion' });
    }

    try {
      // Check required tools
      await this.checkRequiredTools();

      if (progressCallback) {
        progressCallback({ step: 'vcf_conversion', progress: 10, message: 'Converting SAM to BAM' });
      }

      // Step 1: Convert SAM to BAM
      const bamFile = samFile.replace('.sam', '.bam');
      await this.samToBam(samFile, bamFile);

      if (progressCallback) {
        progressCallback({ step: 'vcf_conversion', progress: 30, message: 'Sorting BAM file' });
      }

      // Step 2: Sort BAM
      const sortedBam = bamFile.replace('.bam', '_sorted.bam');
      await this.sortBam(bamFile, sortedBam);

      if (progressCallback) {
        progressCallback({ step: 'vcf_conversion', progress: 50, message: 'Indexing BAM file' });
      }

      // Step 3: Index BAM
      await this.indexBam(sortedBam);

      if (progressCallback) {
        progressCallback({ step: 'vcf_conversion', progress: 70, message: 'Calling variants' });
      }

      // Step 4: Call variants with bcftools
      await this.callVariants(sortedBam, referenceFile, outputVcf);

      if (progressCallback) {
        progressCallback({ step: 'vcf_conversion', progress: 100, message: 'VCF conversion completed' });
      }

      const stats = await this.getVcfStats(outputVcf);

      return {
        success: true,
        outputFile: outputVcf,
        intermediateFiles: [bamFile, sortedBam, `${sortedBam}.bai`],
        stats
      };

    } catch (error) {
      if (progressCallback) {
        progressCallback({ 
          step: 'vcf_conversion', 
          progress: 0, 
          error: error.message 
        });
      }
      throw error;
    }
  }

  async checkRequiredTools() {
    for (const tool of this.requiredTools) {
      const available = await ProcessRunner.checkCommand(tool);
      if (!available) {
        throw new Error(`Required tool not found: ${tool}`);
      }
    }
  }

  async samToBam(samFile, bamFile) {
    const args = ['view', '-bS', samFile, '-o', bamFile];
    await ProcessRunner.runCommand('samtools', args);
  }

  async sortBam(bamFile, sortedBam) {
    const args = ['sort', bamFile, '-o', sortedBam];
    await ProcessRunner.runCommand('samtools', args);
  }

  async indexBam(bamFile) {
    const args = ['index', bamFile];
    await ProcessRunner.runCommand('samtools', args);
  }

  async callVariants(bamFile, referenceFile, outputVcf) {
    // Use bcftools mpileup and call to generate VCF
    const mpileupArgs = [
      'mpileup',
      '-f', referenceFile,
      '-B',  // Disable probabilistic realignment
      '-Q', '20',  // Minimum base quality
      '-q', '20',  // Minimum mapping quality
      bamFile
    ];

    const callArgs = [
      'call',
      '-mv',  // Multiallelic caller, variants only
      '-O', 'v',  // Output format VCF
      '-o', outputVcf
    ];

    // Run mpileup | call pipeline
    const mpileupResult = await ProcessRunner.runCommand('bcftools', mpileupArgs);
    
    // Write mpileup output to temporary file
    const tempBcf = outputVcf.replace('.vcf', '_temp.bcf');
    await fs.writeFile(tempBcf, mpileupResult.stdout);

    // Call variants
    const finalCallArgs = ['call', '-mv', '-O', 'v', '-o', outputVcf, tempBcf];
    await ProcessRunner.runCommand('bcftools', finalCallArgs);

    // Clean up temp file
    try {
      await fs.unlink(tempBcf);
    } catch (error) {
      console.warn('Failed to clean up temp BCF file:', error.message);
    }
  }

  async getVcfStats(vcfFile) {
    try {
      const content = await fs.readFile(vcfFile, 'utf8');
      const lines = content.split('\n');
      
      let variantCount = 0;
      let snpCount = 0;
      let indelCount = 0;
      
      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          variantCount++;
          const fields = line.split('\t');
          if (fields.length >= 5) {
            const ref = fields[3];
            const alt = fields[4];
            
            if (ref.length === 1 && alt.length === 1) {
              snpCount++;
            } else {
              indelCount++;
            }
          }
        }
      }
      
      return {
        totalVariants: variantCount,
        snps: snpCount,
        indels: indelCount
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async validateVcf(vcfFile) {
    try {
      const result = await ProcessRunner.runCommand('bcftools', ['view', '-h', vcfFile]);
      return { valid: true, header: result.stdout };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = VcfConversionService;