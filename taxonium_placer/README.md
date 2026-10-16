# Taxonium Placer

A Docker-based HTTP service for phylogenetic placement and Taxonium visualization. This service accepts FASTA files, processes them through a complete pipeline (alignment → VCF conversion → UShER placement → Taxonium conversion), and provides real-time progress updates.

## Features

- **Complete Pipeline**: minimap2 alignment → samtools/bcftools VCF conversion → UShER placement → taxoniumtools conversion
- **HTTP API**: RESTful endpoints for file upload, job status, and progress tracking
- **Real-time Updates**: Server-Sent Events (SSE) for live progress monitoring
- **Docker-based**: Includes all required bioinformatics tools (minimap2, UShER, samtools, bcftools, taxoniumtools)
- **Resource Management**: Automatic cleanup, concurrent job limits, health checks

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the service
docker-compose up --build

# The service will be available at http://localhost:3000
# API documentation: http://localhost:3000/status
```

### Manual Docker Build

```bash
# Build the Docker image
docker build -t taxonium-placer .

# Run the container
docker run -p 3000:3000 -v $(pwd)/temp:/app/temp -v $(pwd)/reference:/app/reference taxonium-placer
```

### Local Development

```bash
# Install dependencies
npm install

# Start the server (requires bioinformatics tools to be installed)
npm start

# Or for development with auto-reload
npm run dev
```

## API Endpoints

### Core Endpoints

#### `GET /health`
Health check endpoint
```json
{
  "status": "healthy",
  "timestamp": "2025-07-01T23:00:00.000Z",
  "activeJobs": 0,
  "maxJobs": 5
}
```

#### `GET /status`
Server status and statistics
```json
{
  "server": "Taxonium Placer",
  "version": "1.0.0",
  "activeJobs": 0,
  "maxJobs": 5,
  "totalJobs": 12
}
```

#### `GET /tools`
Check available tools and prerequisites
```json
{
  "ready": true,
  "issues": [],
  "tools": {
    "minimap2": {"available": true, "version": "2.24"},
    "usher": {"available": true, "version": "0.6.2"},
    "samtools": {"available": true, "version": "1.17"},
    "bcftools": {"available": true, "version": "1.17"},
    "taxoniumtools": {"available": true, "version": "1.0.0"}
  }
}
```

### Job Management

#### `POST /upload`
Upload FASTA file for processing
```bash
curl -X POST -F "fasta=@sequences.fasta" http://localhost:3000/upload
```
Response:
```json
{
  "jobId": "uuid-string",
  "status": "queued",
  "message": "File uploaded successfully"
}
```

#### `GET /job/{jobId}`
Get job status
```json
{
  "jobId": "uuid-string",
  "status": "processing",
  "step": "alignment",
  "progress": 45,
  "message": "Aligning sequences...",
  "createdAt": "2025-07-01T23:00:00.000Z",
  "lastUpdate": "2025-07-01T23:01:30.000Z"
}
```

#### `GET /job/{jobId}/progress`
Real-time progress stream (Server-Sent Events)
```javascript
const eventSource = new EventSource('/job/uuid-string/progress');
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log(`${data.step}: ${data.progress}% - ${data.message}`);
};
```

#### `DELETE /job/{jobId}`
Delete job and clean up files
```json
{
  "success": true,
  "message": "Job deleted"
}
```

## Pipeline Stages

1. **Upload & Validation** (0-5%): File upload and FASTA format validation
2. **Alignment** (5-25%): minimap2 alignment against reference genome
3. **VCF Conversion** (25-50%): samtools/bcftools variant calling
4. **UShER Placement** (50-80%): Phylogenetic placement on existing tree
5. **Taxonium Conversion** (80-95%): Convert to Taxonium JSONL format
6. **Completion** (100%): Ready for visualization

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `MAX_CONCURRENT_JOBS`: Maximum simultaneous jobs (default: 5)
- `CLEANUP_INTERVAL_HOURS`: File cleanup interval (default: 24)
- `NODE_ENV`: Environment mode (development/production)

### Command Line Options

```bash
node src/server.js --port 3001 --max-jobs 3 --cleanup-hours 12
```

## File Structure

```
taxonium_placer/
├── src/
│   ├── server.js              # Main Express server
│   ├── pipeline/
│   │   ├── pipeline_orchestrator.js  # Main pipeline coordinator
│   │   ├── alignment.js       # minimap2 wrapper
│   │   ├── vcf_conversion.js  # SAM to VCF conversion
│   │   ├── usher_placement.js # UShER phylogenetic placement
│   │   └── taxonium_conversion.js # Taxonium format conversion
│   ├── api/                   # API endpoint handlers
│   └── utils/
│       ├── file_manager.js    # Temporary file management
│       └── process_runner.js  # External command execution
├── reference/
│   ├── reference.fasta        # SARS-CoV-2 reference genome
│   └── tree.pb               # Base phylogenetic tree (UShER format)
├── temp/                     # Temporary processing files
├── Dockerfile               # Container definition
├── docker-compose.yml       # Multi-service setup
└── test_client.html         # Web-based test interface
```

## Testing

### Web Interface
Open `test_client.html` in a browser for a graphical interface to test the service.

### Command Line Testing

```bash
# Check server status
curl http://localhost:3000/status

# Upload a file
curl -X POST -F "fasta=@test_sample.fasta" http://localhost:3000/upload

# Monitor progress (replace JOB_ID)
curl -N http://localhost:3000/job/JOB_ID/progress

# Get final status
curl http://localhost:3000/job/JOB_ID
```

### Sample FASTA File
```
>test_sequence_1
ATCGATCGATCGATCG
>test_sequence_2
GCTAGCTAGCTAGCTA
```

## Production Deployment

### Using nginx (included)
```bash
# Start with nginx reverse proxy
docker-compose --profile production up
```

### Kubernetes
See `helm_charts/` in the main taxonium repository for Kubernetes deployment templates.

### Health Checks
The service includes built-in health checks at `/health` and container health monitoring.

## Troubleshooting

### Common Issues

1. **Tools not available**: Ensure all bioinformatics tools are installed in the container
2. **File upload fails**: Check file size limits (default 100MB)
3. **Jobs stuck**: Check server logs and tool availability
4. **SSE connection issues**: Verify CORS headers and proxy configuration

### Debug Mode
```bash
# Enable detailed logging
NODE_ENV=development npm start
```

### Container Logs
```bash
docker-compose logs -f taxonium-placer
```

## Development

### Local Setup
1. Install Node.js dependencies: `npm install`
2. Install bioinformatics tools (minimap2, UShER, samtools, bcftools, taxoniumtools)
3. Place reference files in `reference/` directory
4. Start development server: `npm run dev`

### Testing Components
```bash
# Test utilities
node test_utils.js

# Test pipeline components
node test_pipeline.js
```

## License

MIT - See main Taxonium repository for details.

## Contributing

This is part of the Taxonium project. Please see the main repository for contribution guidelines.