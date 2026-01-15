# Viral Usher Web Backend

FastAPI backend for the Viral Usher tree builder interface. The frontend is part of the main Taxonium website.

## Overview

This backend provides API endpoints for:
- Searching NCBI Taxonomy for virus species
- Fetching RefSeq reference sequences
- Retrieving assembly information
- Searching Nextclade datasets
- Generating Viral Usher configuration files
- Creating Kubernetes jobs to run tree building tasks
- Managing file uploads to S3

## Development Setup

### Backend

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Run the server:
```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /api/search-species` - Search NCBI Taxonomy
- `GET /api/refseqs/{taxid}` - Get RefSeq entries for a taxonomy ID
- `GET /api/assembly/{refseq_acc}` - Get assembly ID for a RefSeq accession
- `GET /api/nextclade-datasets?species={name}` - Search Nextclade datasets
- `POST /api/generate-config` - Generate configuration and launch job
- `GET /api/job-logs/{job_name}` - Get logs for a running or completed job

## Environment Variables

### S3 Configuration

Required for file storage:

```bash
S3_BUCKET=your-bucket-name
S3_ENDPOINT_URL=https://s3.example.com  # Optional, for non-AWS S3
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

### Kubernetes Configuration

The backend creates Kubernetes jobs to run tree building tasks. It uses the in-cluster config by default.

## Docker Build

Build the Docker image:
```bash
docker build -t viral-usher-web .
```

Run the container:
```bash
docker run -p 8000:8000 \
  -v viral_usher_data:/data \
  -e S3_BUCKET=your-bucket \
  viral-usher-web
```

## Kubernetes Deployment

Deploy using Helm (see `helm/viral-usher-web/`):

```bash
helm install viral-usher ./helm/viral-usher-web \
  --namespace viral-usher --create-namespace
```

The Helm chart includes:
- FastAPI backend deployment
- MinIO for S3-compatible storage (optional)
- RBAC for creating Kubernetes jobs
- Persistent volume for `/data` directory

See `CLAUDE.md` for detailed Kubernetes deployment instructions.

## Architecture

The backend:
1. Receives tree building requests from the frontend
2. Fetches reference data from NCBI APIs
3. Uploads user files to S3
4. Creates a Kubernetes job with the viral_usher worker image
5. Monitors job progress and logs
6. Makes output files available via S3 presigned URLs

The worker jobs run in separate pods with the full viral_usher toolchain.
