import atexit
import subprocess
import argparse
import psutil
import os

BACKEND_IMAGE = "theosanderson/taxonium_backend:master"
FRONTEND_IMAGE = "theosanderson/taxonium_frontend:master"

# Parse arguments, main positional argument is a .jsonl.gz file. Optional argument is memory, with default of None.

parser = argparse.ArgumentParser(description='View a taxonium tree.')
parser.add_argument('jsonl_gz', type=str, help='Path to a .jsonl.gz file.')
parser.add_argument('--memory', type=int, default=None, help='Memory in MB for backend.')
parser.add_argument('--no_frontend', action='store_true', help='Do not start the frontend.')
parser.add_argument('--backend_port', type=int, default=5000, help='Port to use for the backend.')
parser.add_argument('--frontend_port', type=int, default=8000, help='Port to use for the frontend.')




args = parser.parse_args()

# relative path to absolute:
args.jsonl_gz = os.path.abspath(args.jsonl_gz)

# Check if docker is installed.
try:
    subprocess.check_call(['docker', '--version'])
except:
    raise Exception('Docker is not installed. Please install Docker to use this tool.')

# Check if docker is running.
try:
    subprocess.check_call(['docker', 'ps'])
except:
    raise Exception('Docker is not running. Please start Docker to use this tool.')

# Check if backend image is available.
try:
    subprocess.check_call(['docker', 'pull', BACKEND_IMAGE])
except:
    raise Exception('Could not pull backend image. Please check your internet connection.')

if not args.no_frontend:
    # Check if frontend image is available.
    try:
        subprocess.check_call(['docker', 'pull', FRONTEND_IMAGE])
    except:
        raise Exception('Could not pull frontend image. Please check your internet connection.')


if args.memory:
    memory = args.memory
else:
    total_memory_in_mb = psutil.virtual_memory().total / 1024 / 1024
    memory = int(total_memory_in_mb * 0.8)
    print(f'No memory specified. Using {memory} MB for the backend. You can modify this with the --memory argument.')





# Start backend

# something like:
#docker run -p 80:80 -v "/Users/MyUserName/Desktop/myfile.jsonl.gz:/mnt/data/myfile.jsonl.gz" -e "DATA_FILE=/mnt/data/myfile.jsonl.gz" -e "MAX_MEM=8000" -e "CONFIG_JSON=config_public.json" theosanderson/taxonium_backend:master

backend_command = ['docker', 'run', '-d', '-p', f'{args.backend_port}:80', '-v', f'"{args.jsonl_gz}:/mnt/data/data.jsonl.gz"', '-e', f'"DATA_FILE=/mnt/data/data.jsonl.gz"', '-e', f'"MAX_MEM={memory}"', '-e', f'"CONFIG_JSON=config_public.json"', BACKEND_IMAGE]

print('Starting backend...')
backend_process = subprocess.Popen(backend_command)
backend_id = backend_process.stdout.read().decode('utf-8').strip()
print(f'Backend started with ID {backend_id}.')
print(f'Backend should appear on port {args.backend_port} in a few minutes.')

# Start frontend
if not args.no_frontend:
    frontend_command = ['docker', 'run', '-d', '-p', f'{args.frontend_port}:80', FRONTEND_IMAGE]
    print('Starting frontend...')
    frontend_process = subprocess.Popen(frontend_command)
    frontend_id = frontend_process.stdout.read().decode('utf-8').strip()
    print(f'Frontend started with ID {frontend_id}.')
    print(f'Frontend should appear on port {args.frontend_port} in a few minutes.')

# Clean up
def cleanup():
    print('Cleaning up...')
    if not args.no_frontend:
        subprocess.check_call(['docker', 'kill', frontend_id])
    subprocess.check_call(['docker', 'kill', backend_id])
    print('Done.')

atexit.register(cleanup)

if args.no_frontend:
    print(f'The backend should be running at http://localhost:{args.backend_port}.')
else:
    print(f'You should be able to access your tree at http://localhost:{args.frontend_port}/?backend=http://localhost:{args.backend_port} in a few minutes.')
