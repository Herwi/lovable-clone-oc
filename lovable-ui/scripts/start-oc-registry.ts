import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const REGISTRY_DIR = path.join(process.cwd(), ".oc-registry");
const REGISTRY_PORT = 3030;

async function startOpenComponentsRegistry() {
  console.log("🚀 Starting OpenComponents registry...\n");

  try {
    // Check if registry is set up
    if (!fs.existsSync(REGISTRY_DIR)) {
      console.log("❌ Registry not found. Running setup first...\n");
      
      // Run setup script
      const setupProcess = spawn("npx", ["tsx", "scripts/setup-oc-registry.ts"], {
        stdio: "inherit"
      });
      
      await new Promise((resolve, reject) => {
        setupProcess.on("close", (code) => {
          if (code === 0) {
            resolve(code);
          } else {
            reject(new Error(`Setup failed with code ${code}`));
          }
        });
      });
      
      console.log("\n✓ Setup completed. Starting registry...\n");
    }

    const configPath = path.join(REGISTRY_DIR, "config.json");
    const startupScriptPath = path.join(REGISTRY_DIR, "start-registry.js");
    
    if (!fs.existsSync(configPath) || !fs.existsSync(startupScriptPath)) {
      throw new Error("Registry configuration or startup script not found");
    }

    // Check if port is already in use
    console.log(`Checking if port ${REGISTRY_PORT} is available...`);
    
    const checkPort = spawn("netstat", ["-an"], { stdio: "pipe" });
    let portInUse = false;
    
    await new Promise((resolve) => {
      let output = "";
      
      checkPort.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      checkPort.on("close", () => {
        if (output.includes(`:${REGISTRY_PORT} `) || output.includes(`:${REGISTRY_PORT}\t`)) {
          portInUse = true;
          console.log(`⚠️  Port ${REGISTRY_PORT} appears to be in use`);
        } else {
          console.log(`✓ Port ${REGISTRY_PORT} is available`);
        }
        resolve(true);
      });
      
      checkPort.on("error", () => {
        console.log("Could not check port availability");
        resolve(true);
      });
    });

    if (portInUse) {
      console.log("\n⚠️  Registry might already be running or port is in use");
      console.log("If the registry is already running, you can access it at:");
      console.log(`http://localhost:${REGISTRY_PORT}/`);
      console.log("\nTo stop the registry, find the process and kill it:");
      console.log(`netstat -ano | findstr :${REGISTRY_PORT}`);
      return;
    }

    // Start the registry
    console.log("\nStarting registry server...\n");
    
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const registryProcess = spawn(npmCmd, ["start"], {
      cwd: REGISTRY_DIR,
      stdio: "inherit",
      shell: true
    });

    // Handle registry process events
    registryProcess.on("error", (error) => {
      console.error("Failed to start registry:", error);
      process.exit(1);
    });

    registryProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Registry process exited with code ${code}`);
      }
    });

    // Handle graceful shutdown
    const shutdown = () => {
      console.log("\n\n👋 Stopping OpenComponents registry...");
      registryProcess.kill("SIGTERM");
      setTimeout(() => {
        registryProcess.kill("SIGKILL");
        process.exit(0);
      }, 5000);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Keep the process alive
    await new Promise(() => {}); // This will keep running until killed

  } catch (error: any) {
    console.error("\n❌ Failed to start registry:", error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  await startOpenComponentsRegistry();
}

main();