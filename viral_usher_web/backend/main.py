"""FastAPI backend for viral_usher web interface"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import List, Optional
import os
import sys
import boto3
from botocore.exceptions import ClientError
import uuid
from datetime import datetime
from kubernetes import client, config as k8s_config

from viral_usher import ncbi_helper, nextclade_helper, config

# S3 Configuration from environment variables
S3_BUCKET = os.getenv('S3_BUCKET', '')
S3_ENDPOINT_URL = os.getenv('S3_ENDPOINT_URL', '')  # e.g., https://s3.example.com
S3_REGION = os.getenv('S3_REGION', 'us-east-1')
S3_ACCESS_KEY_ID = os.getenv('S3_ACCESS_KEY_ID', '')
S3_SECRET_ACCESS_KEY = os.getenv('S3_SECRET_ACCESS_KEY', '')

# Kubernetes Configuration
K8S_NAMESPACE = os.getenv('K8S_NAMESPACE', 'default')
K8S_JOB_IMAGE = os.getenv('K8S_JOB_IMAGE')  # Set via Helm values (viral_usher main image)
K8S_JOB_IMAGE_PULL_POLICY = os.getenv('K8S_JOB_IMAGE_PULL_POLICY', 'IfNotPresent')
K8S_UPLOAD_IMAGE = os.getenv('K8S_UPLOAD_IMAGE', 'python:3.12-slim')  # Upload sidecar image
K8S_UPLOAD_IMAGE_PULL_POLICY = os.getenv('K8S_UPLOAD_IMAGE_PULL_POLICY', 'IfNotPresent')
K8S_S3_SECRET_NAME = os.getenv('K8S_S3_SECRET_NAME', '')  # Optional: use k8s secret instead of env vars

# Initialize S3 client if configured
s3_client = None
if S3_BUCKET and S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY:
    s3_config = {
        'region_name': S3_REGION,
        'aws_access_key_id': S3_ACCESS_KEY_ID,
        'aws_secret_access_key': S3_SECRET_ACCESS_KEY
    }
    if S3_ENDPOINT_URL:
        s3_config['endpoint_url'] = S3_ENDPOINT_URL

    s3_client = boto3.client('s3', **s3_config)

app = FastAPI(title="Viral Usher Web API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NCBI helper
ncbi = ncbi_helper.NcbiHelper()


# Request/Response models
class SpeciesSearchRequest(BaseModel):
    term: str


class TaxonomyEntry(BaseModel):
    tax_id: str
    sci_name: str


class RefSeqEntry(BaseModel):
    accession: str
    title: str
    strain: Optional[str]


class NextcladeDataset(BaseModel):
    path: str
    name: str
    clade_columns: str


class ConfigRequest(BaseModel):
    refseq_acc: Optional[str] = ""
    refseq_assembly: Optional[str] = ""
    ref_fasta: Optional[str] = ""
    ref_gbff: Optional[str] = ""
    species: str
    taxonomy_id: str
    nextclade_dataset: Optional[str] = ""
    nextclade_clade_columns: Optional[str] = ""
    min_length_proportion: str = config.DEFAULT_MIN_LENGTH_PROPORTION
    max_N_proportion: str = config.DEFAULT_MAX_N_PROPORTION
    max_parsimony: str = config.DEFAULT_MAX_PARSIMONY
    max_branch_length: str = config.DEFAULT_MAX_BRANCH_LENGTH
    extra_fasta: Optional[str] = ""
    workdir: str


class ConfigResponse(BaseModel):
    config_path: str
    config_contents: dict


# API Endpoints


@app.post("/api/search-species", response_model=List[TaxonomyEntry])
async def search_species(request: SpeciesSearchRequest):
    """Search NCBI Taxonomy for species matching the search term"""
    try:
        tax_entries = ncbi.get_taxonomy_entries(f'"{request.term}"')
        return [
            TaxonomyEntry(tax_id=str(entry["tax_id"]), sci_name=entry["sci_name"])
            for entry in tax_entries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/refseqs/{taxid}", response_model=List[RefSeqEntry])
async def get_refseqs(taxid: str):
    """Get RefSeq entries for a given taxonomy ID"""
    try:
        refseq_entries = ncbi.get_refseqs_for_taxid(taxid)
        return [
            RefSeqEntry(
                accession=entry["accession"],
                title=entry["title"],
                strain=entry.get("strain")
            )
            for entry in refseq_entries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/assembly/{refseq_acc}")
async def get_assembly(refseq_acc: str):
    """Get assembly ID for a RefSeq accession"""
    try:
        assembly_id = ncbi.get_assembly_acc_for_refseq_acc(refseq_acc)
        if not assembly_id:
            raise HTTPException(status_code=404, detail="Assembly ID not found")
        return {"assembly_id": assembly_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nextclade-datasets", response_model=List[NextcladeDataset])
async def get_nextclade_datasets(species: Optional[str] = None):
    """Get Nextclade datasets, optionally filtered by species"""
    try:
        datasets = nextclade_helper.nextclade_get_index()

        if species:
            # Search logic from init.py
            matches = []
            species_lower = species.lower()
            for dataset in datasets:
                if species_lower in dataset["name"].lower() or species_lower in dataset["path"].lower():
                    matches.append(dataset)

            # If no matches and species has multiple words, try individual words
            if len(matches) == 0 and ' ' in species:
                for word in species.lower().split(' '):
                    if word in ["human", "virus", "fever", "genotype"] or len(word) < 3:
                        continue
                    for dataset in datasets:
                        if word in dataset["name"].lower() or word in dataset["path"].lower():
                            if dataset not in matches:
                                matches.append(dataset)
                    if matches:
                        break

            datasets = matches

        return [
            NextcladeDataset(
                path=dataset["path"],
                name=dataset["name"],
                clade_columns=','.join(dataset.get("clades", {}).keys())
            )
            for dataset in datasets
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def upload_to_s3(file_content: bytes, filename: str, content_type: str = 'text/plain') -> str:
    """Upload file to S3 and return the S3 key"""
    if not s3_client:
        raise HTTPException(status_code=500, detail="S3 not configured")

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    s3_key = f"uploads/{timestamp}_{unique_id}_{filename}"

    try:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type
        )
        return s3_key
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")


def ensure_upload_script_configmap():
    """Create or update the ConfigMap containing the upload sidecar script"""
    try:
        # Load kubernetes config
        try:
            k8s_config.load_incluster_config()
        except k8s_config.ConfigException:
            k8s_config.load_kube_config()

        core_v1 = client.CoreV1Api()

        # Read the upload script
        script_path = os.path.join(os.path.dirname(__file__), "../upload_sidecar.py")
        with open(script_path, 'r') as f:
            script_content = f.read()

        # Create ConfigMap
        configmap = client.V1ConfigMap(
            metadata=client.V1ObjectMeta(name="upload-sidecar-script"),
            data={"upload_sidecar.py": script_content}
        )

        # Try to create or update
        try:
            core_v1.create_namespaced_config_map(namespace=K8S_NAMESPACE, body=configmap)
        except client.exceptions.ApiException as e:
            if e.status == 409:  # Already exists, update it
                core_v1.replace_namespaced_config_map(
                    name="upload-sidecar-script",
                    namespace=K8S_NAMESPACE,
                    body=configmap
                )
            else:
                raise
    except Exception as e:
        print(f"Warning: Failed to create/update upload script ConfigMap: {e}", file=sys.stderr)


def start_kubernetes_job(config_s3_key: str, job_name: str, no_genbank: bool = False, use_update_mode: bool = False) -> dict:
    """Start a Kubernetes job to process the config file"""
    try:
        # Ensure the upload script ConfigMap exists
        ensure_upload_script_configmap()

        # Load kubernetes config (try in-cluster first, fallback to local kubeconfig)
        try:
            k8s_config.load_incluster_config()
        except k8s_config.ConfigException:
            k8s_config.load_kube_config()

        # Create API client
        batch_v1 = client.BatchV1Api()

        # Build environment variables for the job
        env_vars = [
            client.V1EnvVar(name="CONFIG_S3_KEY", value=config_s3_key),
            client.V1EnvVar(name="S3_BUCKET", value=S3_BUCKET),
            client.V1EnvVar(name="S3_REGION", value=S3_REGION),
        ]

        if S3_ENDPOINT_URL:
            env_vars.append(client.V1EnvVar(name="S3_ENDPOINT_URL", value=S3_ENDPOINT_URL))

        # If using Kubernetes secret for S3 credentials, use envFrom
        # Otherwise, pass credentials as env vars (less secure but works for dev)
        env_from = []
        if K8S_S3_SECRET_NAME:
            env_from.append(client.V1EnvFromSource(
                secret_ref=client.V1SecretEnvSource(name=K8S_S3_SECRET_NAME)
            ))
        else:
            # Fall back to env vars
            env_vars.extend([
                client.V1EnvVar(name="S3_ACCESS_KEY_ID", value=S3_ACCESS_KEY_ID),
                client.V1EnvVar(name="S3_SECRET_ACCESS_KEY", value=S3_SECRET_ACCESS_KEY),
            ])

        # Build S3 URL for config file
        if S3_ENDPOINT_URL:
            config_url = f"{S3_ENDPOINT_URL}/{S3_BUCKET}/{config_s3_key}"
        else:
            config_url = f"https://s3.{S3_REGION}.amazonaws.com/{S3_BUCKET}/{config_s3_key}"

        # Create job without initContainer - pass config URL directly
        job = client.V1Job(
            api_version="batch/v1",
            kind="Job",
            metadata=client.V1ObjectMeta(name=job_name),
            spec=client.V1JobSpec(
                backoff_limit=3,
                template=client.V1PodTemplateSpec(
                    spec=client.V1PodSpec(
                        restart_policy="Never",
                        # Main container to run viral_usher + sidecar for upload
                        containers=[
                            # Main container: viral_usher
                            client.V1Container(
                                name="viral-usher",
                                image=K8S_JOB_IMAGE,
                                image_pull_policy=K8S_JOB_IMAGE_PULL_POLICY,
                                command=["/bin/sh", "-c"],
                                args=[
                                    # Run viral_usher_build with config URL and optional flags
                                    "cd /workspace && "
                                    f"viral_usher_build --config {config_url}"
                                    f"{' --no_genbank' if no_genbank else ''}"
                                    f"{' --update' if use_update_mode else ''} && "
                                    "touch /workspace/.job_complete"
                                ],
                                env=env_vars,
                                env_from=env_from if env_from else None,
                                working_dir="/workspace",
                                volume_mounts=[
                                    client.V1VolumeMount(
                                        name="workspace",
                                        mount_path="/workspace"
                                    )
                                ]
                            ),
                            # Sidecar container: S3 upload
                            client.V1Container(
                                name="upload-sidecar",
                                image=K8S_UPLOAD_IMAGE,
                                image_pull_policy=K8S_UPLOAD_IMAGE_PULL_POLICY,
                                command=["python3", "/scripts/upload_sidecar.py"],
                                env=env_vars + [
                                    client.V1EnvVar(name="WORKDIR", value="/workspace")
                                ],
                                env_from=env_from if env_from else None,
                                volume_mounts=[
                                    client.V1VolumeMount(
                                        name="workspace",
                                        mount_path="/workspace"
                                    ),
                                    client.V1VolumeMount(
                                        name="upload-script",
                                        mount_path="/scripts"
                                    )
                                ]
                            )
                        ],
                        # Shared volume for passing config between containers
                        volumes=[
                            client.V1Volume(
                                name="workspace",
                                empty_dir=client.V1EmptyDirVolumeSource()
                            ),
                            client.V1Volume(
                                name="upload-script",
                                config_map=client.V1ConfigMapVolumeSource(
                                    name="upload-sidecar-script",
                                    default_mode=0o755
                                )
                            )
                        ]
                    )
                )
            )
        )

        # Create the job
        api_response = batch_v1.create_namespaced_job(
            body=job,
            namespace=K8S_NAMESPACE
        )

        return {
            "success": True,
            "job_name": job_name,
            "namespace": K8S_NAMESPACE,
            "uid": api_response.metadata.uid
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kubernetes job creation failed: {str(e)}")


@app.get("/api/job-logs/{job_name}")
async def get_job_logs(job_name: str, request: Request):
    """Get logs from a Kubernetes job"""
    try:
        # Load kubernetes config
        try:
            k8s_config.load_incluster_config()
        except k8s_config.ConfigException:
            k8s_config.load_kube_config()

        core_v1 = client.CoreV1Api()
        batch_v1 = client.BatchV1Api()

        # Get the job to check its status
        try:
            job = batch_v1.read_namespaced_job(name=job_name, namespace=K8S_NAMESPACE)
        except client.exceptions.ApiException as e:
            if e.status == 404:
                # Job doesn't exist yet or was deleted
                return {
                    "job_name": job_name,
                    "status": "not_found",
                    "logs": "Job not found. It may not have been created yet or has been deleted."
                }
            raise HTTPException(status_code=500, detail=f"Error reading job: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading job: {str(e)}")

        # Get pods for this job
        pods = core_v1.list_namespaced_pod(
            namespace=K8S_NAMESPACE,
            label_selector=f"job-name={job_name}"
        )

        if not pods.items:
            return {
                "job_name": job_name,
                "status": "pending",
                "logs": "No pods found yet for this job"
            }

        # Get the most recent pod
        pod = pods.items[-1]
        pod_name = pod.metadata.name

        # Determine job status
        job_status = "running"
        if job.status.succeeded:
            job_status = "succeeded"
        elif job.status.failed:
            job_status = "failed"

        # Get logs from all containers
        logs = {}

        # Check pod phase to provide better messages
        pod_phase = pod.status.phase
        if pod_phase in ["Pending"]:
            logs["info"] = f"Pod is in {pod_phase} phase. Containers have not started yet."
            # Try to get more details about why it's pending
            if pod.status.conditions:
                for condition in pod.status.conditions:
                    if condition.status == "False":
                        logs["info"] += f" {condition.reason}: {condition.message}"

        # Get main container logs (viral-usher)
        try:
            main_logs = core_v1.read_namespaced_pod_log(
                name=pod_name,
                namespace=K8S_NAMESPACE,
                container="viral-usher"
            )
            logs["main"] = main_logs
        except client.exceptions.ApiException as e:
            if e.status == 400 and "ContainerCreating" in str(e):
                logs["main"] = "Main container is being created..."
            elif e.status == 400:
                logs["main"] = "Main container has not started yet"
            else:
                logs["main"] = f"Could not get main container logs: {str(e)}"
        except Exception as e:
            logs["main"] = f"Could not get main container logs: {str(e)}"

        # Get upload sidecar logs
        try:
            upload_logs = core_v1.read_namespaced_pod_log(
                name=pod_name,
                namespace=K8S_NAMESPACE,
                container="upload-sidecar"
            )
            logs["upload"] = upload_logs
        except client.exceptions.ApiException as e:
            if e.status == 400 and "ContainerCreating" in str(e):
                logs["upload"] = "Upload sidecar is being created..."
            elif e.status == 400:
                logs["upload"] = "Upload sidecar has not started yet"
            else:
                logs["upload"] = f"Could not get upload sidecar logs: {str(e)}"
        except Exception as e:
            logs["upload"] = f"Could not get upload sidecar logs: {str(e)}"

        # Parse S3 output from logs if present (check both main and upload logs)
        s3_results = None
        log_to_check = None
        if "upload" in logs and isinstance(logs["upload"], str):
            log_to_check = logs["upload"]
        elif "main" in logs and isinstance(logs["main"], str):
            log_to_check = logs["main"]

        if log_to_check:
            import re
            import json

            # Look for incremental file uploads
            file_urls = []
            bucket = None
            prefix = None
            upload_complete = False

            # Find all incremental file uploads
            for match in re.finditer(r'__S3_FILE_UPLOADED__(.+?)__S3_FILE_END__', log_to_check):
                try:
                    file_info = json.loads(match.group(1))
                    bucket = file_info["bucket"]
                    prefix = file_info["prefix"]

                    # Use hardcoded GitHub Codespaces URL for now
                    url = f"https://bookish-space-happiness-x56rxw7x77q2p5rq-8081.app.github.dev/api/s3-proxy/{bucket}/{file_info['s3_key']}"

                    file_entry = {
                        "filename": file_info["filename"],
                        "url": url,
                        "s3_key": file_info["s3_key"]
                    }

                    # For .jsonl.gz files, mark it for Taxonium (let frontend construct the URL)
                    if file_info["filename"].endswith(".jsonl.gz"):
                        file_entry["is_taxonium"] = True

                    file_urls.append(file_entry)
                except Exception as e:
                    print(f"Error parsing S3 file info: {e}", file=sys.stderr)

            # Check if upload is complete
            if "__S3_UPLOAD_COMPLETE__" in log_to_check:
                upload_complete = True

            # If we have files, create s3_results
            if file_urls:
                s3_results = {
                    "bucket": bucket,
                    "prefix": prefix,
                    "total_files": len(file_urls),
                    "files": file_urls,
                    "upload_complete": upload_complete
                }

            # Also check for old-style batch output (for backwards compatibility)
            if not s3_results:
                match = re.search(r'__VIRAL_USHER_S3_OUTPUT_START__\n(.*?)\n__VIRAL_USHER_S3_OUTPUT_END__', log_to_check, re.DOTALL)
                if match:
                    try:
                        s3_data = json.loads(match.group(1))
                        bucket = s3_data["s3_bucket"]
                        prefix = s3_data["s3_prefix"]

                        # Create download URLs for each file
                        file_urls = []
                        for file_key in s3_data["uploaded_files"]:
                            # Use hardcoded GitHub Codespaces URL for now
                            url = f"https://bookish-space-happiness-x56rxw7x77q2p5rq-8081.app.github.dev/api/s3-proxy/{bucket}/{file_key}"
                            filename = file_key.replace(f"{prefix}/", "")
                            file_entry = {
                                "filename": filename,
                                "url": url,
                                "s3_key": file_key
                            }

                            # For .jsonl.gz files, mark it for Taxonium (let frontend construct the URL)
                            if filename.endswith(".jsonl.gz"):
                                file_entry["is_taxonium"] = True

                            file_urls.append(file_entry)

                        s3_results = {
                            "bucket": bucket,
                            "prefix": prefix,
                            "total_files": s3_data["total_files"],
                            "files": file_urls,
                            "upload_complete": True
                        }
                    except Exception as e:
                        print(f"Error parsing S3 output: {e}", file=sys.stderr)

        return {
            "job_name": job_name,
            "status": job_status,
            "pod_name": pod_name,
            "logs": logs,
            "s3_results": s3_results
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job logs: {str(e)}")


@app.post("/api/generate-config")
async def generate_config(
    no_genbank: str = Form("false"),
    refseq_acc: str = Form(""),
    refseq_assembly: str = Form(""),
    ref_fasta: str = Form(""),
    ref_gbff: str = Form(""),
    species: str = Form(...),
    taxonomy_id: str = Form(...),
    nextclade_dataset: str = Form(""),
    nextclade_clade_columns: str = Form(""),
    min_length_proportion: str = Form(...),
    max_N_proportion: str = Form(...),
    max_parsimony: str = Form(...),
    max_branch_length: str = Form(...),
    workdir: str = Form(...),
    fasta_text: str = Form(""),
    fasta_file: Optional[UploadFile] = File(None),
    ref_fasta_file: Optional[UploadFile] = File(None),
    ref_gbff_file: Optional[UploadFile] = File(None),
    ref_fasta_text: str = Form(""),
    ref_gbff_text: str = Form(""),
    metadata_file: Optional[UploadFile] = File(None),
    metadata_date_column: str = Form(""),
    starting_tree_file: Optional[UploadFile] = File(None),
    starting_tree_url: str = Form("")
):
    """Generate and save a viral_usher config file, optionally with FASTA upload to S3"""
    try:
        import importlib.metadata

        viral_usher_version = importlib.metadata.version('viral_usher')

        # Parse no_genbank flag
        no_genbank_mode = no_genbank.lower() == 'true'

        # Handle reference file uploads or text (for no_genbank mode)
        ref_fasta_s3_key = None
        ref_gbff_s3_key = None
        if no_genbank_mode:
            if ref_fasta_file:
                ref_fasta_content = await ref_fasta_file.read()
                ref_fasta_s3_key = upload_to_s3(ref_fasta_content, ref_fasta_file.filename or "ref.fasta", "text/plain")
            elif ref_fasta_text:
                ref_fasta_content = ref_fasta_text.encode('utf-8')
                ref_fasta_s3_key = upload_to_s3(ref_fasta_content, "ref.fasta", "text/plain")

            if ref_gbff_file:
                ref_gbff_content = await ref_gbff_file.read()
                ref_gbff_s3_key = upload_to_s3(ref_gbff_content, ref_gbff_file.filename or "ref.gbff", "text/plain")
            elif ref_gbff_text:
                ref_gbff_content = ref_gbff_text.encode('utf-8')
                ref_gbff_s3_key = upload_to_s3(ref_gbff_content, "ref.gbff", "text/plain")

        # Handle FASTA upload to S3 (sequences to place)
        fasta_s3_key = None
        if fasta_file:
            fasta_content = await fasta_file.read()
            fasta_s3_key = upload_to_s3(fasta_content, fasta_file.filename or "sequences.fasta", "text/plain")
        elif fasta_text:
            fasta_content = fasta_text.encode('utf-8')
            fasta_s3_key = upload_to_s3(fasta_content, "sequences.fasta", "text/plain")

        # Handle metadata file upload
        metadata_s3_key = None
        if metadata_file:
            metadata_content = await metadata_file.read()
            metadata_s3_key = upload_to_s3(metadata_content, metadata_file.filename or "metadata.tsv", "text/tab-separated-values")

        # Handle starting tree upload (protobuf for update mode)
        starting_tree_s3_key = None
        starting_tree_source_url = None
        if starting_tree_file:
            starting_tree_content = await starting_tree_file.read()
            starting_tree_s3_key = upload_to_s3(starting_tree_content, starting_tree_file.filename or "optimized.pb.gz", "application/gzip")
        elif starting_tree_url:
            starting_tree_source_url = starting_tree_url

        # Build config contents based on mode
        config_contents = {
            "viral_usher_version": viral_usher_version,
            "species": species,
            "taxonomy_id": taxonomy_id,
            "nextclade_dataset": nextclade_dataset or "",
            "nextclade_clade_columns": nextclade_clade_columns or "",
            "min_length_proportion": min_length_proportion,
            "max_N_proportion": max_N_proportion,
            "max_parsimony": max_parsimony,
            "max_branch_length": max_branch_length,
            "workdir": os.path.abspath(workdir),
        }

        if no_genbank_mode:
            # No GenBank mode: use uploaded reference files
            if ref_fasta_s3_key:
                # Convert S3 key to URL for config
                if S3_ENDPOINT_URL:
                    config_contents["ref_fasta"] = f"{S3_ENDPOINT_URL}/{S3_BUCKET}/{ref_fasta_s3_key}"
                else:
                    config_contents["ref_fasta"] = f"https://s3.{S3_REGION}.amazonaws.com/{S3_BUCKET}/{ref_fasta_s3_key}"
            if ref_gbff_s3_key:
                if S3_ENDPOINT_URL:
                    config_contents["ref_gbff"] = f"{S3_ENDPOINT_URL}/{S3_BUCKET}/{ref_gbff_s3_key}"
                else:
                    config_contents["ref_gbff"] = f"https://s3.{S3_REGION}.amazonaws.com/{S3_BUCKET}/{ref_gbff_s3_key}"
            config_contents["refseq_acc"] = ""
            config_contents["refseq_assembly"] = ""
        else:
            # GenBank mode: use RefSeq accession
            config_contents["refseq_acc"] = refseq_acc
            config_contents["refseq_assembly"] = refseq_assembly
            config_contents["ref_fasta"] = ref_fasta
            config_contents["ref_gbff"] = ref_gbff

        # Add extra fasta (sequences to place)
        if fasta_s3_key:
            if S3_ENDPOINT_URL:
                config_contents["extra_fasta"] = f"{S3_ENDPOINT_URL}/{S3_BUCKET}/{fasta_s3_key}"
            else:
                config_contents["extra_fasta"] = f"https://s3.{S3_REGION}.amazonaws.com/{S3_BUCKET}/{fasta_s3_key}"
        else:
            config_contents["extra_fasta"] = ""

        # Add metadata if provided
        if metadata_s3_key:
            if S3_ENDPOINT_URL:
                config_contents["extra_metadata"] = f"{S3_ENDPOINT_URL}/{S3_BUCKET}/{metadata_s3_key}"
            else:
                config_contents["extra_metadata"] = f"https://s3.{S3_REGION}.amazonaws.com/{S3_BUCKET}/{metadata_s3_key}"
            if metadata_date_column:
                config_contents["extra_metadata_date_column"] = metadata_date_column

        # Add starting tree if provided (for update mode)
        # Note: viral_usher expects 'update_tree_input' key, which can be a URL or local path
        if starting_tree_s3_key:
            if S3_ENDPOINT_URL:
                config_contents["update_tree_input"] = f"{S3_ENDPOINT_URL}/{S3_BUCKET}/{starting_tree_s3_key}"
            else:
                config_contents["update_tree_input"] = f"https://s3.{S3_REGION}.amazonaws.com/{S3_BUCKET}/{starting_tree_s3_key}"
        elif starting_tree_source_url:
            config_contents["update_tree_input"] = starting_tree_source_url

        # Create workdir if it doesn't exist
        os.makedirs(workdir, exist_ok=True)

        # Generate config filename
        refseq_part = f"_{refseq_acc}" if refseq_acc else ""
        config_filename = f"viral_usher_config{refseq_part}_{taxonomy_id}.toml"
        config_path = f"{workdir}/{config_filename}"

        # Write config locally
        config.write_config(config_contents, config_path)

        # Upload config to S3
        config_s3_key = None
        job_info = None
        if s3_client:
            with open(config_path, 'rb') as f:
                config_s3_key = upload_to_s3(f.read(), config_filename, "application/toml")

            # Start Kubernetes job to process the config
            job_name = f"viral-usher-{taxonomy_id}-{uuid.uuid4().hex[:8]}"
            # Use update mode if a starting tree was provided
            use_update_mode = bool(starting_tree_s3_key or starting_tree_source_url)
            try:
                job_info = start_kubernetes_job(config_s3_key, job_name, no_genbank_mode, use_update_mode)
            except HTTPException as e:
                # Job creation failed, but config was still created
                job_info = {"success": False, "error": str(e.detail)}

        return {
            "config_path": config_path,
            "config_s3_key": config_s3_key,
            "fasta_s3_key": fasta_s3_key,
            "config_contents": config_contents,
            "s3_bucket": S3_BUCKET if s3_client else None,
            "job_info": job_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/s3-proxy/{bucket}/{s3_key:path}")
async def s3_proxy(bucket: str, s3_key: str):
    """Proxy S3 downloads through the backend"""
    if not s3_client:
        raise HTTPException(status_code=500, detail="S3 not configured")

    try:
        # Get the file from S3
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)

        # Stream the file content
        file_content = response['Body'].read()

        # Determine content type
        content_type = response.get('ContentType', 'application/octet-stream')

        # Return the file
        return Response(
            content=file_content,
            media_type=content_type,
            headers={
                'Content-Disposition': f'attachment; filename="{s3_key.split("/")[-1]}"'
            }
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            raise HTTPException(status_code=404, detail="File not found")
        else:
            raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve static frontend files in production
frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve the React frontend for all non-API routes"""
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")

        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # Serve index.html for client-side routing
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
