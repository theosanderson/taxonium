#!/usr/bin/env python3
"""
Sidecar container script for uploading viral_usher results to S3.
This script waits for the main viral_usher container to complete,
then uploads all results from the shared workspace to S3.
"""
import os
import sys
import time
import json
from pathlib import Path


def wait_for_completion(marker_file: str, timeout: int = 3600):
    """Wait for the main container to create a completion marker file"""
    print(f"Waiting for completion marker: {marker_file}")
    start_time = time.time()

    while True:
        if os.path.exists(marker_file):
            print(f"✓ Completion marker found after {int(time.time() - start_time)}s")
            return True

        # Check for timeout
        elapsed = time.time() - start_time
        if elapsed > timeout:
            print(f"✗ Timeout waiting for completion marker after {timeout}s", file=sys.stderr)
            return False

        # Print progress every 30 seconds
        if int(elapsed) % 30 == 0 and elapsed > 0:
            print(f"  Still waiting... ({int(elapsed)}s elapsed)")

        time.sleep(5)


def upload_directory_to_s3(local_directory, bucket, s3_prefix):
    """Upload all files in a directory to S3, preserving directory structure"""
    import boto3

    s3_client = boto3.client(
        's3',
        endpoint_url=os.environ.get('S3_ENDPOINT_URL'),
        aws_access_key_id=os.environ.get('S3_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('S3_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('S3_REGION', 'us-east-1')
    )

    local_path = Path(local_directory)
    uploaded_files = []

    print(f"\nUploading results from {local_directory} to s3://{bucket}/{s3_prefix}/")
    print("__S3_UPLOAD_START__")
    sys.stdout.flush()

    for file_path in local_path.rglob('*'):
        if file_path.is_file():
            # Skip the completion marker file
            if file_path.name == ".job_complete":
                continue

            # Calculate relative path for S3 key
            relative_path = file_path.relative_to(local_path)
            s3_key = f"{s3_prefix}/{relative_path}"

            print(f"  Uploading {relative_path} -> s3://{bucket}/{s3_key}")

            try:
                s3_client.upload_file(str(file_path), bucket, s3_key)
                uploaded_files.append(s3_key)

                # Output incremental file info as JSON after each upload
                file_info = {
                    "filename": str(relative_path),
                    "s3_key": s3_key,
                    "bucket": bucket,
                    "prefix": s3_prefix
                }
                print(f"__S3_FILE_UPLOADED__{json.dumps(file_info)}__S3_FILE_END__")
                sys.stdout.flush()
            except Exception as e:
                print(f"  ERROR uploading {file_path}: {e}", file=sys.stderr)

    print("__S3_UPLOAD_COMPLETE__")
    print(f"\nSuccessfully uploaded {len(uploaded_files)} files to S3")
    sys.stdout.flush()
    return uploaded_files


def main():
    """Wait for viral_usher to complete, then upload results to S3"""

    print("=" * 80)
    print("S3 Upload Sidecar Starting")
    print("=" * 80)

    # Configuration
    workdir = os.environ.get('WORKDIR', '/workspace')
    marker_file = os.path.join(workdir, '.job_complete')
    s3_bucket = os.environ.get('S3_BUCKET')

    if not s3_bucket:
        print("\nERROR: S3_BUCKET not set, cannot upload results", file=sys.stderr)
        sys.exit(1)

    # Wait for main container to complete
    if not wait_for_completion(marker_file):
        print("\nERROR: Main container did not complete in time", file=sys.stderr)
        sys.exit(1)

    # Create S3 prefix from config key if available, otherwise use timestamp
    config_s3_key = os.environ.get('CONFIG_S3_KEY', '')
    if config_s3_key:
        # Extract a meaningful name from the config path
        s3_prefix = config_s3_key.replace('uploads/', '').replace('_config.toml', '').replace('.toml', '')
        s3_prefix = f"results/{s3_prefix}"
    else:
        # Fallback to timestamp-based prefix
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        s3_prefix = f"results/{timestamp}"

    print(f"\nStarting upload to s3://{s3_bucket}/{s3_prefix}/")

    try:
        # Install boto3 if not available (for python:3.12-slim base image)
        try:
            import boto3
        except ImportError:
            print("Installing boto3...")
            import subprocess
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", "boto3"], check=True)
            import boto3

        uploaded_files = upload_directory_to_s3(workdir, s3_bucket, s3_prefix)

        print("\n" + "=" * 80)
        print(f"Results uploaded to s3://{s3_bucket}/{s3_prefix}/")
        print("=" * 80)
        print("\nUploaded files:")
        for f in uploaded_files[:10]:
            print(f"  - {f}")
        if len(uploaded_files) > 10:
            print(f"  ... and {len(uploaded_files) - 10} more files")

        # Output structured JSON for the backend to parse
        output_data = {
            "s3_bucket": s3_bucket,
            "s3_prefix": s3_prefix,
            "uploaded_files": uploaded_files,
            "total_files": len(uploaded_files)
        }
        print("\n__VIRAL_USHER_S3_OUTPUT_START__")
        print(json.dumps(output_data))
        print("__VIRAL_USHER_S3_OUTPUT_END__")

        print("\n" + "=" * 80)
        print("Upload Sidecar Complete")
        print("=" * 80)

    except Exception as e:
        print(f"\nERROR uploading results to S3: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
