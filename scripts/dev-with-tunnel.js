const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TunnelManager {
  constructor() {
    this.ngrokProcess = null;
    this.nextProcess = null;
    this.envPath = path.join(__dirname, '../apps/web/.env.local');
    this.isWindows = process.platform === 'win32';
  }

  async start() {
    console.log('🔄 VSHAD RoboSocial - Auto-Tunnel Startup');
    console.log('═══════════════════════════════════════');
    
    try {
      // Step 1: Kill any existing ngrok processes
      await this.killExistingNgrok();
      
      // Step 2: Start ngrok tunnel
      console.log('🚀 Starting ngrok tunnel...');
      await this.startNgrok();
      
      // Step 3: Wait and get tunnel URL
      console.log('⏳ Waiting for tunnel to establish...');
      await this.sleep(4000); // Wait 4 seconds
      
      const tunnelUrl = await this.getTunnelUrl();
      
      if (!tunnelUrl) {
        throw new Error('Failed to get tunnel URL');
      }
      
      console.log(`📡 Tunnel active: ${tunnelUrl}`);
      
      // Step 4: Update environment variables
      await this.updateEnvFile(tunnelUrl);
      console.log('✅ Environment variables updated');
      
      // Step 5: Start Next.js
      console.log('⚡ Starting Next.js development server...');
      console.log('═══════════════════════════════════════');
      await this.startNextJs();
      
    } catch (error) {
      console.error('❌ Startup failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  async killExistingNgrok() {
    try {
      if (this.isWindows) {
        await execAsync('taskkill /f /im ngrok.exe 2>nul || echo "No existing ngrok processes"');
      } else {
        await execAsync('pkill ngrok || echo "No existing ngrok processes"');
      }
    } catch (error) {
      // Ignore errors - just cleanup attempt
    }
  }

  async startNgrok() {
    return new Promise((resolve, reject) => {
      const ngrokCmd = this.isWindows ? 'ngrok.exe' : 'ngrok';
      
      this.ngrokProcess = spawn(ngrokCmd, ['http', '3000'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: this.isWindows // Use shell on Windows to resolve PATH
      });

      this.ngrokProcess.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error('ngrok not found. Please install: npm install -g ngrok'));
        } else {
          reject(error);
        }
      });

      // Give ngrok time to start
      setTimeout(resolve, 2000);
    });
  }

  async getTunnelUrl() {
    const maxRetries = 10;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // Use dynamic import for node-fetch compatibility
        const response = await fetch('http://localhost:4040/api/tunnels');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const tunnel = data.tunnels?.find(t => t.proto === 'https');
        
        if (tunnel?.public_url) {
          return tunnel.public_url;
        }
        
        throw new Error('HTTPS tunnel not found');
        
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Failed to get tunnel URL after ${maxRetries} attempts: ${error.message}`);
        }
        
        console.log(`🔄 Retry ${retries}/${maxRetries} - Checking tunnel status...`);
        await this.sleep(1000);
      }
    }
  }

  async updateEnvFile(tunnelUrl) {
    try {
      if (!fs.existsSync(this.envPath)) {
        throw new Error('.env.local file not found at ' + this.envPath);
      }

      let envContent = fs.readFileSync(this.envPath, 'utf8');
      
      // Update NEXT_PUBLIC_APP_URL
      const urlRegex = /NEXT_PUBLIC_APP_URL="[^"]*"/;
      const newUrlLine = `NEXT_PUBLIC_APP_URL="${tunnelUrl}"`;
      
      if (urlRegex.test(envContent)) {
        envContent = envContent.replace(urlRegex, newUrlLine);
      } else {
        // Add if not exists
        envContent += `\n\n# Auto-generated tunnel URL\n${newUrlLine}\n`;
      }
      
      fs.writeFileSync(this.envPath, envContent);
      
      console.log(`📝 Updated: NEXT_PUBLIC_APP_URL="${tunnelUrl}"`);
      
    } catch (error) {
      throw new Error(`Failed to update environment file: ${error.message}`);
    }
  }

  async startNextJs() {
    return new Promise((resolve, reject) => {
      const webDir = path.join(__dirname, '../apps/web');
      
      // Use exec instead of spawn for better Windows compatibility
      console.log(`🔧 Starting from directory: ${webDir}`);
      
      if (this.isWindows) {
        // Use cmd.exe on Windows to ensure PATH is available
        this.nextProcess = spawn('cmd', ['/c', 'pnpm dev'], {
          stdio: 'inherit',
          cwd: webDir,
          shell: true
        });
      } else {
        this.nextProcess = spawn('pnpm', ['dev'], {
          stdio: 'inherit',
          cwd: webDir
        });
      }

      this.nextProcess.on('error', (error) => {
        console.error('Failed to start Next.js:', error.message);
        reject(error);
      });
      
      this.nextProcess.on('spawn', () => {
        console.log('✅ Next.js process started successfully');
        resolve();
      });
      
      // Fallback resolve after 2 seconds
      setTimeout(() => {
        if (!this.nextProcess.killed) {
          resolve();
        }
      }, 2000);
    });
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up processes...');
    
    if (this.nextProcess && !this.nextProcess.killed) {
      if (this.isWindows) {
        // More aggressive cleanup on Windows
        try {
          await execAsync(`taskkill /f /pid ${this.nextProcess.pid} 2>nul || echo "Process cleanup"`);
        } catch (error) {
          // Ignore cleanup errors
        }
      } else {
        this.nextProcess.kill('SIGTERM');
      }
    }
    
    if (this.ngrokProcess && !this.ngrokProcess.killed) {
      if (this.isWindows) {
        try {
          await execAsync('taskkill /f /im ngrok.exe 2>nul || echo "ngrok cleanup"');
        } catch (error) {
          // Ignore cleanup errors
        }
      } else {
        this.ngrokProcess.kill('SIGTERM');
      }
    }
    
    await this.sleep(1000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down...');
  if (global.tunnelManager) {
    await global.tunnelManager.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (global.tunnelManager) {
    await global.tunnelManager.cleanup();
  }
  process.exit(0);
});

// Start the tunnel manager
const tunnelManager = new TunnelManager();
global.tunnelManager = tunnelManager;
tunnelManager.start();