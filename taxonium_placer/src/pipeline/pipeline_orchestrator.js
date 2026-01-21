const AlignmentService = require('./alignment');
const VcfConversionService = require('./vcf_conversion');
const UsherPlacementService = require('./usher_placement');
const TaxoniumConversionService = require('./taxonium_conversion');

class PipelineOrchestrator {
  constructor(fileManager, referenceFile = 'reference/reference.fasta', baseTreeFile = 'reference/tree.pb') {
    this.fileManager = fileManager;
    this.alignmentService = new AlignmentService(referenceFile);
    this.vcfService = new VcfConversionService();
    this.usherService = new UsherPlacementService(baseTreeFile);
    this.taxoniumService = new TaxoniumConversionService();
  }

  async processSequences(jobId, inputFasta, progressCallback = null) {
    const results = {
      jobId,
      inputFile: inputFasta,
      stages: {},
      finalOutput: null,
      success: false,
      error: null
    };

    try {
      // Stage 1: ViralMSA Alignment
      if (progressCallback) {
        progressCallback({ step: 'alignment', progress: 0, message: 'Starting ViralMSA alignment' });
      }

      const msaFile = await this.fileManager.createTempFile(jobId, 'aligned.msa');
      const alignmentResult = await this.alignmentService.alignSequences(
        inputFasta, 
        msaFile, 
        progressCallback
      );
      
      results.stages.alignment = alignmentResult;
      console.log(`Job ${jobId}: ViralMSA alignment completed - ${alignmentResult.alignedSequences} sequences aligned`);

      // Stage 2: VCF Conversion with faToVcf
      if (progressCallback) {
        progressCallback({ step: 'vcf_conversion', progress: 0, message: 'Converting MSA to VCF format' });
      }

      const vcfFile = await this.fileManager.createTempFile(jobId, 'variants.vcf');
      const vcfResult = await this.vcfService.convertMsaToVcf(
        msaFile, 
        this.alignmentService.referenceFile, 
        vcfFile, 
        progressCallback
      );
      
      results.stages.vcf_conversion = vcfResult;
      console.log(`Job ${jobId}: VCF conversion completed - ${vcfResult.stats?.totalVariants || 'unknown'} variants`);

      // Stage 3: UShER Placement
      if (progressCallback) {
        progressCallback({ step: 'usher_placement', progress: 0, message: 'Placing sequences on phylogenetic tree' });
      }

      const placedTreeFile = await this.fileManager.createTempFile(jobId, 'placed_tree.pb');
      const usherResult = await this.usherService.placeSequences(
        vcfFile, 
        placedTreeFile, 
        progressCallback
      );
      
      results.stages.usher_placement = usherResult;
      console.log(`Job ${jobId}: UShER placement completed - ${usherResult.placedSamples} samples placed`);

      // Stage 4: Taxonium Conversion
      if (progressCallback) {
        progressCallback({ step: 'taxonium_conversion', progress: 0, message: 'Converting to Taxonium format' });
      }

      const taxoniumFile = await this.fileManager.createTempFile(jobId, 'taxonium.jsonl');
      const taxoniumResult = await this.taxoniumService.convertToTaxonium(
        placedTreeFile, 
        taxoniumFile, 
        progressCallback
      );
      
      results.stages.taxonium_conversion = taxoniumResult;
      results.finalOutput = taxoniumFile;
      console.log(`Job ${jobId}: Taxonium conversion completed - ${taxoniumResult.outputInfo?.totalLines || 'unknown'} nodes`);

      // Final stage completion
      if (progressCallback) {
        progressCallback({ 
          step: 'completed', 
          progress: 100, 
          message: 'Pipeline completed successfully',
          outputFile: taxoniumFile
        });
      }

      results.success = true;
      return results;

    } catch (error) {
      console.error(`Job ${jobId} pipeline failed:`, error);
      results.error = error.message;
      results.success = false;
      
      if (progressCallback) {
        progressCallback({ 
          step: 'failed', 
          progress: 0, 
          error: error.message 
        });
      }
      
      throw error;
    }
  }

  async validateInputFile(filePath) {
    try {
      // Basic FASTA validation
      const fs = require('fs').promises;
      const content = await fs.readFile(filePath, 'utf8');
      
      if (!content.includes('>')) {
        return { valid: false, error: 'File does not appear to be in FASTA format (no sequence headers found)' };
      }
      
      const lines = content.split('\n');
      let sequences = 0;
      let hasSequenceData = false;
      
      for (const line of lines) {
        if (line.startsWith('>')) {
          sequences++;
        } else if (line.trim() && !line.startsWith('>')) {
          hasSequenceData = true;
        }
      }
      
      if (sequences === 0) {
        return { valid: false, error: 'No sequences found in FASTA file' };
      }
      
      if (!hasSequenceData) {
        return { valid: false, error: 'No sequence data found in FASTA file' };
      }
      
      return { 
        valid: true, 
        sequenceCount: sequences,
        fileSize: content.length 
      };
      
    } catch (error) {
      return { valid: false, error: `Failed to validate file: ${error.message}` };
    }
  }

  async getRequiredTools() {
    const ProcessRunner = require('../utils/process_runner');
    const tools = {};
    
    const requiredTools = [
      'ViralMSA.py',
      'msa2vcf',
      'usher',
      'taxoniumtools'
    ];
    
    for (const tool of requiredTools) {
      tools[tool] = {
        available: await ProcessRunner.checkCommand(tool),
        version: null
      };
      
      if (tools[tool].available) {
        try {
          const version = await ProcessRunner.getCommandVersion(tool);
          tools[tool].version = version.split('\n')[0]; // First line only
        } catch (error) {
          tools[tool].version = 'Unknown';
        }
      }
    }
    
    return tools;
  }

  async checkPrerequisites() {
    const issues = [];
    
    // Check reference files
    try {
      const refExists = await this.alignmentService.checkReference();
      if (!refExists) {
        issues.push(`Reference file not found: ${this.alignmentService.referenceFile}`);
      }
    } catch (error) {
      issues.push(`Reference file check failed: ${error.message}`);
    }
    
    try {
      const treeExists = await this.usherService.checkBaseTree();
      if (!treeExists) {
        issues.push(`Base tree file not found: ${this.usherService.baseTreeFile}`);
      }
    } catch (error) {
      issues.push(`Base tree check failed: ${error.message}`);
    }
    
    // Check tools
    const tools = await this.getRequiredTools();
    for (const [tool, info] of Object.entries(tools)) {
      if (!info.available) {
        issues.push(`Required tool not available: ${tool}`);
      }
    }
    
    return {
      ready: issues.length === 0,
      issues,
      tools
    };
  }
}

module.exports = PipelineOrchestrator;