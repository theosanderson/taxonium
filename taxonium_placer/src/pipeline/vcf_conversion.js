const ProcessRunner = require('../utils/process_runner');
const fs = require('fs').promises;

class VcfConversionService {
  constructor() {
    this.requiredTools = ['msa2vcf'];
  }

  async convertMsaToVcf(msaFile, referenceFile, outputVcf, progressCallback = null) {
    if (progressCallback) {
      progressCallback({ step: 'vcf_conversion', progress: 0, message: 'Starting msa2vcf conversion' });
    }

    try {
      // Check required tools
      await this.checkRequiredTools();

      if (progressCallback) {
        progressCallback({ step: 'vcf_conversion', progress: 20, message: 'Converting MSA to VCF with msa2vcf' });
      }

      // Use msa2vcf to convert MSA to VCF
      // msa2vcf takes: msa2vcf msa.fasta ref_name
      // We need to determine the reference name from the reference file
      const refContent = await fs.readFile(referenceFile, 'utf8');
      const refName = refContent.split('\n')[0].replace('>', '').trim() || 'reference';
      
      const args = [
        msaFile,    // Input MSA file
        refName     // Reference sequence name
      ];

      let progressCount = 0;
      const result = await ProcessRunner.runCommand('msa2vcf', args, {
        onProgress: () => {
          progressCount++;
          if (progressCallback && progressCount % 3 === 0) {
            const progress = Math.min(20 + (progressCount * 2), 90);
            progressCallback({ 
              step: 'vcf_conversion', 
              progress, 
              message: 'Converting alignment to VCF format...' 
            });
          }
        }
      });

      // msa2vcf outputs to stdout, so we need to write it to the output file
      await fs.writeFile(outputVcf, result.stdout);

      if (progressCallback) {
        progressCallback({ step: 'vcf_conversion', progress: 100, message: 'VCF conversion completed' });
      }

      const stats = await this.getVcfStats(outputVcf);

      return {
        success: true,
        outputFile: outputVcf,
        stats,
        command: `msa2vcf ${args.join(' ')}`,
        stdout: result.stdout,
        stderr: result.stderr
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

  // Keep the old method name for compatibility, but redirect to new method
  async convertSamToVcf(inputFile, referenceFile, outputVcf, progressCallback = null) {
    return this.convertMsaToVcf(inputFile, referenceFile, outputVcf, progressCallback);
  }

  async checkRequiredTools() {
    for (const tool of this.requiredTools) {
      const available = await ProcessRunner.checkCommand(tool);
      if (!available) {
        throw new Error(`Required tool not found: ${tool}`);
      }
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