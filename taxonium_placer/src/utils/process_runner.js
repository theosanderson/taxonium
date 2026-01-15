const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProcessRunner {
  static async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`Running: ${command} ${args.join(' ')}`);
      
      const process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.onProgress) {
          options.onProgress(data.toString());
        }
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        if (options.onProgress) {
          options.onProgress(data.toString());
        }
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  static async checkCommand(command) {
    try {
      await this.runCommand('which', [command]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getCommandVersion(command, versionFlag = '--version') {
    try {
      const result = await this.runCommand(command, [versionFlag]);
      return result.stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get version for ${command}: ${error.message}`);
    }
  }
}

module.exports = ProcessRunner;