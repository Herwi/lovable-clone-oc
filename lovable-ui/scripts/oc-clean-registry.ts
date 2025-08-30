import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

const REGISTRY_DIR = path.join(process.cwd(), ".oc-registry");
const COMPONENTS_DIR = path.join(REGISTRY_DIR, "components");
const REGISTRY_PORT = 3030;

async function cleanRegistry() {
  console.log("🧹 OpenComponents Registry Cleaner\n");

  try {
    // Check what we're going to clean
    console.log("🔍 Analyzing registry...");
    
    if (!fs.existsSync(REGISTRY_DIR)) {
      console.log("✅ Registry directory doesn't exist - nothing to clean");
      return;
    }

    let componentsCount = 0;
    let totalSize = 0;

    if (fs.existsSync(COMPONENTS_DIR)) {
      const components = fs.readdirSync(COMPONENTS_DIR).filter(item => {
        return fs.statSync(path.join(COMPONENTS_DIR, item)).isDirectory();
      });
      componentsCount = components.length;

      // Calculate total size
      for (const comp of components) {
        totalSize += getDirectorySize(path.join(COMPONENTS_DIR, comp));
      }
    }

    console.log(`Found ${componentsCount} components (${(totalSize / 1024).toFixed(2)} KB total)`);

    // Check if registry is running
    console.log("\n🔍 Checking if registry is running...");
    let isRunning = false;
    
    const checkPort = spawn("netstat", ["-an"], { stdio: "pipe" });
    
    await new Promise((resolve) => {
      let output = "";
      
      checkPort.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      checkPort.on("close", () => {
        if (output.includes(`:${REGISTRY_PORT} `) || output.includes(`:${REGISTRY_PORT}\t`)) {
          isRunning = true;
        }
        resolve(true);
      });
      
      checkPort.on("error", () => {
        resolve(true);
      });
    });

    if (isRunning) {
      console.log("⚠️  Registry appears to be running on port " + REGISTRY_PORT);
      console.log("Please stop the registry before cleaning");
      console.log("(Use Ctrl+C in the registry terminal)");
      return;
    } else {
      console.log("✅ Registry not running - safe to clean");
    }

    // Ask for confirmation (in a real implementation, you'd want user input)
    console.log("\n⚠️  WARNING: This will DELETE all published components!");
    console.log(`Components to be deleted: ${componentsCount}`);
    console.log(`Directory: ${REGISTRY_DIR}`);
    
    // For now, auto-confirm. In production, you'd want to ask for user confirmation
    console.log("\n🗑️  Proceeding with cleanup...");

    // Clean components directory
    if (fs.existsSync(COMPONENTS_DIR)) {
      console.log("🧹 Removing components directory...");
      fs.rmSync(COMPONENTS_DIR, { recursive: true, force: true });
      console.log("✅ Components directory removed");
    }

    // Clean temporary files
    const tempDir = path.join(REGISTRY_DIR, "temp");
    if (fs.existsSync(tempDir)) {
      console.log("🧹 Removing temporary files...");
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log("✅ Temporary files removed");
    }

    // Clean logs (if any)
    const possibleLogFiles = [
      path.join(REGISTRY_DIR, "registry.log"),
      path.join(REGISTRY_DIR, "npm-debug.log"),
      path.join(REGISTRY_DIR, "error.log")
    ];

    for (const logFile of possibleLogFiles) {
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
        console.log(`✅ Removed log file: ${path.basename(logFile)}`);
      }
    }

    // Recreate clean components directory
    console.log("📁 Recreating clean components directory...");
    fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
    console.log("✅ Clean components directory created");

    // Clean node_modules if requested
    const nodeModules = path.join(REGISTRY_DIR, "node_modules");
    if (fs.existsSync(nodeModules)) {
      console.log("🧹 Removing node_modules (will need to reinstall)...");
      fs.rmSync(nodeModules, { recursive: true, force: true });
      console.log("✅ node_modules removed");

      // Reinstall dependencies
      console.log("📦 Reinstalling registry dependencies...");
      const installProcess = spawn("npm", ["install"], {
        cwd: REGISTRY_DIR,
        stdio: ["inherit", "pipe", "pipe"]
      });

      await new Promise((resolve, reject) => {
        let output = "";
        
        installProcess.stdout.on("data", (data) => {
          output += data.toString();
        });
        
        installProcess.stderr.on("data", (data) => {
          output += data.toString();
        });
        
        installProcess.on("close", (code) => {
          if (code === 0) {
            console.log("✅ Dependencies reinstalled");
            resolve(code);
          } else {
            console.log("⚠️  Dependencies installation had issues");
            console.log("Output:", output);
            resolve(code); // Don't fail the whole operation
          }
        });
      });
    }

    console.log("\n✨ Registry cleanup complete!");
    console.log("\n📋 SUMMARY:");
    console.log("============");
    console.log(`✅ Removed ${componentsCount} components`);
    console.log("✅ Cleaned temporary files");
    console.log("✅ Recreated clean structure");
    console.log("✅ Registry ready for fresh components");

    console.log("\n🚀 NEXT STEPS:");
    console.log("==============");
    console.log("1. Start registry: npx tsx scripts/start-oc-registry.ts");
    console.log("2. Create component: npx tsx scripts/generate-oc-component-in-daytona.ts 'your prompt'");
    console.log("3. Check status: npx tsx scripts/oc-registry-status.ts");

  } catch (error: any) {
    console.error("\n❌ Cleanup failed:", error.message);
    throw error;
  }
}

// Helper function to calculate directory size
function getDirectorySize(dirPath: string): number {
  let size = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch {
    // Ignore errors in size calculation
  }
  
  return size;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Check for force flag
  const force = args.includes('--force') || args.includes('-f');
  
  if (!force) {
    console.log("⚠️  This will permanently delete all components in the registry!");
    console.log("Add --force flag to proceed: npx tsx scripts/oc-clean-registry.ts --force");
    console.log("Or use: npx tsx scripts/oc-registry-status.ts to check current state first");
    return;
  }

  try {
    await cleanRegistry();
  } catch (error) {
    console.error("❌ Registry cleanup failed:", error);
    process.exit(1);
  }
}

main();