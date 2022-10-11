import atexit
import subprocess
import argparse
import psutil
import os
import time
import socket

import docker

#Check if Docker is available


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def check_port_is_free(port):
    if is_port_in_use(port):
        raise Exception(
            f"Port {port} is already in use. You can use the --help command to find out how to change the ports used."
        )


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
                    default=5544,
                    help='Port to use for the backend.')
parser.add_argument('--frontend_port',
                    type=int,
                    default=8200,
                    help='Port to use for the frontend.')

args = parser.parse_args()

try:
    client = docker.from_env()
    client.ping()
except docker.errors.DockerException:
    print(
        'Docker is not running. Please install Docker, or start it, and try again.'
    )
    exit(1)

# check ports are available
if not args.no_frontend:
    check_port_is_free(args.frontend_port)
check_port_is_free(args.backend_port)

# get the real full path to the jsonl.gz file
args.jsonl_gz = os.path.realpath(args.jsonl_gz)

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

print('Starting backend...')
backend_id = client.containers.run(BACKEND_IMAGE,
                                   ports={
                                       80: args.backend_port
                                   },
                                   volumes={
                                       args.jsonl_gz: {
                                           'bind': '/mnt/data/data.jsonl.gz',
                                           'mode': 'ro'
                                       }
                                   },
                                   environment={
                                       'DATA_FILE': '/mnt/data/data.jsonl.gz',
                                       'MAXMEM': memory
                                   },
                                   detach=True).id

print(f'Backend started')

# Start frontend
if not args.no_frontend:
    print('Starting frontend...')
    frontend_id = client.containers.run(
        FRONTEND_IMAGE,
        ports={
            80: args.frontend_port
        },
        detach=True,
    ).id
    print(f'Frontend started')


def cleanup():
    try:

        print('Cleaning up, please wait..')
        backend = client.containers.get(backend_id)
        backend.stop()
        if not args.no_frontend:
            frontend = client.containers.get(frontend_id)
            frontend.stop()
        print('Done.')
    except KeyboardInterrupt:
        cleanup()


atexit.register(cleanup)

if args.no_frontend:
    print(
        f'The backend should be running at http://localhost:{args.backend_port}.'
    )
else:
    url = f"http://localhost:{args.frontend_port}/?backend=http://localhost:{args.backend_port}"
    print("\n\n\n\n\n")
    print("#########")
    print(f'You should be able to access your tree at {url} in a few minutes.')
    print("#########")
    # Launch URL in the browser
    try:
        subprocess.run(['xdg-open', url])
    except FileNotFoundError:
        print("Couldn't launch browser, please open the URL manually.")

    print("\n\n\n\n\n")
    print("\n\n\n\n\n")
    time.sleep(15)

import time

backend = client.containers.get(backend_id)


def main():
    # just display the backend logs, continuously
    while True:
        for line in backend.logs(stream=True):
            print(line.decode('utf-8').strip())
        time.sleep(1)
