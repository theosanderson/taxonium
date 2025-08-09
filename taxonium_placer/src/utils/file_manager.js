const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FileManager {
  constructor(tempDir = 'temp') {
    this.tempDir = tempDir;
    this.jobs = new Map();
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  createJob(originalFilename) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      originalFilename,
      files: [],
      createdAt: new Date(),
      lastAccessed: new Date()
    };
    
    this.jobs.set(jobId, job);
    return job;
  }

  getJobPath(jobId, filename) {
    return path.join(this.tempDir, `${jobId}_${filename}`);
  }

  async createTempFile(jobId, filename, content = null) {
    await this.ensureTempDir();
    
    const filePath = this.getJobPath(jobId, filename);
    
    if (content !== null) {
      await fs.writeFile(filePath, content);
    }
    
    const job = this.jobs.get(jobId);
    if (job) {
      job.files.push(filePath);
      job.lastAccessed = new Date();
    }
    
    return filePath;
  }

  async saveUploadedFile(jobId, uploadedFile) {
    const extension = path.extname(uploadedFile.originalname);
    const filename = `input${extension}`;
    const filePath = this.getJobPath(jobId, filename);
    
    await fs.rename(uploadedFile.path, filePath);
    
    const job = this.jobs.get(jobId);
    if (job) {
      job.files.push(filePath);
      job.inputFile = filePath;
      job.lastAccessed = new Date();
    }
    
    return filePath;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      throw new Error(`Failed to get file size: ${error.message}`);
    }
  }

  async cleanupJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    for (const filePath of job.files) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error.message);
      }
    }

    this.jobs.delete(jobId);
    return true;
  }

  async cleanupOldJobs(maxAgeHours = 24) {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const jobsToClean = [];

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.lastAccessed < cutoff) {
        jobsToClean.push(jobId);
      }
    }

    let cleaned = 0;
    for (const jobId of jobsToClean) {
      if (await this.cleanupJob(jobId)) {
        cleaned++;
      }
    }

    return cleaned;
  }

  getJobInfo(jobId) {
    return this.jobs.get(jobId);
  }

  getAllJobs() {
    return Array.from(this.jobs.values());
  }
}

module.exports = FileManager;