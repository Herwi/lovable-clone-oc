import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const REGISTRY_PORT = 3030;
const REGISTRY_DIR = path.join(process.cwd(), ".oc-registry");
const REGISTRY_URL = `http://localhost:${REGISTRY_PORT}`;

async function checkRegistryStatus() {
  console.log("🔍 Checking OpenComponents Registry Status...\n");

  try {
    // Check if registry directory exists
    console.log("1. Registry Setup:");
    if (fs.existsSync(REGISTRY_DIR)) {
      console.log(`✓ Registry directory: ${REGISTRY_DIR}`);
      
      const configPath = path.join(REGISTRY_DIR, "config.json");
      if (fs.existsSync(configPath)) {
        console.log("✓ Registry config found");
        
        // Show config details
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        console.log(`  - Base URL: ${config.baseUrl}`);
        console.log(`  - Port: ${config.port}`);
        console.log(`  - Components storage: ${config.storage?.path || "Not configured"}`);
      } else {
        console.log("❌ Registry config missing");
      }
    } else {
      console.log("❌ Registry not set up");
      console.log("Run: npx tsx scripts/setup-oc-registry.ts");
      return;
    }

    // Check if registry is running
    console.log("\n2. Registry Service:");
    
    const checkPort = spawn("netstat", ["-an"], { stdio: "pipe" });
    let isRunning = false;
    
    await new Promise((resolve) => {
      let output = "";
      
      checkPort.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      checkPort.on("close", () => {
        if (output.includes(`:${REGISTRY_PORT} `) || output.includes(`:${REGISTRY_PORT}\t`)) {
          isRunning = true;
          console.log(`✓ Registry appears to be running on port ${REGISTRY_PORT}`);
        } else {
          console.log(`❌ Registry not running on port ${REGISTRY_PORT}`);
        }
        resolve(true);
      });
      
      checkPort.on("error", () => {
        console.log("⚠️  Could not check port status");
        resolve(true);
      });
    });

    // Try to connect to registry
    console.log("\n3. Registry Connectivity:");
    
    if (isRunning) {
      const curlCheck = spawn("curl", ["-f", "-s", "-o", "/dev/null", "-w", "%{http_code}", REGISTRY_URL], {
        stdio: "pipe"
      });
      
      await new Promise((resolve) => {
        let output = "";
        
        curlCheck.stdout.on("data", (data) => {
          output += data.toString();
        });
        
        curlCheck.on("close", (code) => {
          if (code === 0 && output.trim() === "200") {
            console.log(`✓ Registry responding at ${REGISTRY_URL}`);
          } else {
            console.log(`❌ Registry not responding (HTTP: ${output.trim() || "No response"})`);
          }
          resolve(true);
        });
        
        curlCheck.on("error", () => {
          console.log("❌ Could not connect to registry");
          resolve(true);
        });
      });
    } else {
      console.log("❌ Cannot check connectivity - registry not running");
      console.log("To start: npx tsx scripts/start-oc-registry.ts");
    }

    // List published components
    console.log("\n4. Published Components:");
    
    const componentsDir = path.join(REGISTRY_DIR, "components");
    if (fs.existsSync(componentsDir)) {
      const components = fs.readdirSync(componentsDir).filter(item => {
        return fs.statSync(path.join(componentsDir, item)).isDirectory();
      });
      
      if (components.length > 0) {
        console.log(`Found ${components.length} components:`);
        components.forEach(comp => {
          const compPath = path.join(componentsDir, comp);
          const packagePath = path.join(compPath, "package.json");
          
          if (fs.existsSync(packagePath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
              console.log(`  - ${comp} (v${pkg.version || "unknown"})`);
              if (isRunning) {
                console.log(`    URL: ${REGISTRY_URL}${comp}`);
              }
            } catch {
              console.log(`  - ${comp} (invalid package.json)`);
            }
          } else {
            console.log(`  - ${comp} (no package.json)`);
          }
        });
      } else {
        console.log("No components published yet");
      }
    } else {
      console.log("Components directory not found");
    }

    // Summary and next steps
    console.log("\n📋 SUMMARY:");
    console.log("============");
    
    if (!fs.existsSync(REGISTRY_DIR)) {
      console.log("❌ Registry not set up");
      console.log("\n📝 Next steps:");
      console.log("1. Run: npx tsx scripts/setup-oc-registry.ts");
      console.log("2. Run: npx tsx scripts/start-oc-registry.ts");
    } else if (!isRunning) {
      console.log("⚠️  Registry set up but not running");
      console.log("\n📝 Next steps:");
      console.log("1. Run: npx tsx scripts/start-oc-registry.ts");
    } else {
      console.log("✅ Registry is running and ready!");
      console.log(`🌐 Access at: ${REGISTRY_URL}`);
      console.log("\n📝 Available commands:");
      console.log("- List components: npx tsx scripts/oc-list-components.ts");
      console.log("- Create component: npx tsx scripts/generate-oc-component-in-daytona.ts 'your prompt'");
      console.log("- Stop registry: Ctrl+C in registry terminal");
    }

  } catch (error: any) {
    console.error("\n❌ Error checking status:", error.message);
  }
}

// Main execution
async function main() {
  await checkRegistryStatus();
}

main();