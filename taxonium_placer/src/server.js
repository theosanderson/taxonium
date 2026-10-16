const express = require('express');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');
const { program } = require('commander');
const path = require('path');

const FileManager = require('./utils/file_manager');
const ProcessRunner = require('./utils/process_runner');
const PipelineOrchestrator = require('./pipeline/pipeline_orchestrator');

program
  .option('-p, --port <port>', 'port number', '3000')
  .option('--max-jobs <number>', 'maximum concurrent jobs', '5')
  .option('--cleanup-hours <hours>', 'cleanup old jobs after hours', '24')
  .parse();

const options = program.opts();

class TaxoniumPlacerServer {
  constructor() {
    this.app = express();
    this.fileManager = new FileManager();
    this.pipeline = new PipelineOrchestrator(this.fileManager);
    this.jobs = new Map();
    this.activeJobs = 0;
    this.maxJobs = parseInt(options.maxJobs);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.startCleanupTimer();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.static('public'));

    const storage = multer.diskStorage({
      destination: 'temp/',
      filename: (req, file, cb) => {
        cb(null, `upload_${Date.now()}_${file.originalname}`);
      }
    });

    this.upload = multer({ 
      storage,
      limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/plain' || 
            file.originalname.toLowerCase().endsWith('.fasta') ||
            file.originalname.toLowerCase().endsWith('.fa')) {
          cb(null, true);
        } else {
          cb(new Error('Only FASTA files are allowed'));
        }
      }
    });
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        activeJobs: this.activeJobs,
        maxJobs: this.maxJobs
      });
    });

    this.app.get('/status', (req, res) => {
      res.json({
        server: 'Taxonium Placer',
        version: '1.0.0',
        activeJobs: this.activeJobs,
        maxJobs: this.maxJobs,
        totalJobs: this.jobs.size
      });
    });

    this.app.get('/tools', async (req, res) => {
      try {
        const prerequisites = await this.pipeline.checkPrerequisites();
        res.json({
          ready: prerequisites.ready,
          issues: prerequisites.issues,
          tools: prerequisites.tools
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/upload', this.upload.single('fasta'), (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        if (this.activeJobs >= this.maxJobs) {
          return res.status(503).json({ error: 'Server busy, please try again later' });
        }

        const job = this.fileManager.createJob(req.file.originalname);
        
        this.jobs.set(job.id, {
          ...job,
          status: 'queued',
          step: 'upload',
          progress: 0,
          uploadedFile: req.file,
          createdAt: new Date(),
          lastUpdate: new Date()
        });

        res.json({ 
          jobId: job.id, 
          status: 'queued',
          message: 'File uploaded successfully' 
        });

        // Start processing in background
        this.processJob(job.id);

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/job/:jobId', (req, res) => {
      const job = this.jobs.get(req.params.jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        jobId: job.id,
        status: job.status,
        step: job.step,
        progress: job.progress,
        error: job.error,
        message: job.message,
        createdAt: job.createdAt,
        lastUpdate: job.lastUpdate,
        outputFile: job.outputFile
      });
    });

    this.app.get('/job/:jobId/progress', (req, res) => {
      const jobId = req.params.jobId;
      const job = this.jobs.get(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send current status immediately
      const currentStatus = {
        jobId: job.id,
        status: job.status,
        step: job.step,
        progress: job.progress,
        error: job.error,
        message: job.message,
        lastUpdate: job.lastUpdate
      };
      res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);

      // Set up progress listener for this job
      if (!job.progressListeners) {
        job.progressListeners = [];
      }

      const progressListener = (update) => {
        const progressData = {
          jobId,
          ...update,
          timestamp: new Date().toISOString()
        };
        res.write(`data: ${JSON.stringify(progressData)}\n\n`);
      };

      job.progressListeners.push(progressListener);

      // Clean up on client disconnect
      req.on('close', () => {
        const index = job.progressListeners.indexOf(progressListener);
        if (index > -1) {
          job.progressListeners.splice(index, 1);
        }
      });

      // Send keep-alive every 30 seconds
      const keepAlive = setInterval(() => {
        res.write(`data: {"type":"keepalive","timestamp":"${new Date().toISOString()}"}\n\n`);
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
      });
    });

    this.app.delete('/job/:jobId', async (req, res) => {
      const jobId = req.params.jobId;
      const job = this.jobs.get(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      try {
        await this.fileManager.cleanupJob(jobId);
        this.jobs.delete(jobId);
        
        if (job.status === 'processing') {
          this.activeJobs--;
        }

        res.json({ success: true, message: 'Job deleted' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async processJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      this.activeJobs++;
      this.updateJob(jobId, { status: 'processing', step: 'preparing' });

      // Save uploaded file
      const inputFile = await this.fileManager.saveUploadedFile(jobId, job.uploadedFile);
      console.log(`Job ${jobId}: Input file saved to ${inputFile}`);

      // Validate input file
      this.updateJob(jobId, { step: 'validating', progress: 5, message: 'Validating input file' });
      const validation = await this.pipeline.validateInputFile(inputFile);
      
      if (!validation.valid) {
        throw new Error(`Invalid input file: ${validation.error}`);
      }
      
      console.log(`Job ${jobId}: Validated ${validation.sequenceCount} sequences`);

      // Run the full pipeline
      const progressCallback = (update) => {
        this.updateJob(jobId, {
          step: update.step,
          progress: update.progress,
          message: update.message,
          error: update.error
        });
        
        // Notify SSE listeners
        this.notifyProgressListeners(jobId, update);
      };

      const results = await this.pipeline.processSequences(jobId, inputFile, progressCallback);

      this.updateJob(jobId, { 
        status: 'completed', 
        step: 'finished',
        progress: 100,
        inputFile: inputFile,
        outputFile: results.finalOutput,
        results: results,
        message: 'Pipeline completed successfully'
      });

      console.log(`Job ${jobId}: Pipeline completed successfully`);

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      this.updateJob(jobId, { 
        status: 'failed', 
        error: error.message 
      });
    } finally {
      this.activeJobs--;
    }
  }

  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates, { lastUpdate: new Date() });
      this.jobs.set(jobId, job);
    }
  }

  notifyProgressListeners(jobId, update) {
    const job = this.jobs.get(jobId);
    if (job && job.progressListeners) {
      for (const listener of job.progressListeners) {
        try {
          listener(update);
        } catch (error) {
          console.warn(`Failed to notify progress listener for job ${jobId}:`, error);
        }
      }
    }
  }

  startCleanupTimer() {
    setInterval(async () => {
      try {
        const cleaned = await this.fileManager.cleanupOldJobs(parseInt(options.cleanupHours));
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} old jobs`);
        }
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  start() {
    const port = parseInt(options.port);
    this.app.listen(port, () => {
      console.log(`Taxonium Placer server running on port ${port}`);
      console.log(`Maximum concurrent jobs: ${this.maxJobs}`);
      console.log(`File cleanup interval: ${options.cleanupHours} hours`);
    });
  }
}

if (require.main === module) {
  const server = new TaxoniumPlacerServer();
  server.start();
}

module.exports = TaxoniumPlacerServer;