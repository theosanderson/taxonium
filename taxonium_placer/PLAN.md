# Taxonium Placer Service - Implementation Plan

## Overview
Build a Docker-based service that processes input FASTA files through a complete phylogenetic placement pipeline: alignment → VCF conversion → tree placement → Taxonium conversion → web hosting, with real-time progress feedback over HTTP.

## Architecture

### Core Pipeline Components
1. **HTTP File Upload API** - Accept FASTA files and provide progress updates
2. **Minimap2 Alignment** - Align sequences to reference genome
3. **VCF Conversion** - Convert alignment to VCF format for Usher
4. **Usher Placement** - Place sequences on existing phylogenetic tree
5. **Taxonium Conversion** - Convert placed tree to Taxonium format using CPP tools
6. **Taxonium Server** - Host the resulting visualization

### Technology Stack
- **Base Image**: Node.js 18-alpine (following existing Dockerfile patterns)
- **Web Framework**: Express.js with CORS (consistent with taxonium_backend)
- **Progress Updates**: WebSocket or Server-Sent Events (SSE)
- **File Processing**: Temporary filesystem with cleanup
- **External Tools**: minimap2, usher, taxoniumtools_cpp

## Implementation Plan

### Phase 1: Project Structure & Dependencies
```
taxonium_placer/
├── Dockerfile
├── package.json
├── src/
│   ├── server.js              # Main Express server
│   ├── pipeline/
│   │   ├── alignment.js       # Minimap2 wrapper
│   │   ├── vcf_conversion.js  # Alignment to VCF
│   │   ├── usher_placement.js # Usher tree placement
│   │   └── taxonium_conversion.js # CPP tools wrapper
│   ├── api/
│   │   ├── upload.js          # File upload endpoint
│   │   ├── progress.js        # Progress tracking
│   │   └── status.js          # Job status endpoints
│   └── utils/
│       ├── file_manager.js    # Temp file handling
│       └── process_runner.js  # External command execution
├── reference/
│   ├── reference.fasta        # Reference genome
│   └── tree.pb                # Base phylogenetic tree (Usher format)
└── temp/                      # Temporary processing directory
```

### Phase 2: Docker Environment Setup

#### Base Dependencies Installation
```dockerfile
FROM continuumio/miniconda3:latest

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Create conda environment with bioinformatics tools
RUN conda create -n biotools python=3.9 && \
    conda install -n biotools -c bioconda \
    usher \
    minimap2 \
    samtools \
    bcftools

# Add conda environment to PATH
ENV PATH="/opt/conda/envs/biotools/bin:$PATH"

# Build and install taxoniumtools_cpp
COPY taxoniumtools_cpp/ /tmp/taxoniumtools_cpp/
RUN cd /tmp/taxoniumtools_cpp && \
    mkdir build && cd build && \
    cmake .. && make -j$(nproc) && \
    cp taxoniumtools /usr/local/bin/ && \
    rm -rf /tmp/taxoniumtools_cpp
```

