import atexit
import subprocess
import argparse
import psutil
import os
import time

BACKEND_IMAGE = "theosanderson/taxonium_backend:master"
FRONTEND_IMAGE = "theosanderson/taxonium_frontend:master"

# Parse arguments, main positional argument is a .jsonl.gz file. Optional argument is memory, with default of None.

parser = argparse.ArgumentParser(description='View a taxonium tree.')
parser.add_argument('jsonl_gz', type=str, help='Path to a .jsonl.gz file.')
parser.add_argument('--memory',
                    type=int,
                    default=None,
                    help='Memory in MB for backend.')
parser.add_argument('--no_frontend',
                    action='store_true',
                    help='Do not start the frontend.')
parser.add_argument('--backend_port',
                    type=int,
                    default=5000,
                    help='Port to use for the backend.')
parser.add_argument('--frontend_port',
                    type=int,
                    default=8000,
                    help='Port to use for the frontend.')

args = parser.parse_args()

# get the real full path to the jsonl.gz file
args.jsonl_gz = os.path.realpath(args.jsonl_gz)

# Check if docker is installed.
try:
    subprocess.check_call(['docker', '--version'])
except:
    raise Exception(
        'Docker is not installed. Please install Docker to use this tool.')

# Check if docker is running.
try:
    subprocess.check_call(['docker', 'ps'])
except:
    raise Exception(
        'Docker is not running. Please start Docker to use this tool.')

# Check if backend image is available.
try:
    subprocess.check_call(['docker', 'pull', BACKEND_IMAGE])
except:
    raise Exception(
        'Could not pull backend image. Please check your internet connection.')

if not args.no_frontend:
    # Check if frontend image is available.
    try:
        subprocess.check_call(['docker', 'pull', FRONTEND_IMAGE])
    except:
        raise Exception(
            'Could not pull frontend image. Please check your internet connection.'
        )

if args.memory:
    memory = args.memory
else:
    total_memory_in_mb = psutil.virtual_memory().total / 1024 / 1024
    memory = int(total_memory_in_mb * 0.8)
    print(
        f'No memory specified. Using {memory} MB for the backend. You can modify this with the --memory argument.'
    )

# Start backend

# something like:
#docker run -p 80:80 -v "/Users/MyUserName/Desktop/myfile.jsonl.gz:/mnt/data/myfile.jsonl.gz" -e "DATA_FILE=/mnt/data/myfile.jsonl.gz" -e "MAX_MEM=8000" -e "CONFIG_JSON=config_public.json" theosanderson/taxonium_backend:master

backend_command = [
    'docker', 'run', '-d', '-p', f'{args.backend_port}:80', '-v',
    f'{args.jsonl_gz}:/mnt/data/data.jsonl.gz:ro', '-e',
    f'DATA_FILE=/mnt/data/data.jsonl.gz', '-e', f'MAX_MEM={memory}', '-e',
    f'CONFIG_JSON=config_public.json', BACKEND_IMAGE
]

print('Starting backend...')
print(f"Running command: {' '.join(backend_command)}")
backend_process = subprocess.Popen(backend_command,
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE)


def wait_for_first_line_of_process(process, timeout=10):
    start_time = time.time()
    while True:
        if time.time() - start_time > timeout:
            raise Exception('Timeout waiting for first line of process.')
        line = process.stdout.readline()
        if line:
            return line


backend_id = wait_for_first_line_of_process(backend_process).decode(
    'utf-8').strip()
print(f'Backend started with id {backend_id}.')

# Start frontend
if not args.no_frontend:
    frontend_command = [
        'docker', 'run', '-d', '-p', f'{args.frontend_port}:80', FRONTEND_IMAGE
    ]
    print('Starting frontend...')
    frontend_id = subprocess.check_output(frontend_command).decode(
        'utf-8').strip()


# Clean up
def cleanup():
    print('Cleaning up...')
    if not args.no_frontend:
        subprocess.check_call(['docker', 'kill', frontend_id])
    subprocess.check_call(['docker', 'kill', backend_id])
    print('Done.')


atexit.register(cleanup)

if args.no_frontend:
    print(
        f'The backend should be running at http://localhost:{args.backend_port}.'
    )
else:
    print(
        f'You should be able to access your tree at http://localhost:{args.frontend_port}/?backend=http://localhost:{args.backend_port} in a few minutes.'
    )

import time


def main():
    # echo backend output from stderr or stdout to console
    while True:
        line = backend_process.stdout.readline()
        if line:
            print(line.decode('utf-8').strip())
        line2 = backend_process.stderr.readline()
        if line2:
            print(line2.decode('utf-8').strip())
        if not line and not line2:
            time.sleep(0.1)