#### Application Setup
```dockerfile
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

### Phase 3: Core HTTP API

#### Main Server (src/server.js)
```javascript
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// File upload configuration
const storage = multer.diskStorage({
  destination: 'temp/',
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// Job tracking
const jobs = new Map();

// API Routes
app.post('/upload', upload.single('fasta'), handleUpload);
app.get('/status/:jobId', getJobStatus);
app.get('/progress/:jobId', getProgressStream); // SSE endpoint
app.get('/result/:jobId', getResult);
app.delete('/job/:jobId', cleanupJob);

app.listen(3000, () => {
  console.log('Taxonium Placer service running on port 3000');
});
```

#### Progress Tracking System
- **Job States**: `queued`, `aligning`, `converting`, `placing`, `processing`, `serving`, `completed`, `failed`
- **Progress Updates**: Percentage completion, current step, estimated time remaining
- **Real-time Communication**: Server-Sent Events for web clients

### Phase 4: Pipeline Implementation

#### Step 1: Alignment (src/pipeline/alignment.js)
```javascript
async function alignToReference(fastaPath, jobId, progressCallback) {
  const outputPath = `temp/${jobId}_aligned.sam`;
  
  progressCallback({ step: 'aligning', progress: 0 });
  
  const command = `minimap2 -ax asm20 reference/reference.fasta ${fastaPath}`;
  await runCommand(command, outputPath, (progress) => {
    progressCallback({ step: 'aligning', progress });
  });
  
  return outputPath;
}
```

#### Step 2: VCF Conversion (src/pipeline/vcf_conversion.js)
```javascript
async function samToVcf(samPath, jobId, progressCallback) {
  progressCallback({ step: 'converting', progress: 0 });
  
  // Custom conversion logic or external tool
  const vcfPath = `temp/${jobId}_variants.vcf`;
  
  // Implementation depends on specific VCF format requirements for Usher
  // May involve samtools, bcftools, or custom parsing
  
  return vcfPath;
}
```

#### Step 3: Usher Placement (src/pipeline/usher_placement.js)
```javascript
async function placeOnTree(vcfPath, jobId, progressCallback) {
  progressCallback({ step: 'placing', progress: 0 });
  
  const outputTree = `temp/${jobId}_placed.pb`;
  const command = `usher -i reference/tree.pb -v ${vcfPath} -o ${outputTree}`;
  
  await runCommand(command, null, (progress) => {
    progressCallback({ step: 'placing', progress });
  });
  
  return outputTree;
}
```

#### Step 4: Taxonium Conversion (src/pipeline/taxonium_conversion.js)
```javascript
async function convertToTaxonium(treePath, jobId, progressCallback) {
  progressCallback({ step: 'processing', progress: 0 });
  
  const outputJsonl = `temp/${jobId}_taxonium.jsonl`;
  const command = `taxoniumtools ${treePath} --output ${outputJsonl}`;
  
  await runCommand(command, null, (progress) => {
    progressCallback({ step: 'processing', progress });
  });
  
  return outputJsonl;
}
```

### Phase 5: Taxonium Server Integration

#### Dynamic Server Spawning
```javascript
async function startTaxoniumServer(jsonlPath, jobId) {
  const port = 4000 + parseInt(jobId.slice(-3), 16) % 1000; // Dynamic port
  
  const serverProcess = spawn('node', [
    '../taxonium_backend/server.js',
    '--data-file', jsonlPath,
    '--port', port.toString()
  ]);
  
  // Store process reference for cleanup
  jobs.get(jobId).serverProcess = serverProcess;
  jobs.get(jobId).serverPort = port;
  
  return `http://localhost:${port}`;
}
```

### Phase 6: Progress Communication

#### Server-Sent Events Implementation
```javascript
app.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const job = jobs.get(jobId);
  if (!job) {
    res.write('data: {"error": "Job not found"}\n\n');
    res.end();
    return;
  }
  
  // Send current status
  res.write(`data: ${JSON.stringify(job.status)}\n\n`);
  
  // Set up progress listener
  job.progressListeners = job.progressListeners || [];
  job.progressListeners.push((update) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  });
  
  req.on('close', () => {
    // Remove listener on client disconnect
    const index = job.progressListeners.indexOf(progressListener);
    if (index > -1) job.progressListeners.splice(index, 1);
  });
});
```

### Phase 7: Resource Management

#### File Cleanup Strategy
- **Temporary Files**: Auto-cleanup after 24 hours
- **Result Caching**: Keep results for 7 days
- **Process Management**: Graceful shutdown of spawned servers
- **Memory Limits**: Container resource constraints

#### Error Handling
- **Validation**: Input file format checking
- **Pipeline Failures**: Graceful error reporting
- **Resource Limits**: Queue management for concurrent jobs
- **Timeout Handling**: Maximum processing time limits

### Phase 8: API Documentation

#### Endpoints

##### POST /upload
Upload FASTA file for processing
- **Input**: multipart/form-data with 'fasta' file
- **Response**: `{ jobId: string, status: string }`

##### GET /status/:jobId
Get current job status
- **Response**: `{ jobId, status, step, progress, error?, result? }`

##### GET /progress/:jobId
Real-time progress stream (SSE)
- **Response**: Event stream with status updates

##### GET /result/:jobId
Get final result URL
- **Response**: `{ taxoniumUrl: string, jobId: string }`

##### DELETE /job/:jobId
Clean up job resources
- **Response**: `{ success: boolean }`

### Phase 9: Testing Strategy

#### Unit Tests
- Pipeline component validation
- File processing utilities
- API endpoint functionality

#### Integration Tests
- End-to-end pipeline execution
- Progress tracking accuracy
- Error condition handling

#### Performance Tests
- Concurrent job processing
- Memory usage validation
- Processing time benchmarks

### Phase 10: Deployment Configuration

#### Docker Compose Setup
```yaml
version: '3.8'
services:
  taxonium-placer:
    build: .
    ports:
      - "3000:3000"
      - "4000-5000:4000-5000"  # Dynamic server port range
    volumes:
      - ./temp:/app/temp
      - ./reference:/app/reference
    environment:
      - NODE_ENV=production
      - MAX_CONCURRENT_JOBS=5
      - CLEANUP_INTERVAL_HOURS=24
```

#### Kubernetes Deployment
- Helm chart following existing taxonium patterns
- Persistent volume for reference data
- Resource limits and requests
- Health checks and liveness probes

## Success Criteria

1. **Functional Requirements**
   - ✅ Accept FASTA file uploads via HTTP
   - ✅ Process through complete pipeline (align → VCF → place → convert → serve)
   - ✅ Provide real-time progress updates
   - ✅ Host final Taxonium visualization
   - ✅ Clean resource management

2. **Performance Requirements**
   - Process small datasets (< 100 sequences) in under 5 minutes
   - Support concurrent job processing (5+ simultaneous jobs)
   - Memory efficient (< 2GB per job)

3. **Reliability Requirements**
   - Graceful error handling and reporting
   - Automatic cleanup of temporary resources
   - Robust progress tracking

4. **Integration Requirements**
   - Compatible with existing Taxonium ecosystem
   - Deployable via Docker/Kubernetes
   - RESTful API following project conventions

## Timeline Estimate

- **Week 1**: Project setup, Docker environment, basic API structure
- **Week 2**: Pipeline implementation (minimap2, VCF conversion, Usher integration)
- **Week 3**: Taxonium conversion, server spawning, progress tracking
- **Week 4**: Testing, optimization, documentation, deployment configuration

## Risk Mitigation

1. **External Tool Dependencies**: Pre-built binaries, version pinning
2. **Resource Constraints**: Queue management, timeout limits
3. **Concurrent Processing**: Job isolation, resource monitoring
4. **Integration Complexity**: Incremental testing, fallback strategies

This plan provides a comprehensive roadmap for building a production-ready Taxonium placement service that integrates seamlessly with the existing ecosystem while providing a robust, user-friendly phylogenetic placement pipeline.