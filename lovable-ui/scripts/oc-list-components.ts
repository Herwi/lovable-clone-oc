import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const REGISTRY_PORT = 3030;
const REGISTRY_DIR = path.join(process.cwd(), ".oc-registry");
const REGISTRY_URL = `http://localhost:${REGISTRY_PORT}`;

async function listComponents() {
  console.log("📦 OpenComponents Registry - Component List\n");

  try {
    // Check if registry is set up
    if (!fs.existsSync(REGISTRY_DIR)) {
      console.log("❌ Registry not set up. Run: npx tsx scripts/setup-oc-registry.ts");
      return;
    }

    const componentsDir = path.join(REGISTRY_DIR, "components");
    if (!fs.existsSync(componentsDir)) {
      console.log("❌ Components directory not found");
      return;
    }

    // Check if registry is running
    console.log("🔍 Checking registry status...");
    let isRunning = false;
    
    try {
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
            isRunning = true;
            console.log("✅ Registry is running");
          } else {
            console.log("⚠️  Registry not responding");
          }
          resolve(true);
        });
        
        curlCheck.on("error", () => {
          console.log("❌ Registry not accessible");
          resolve(true);
        });
      });
    } catch {
      console.log("⚠️  Could not check registry status");
    }

    // List components
    const components = fs.readdirSync(componentsDir).filter(item => {
      return fs.statSync(path.join(componentsDir, item)).isDirectory();
    });

    if (components.length === 0) {
      console.log("\n📭 No components published yet");
      console.log("\n💡 To create a component:");
      console.log("npx tsx scripts/generate-oc-component-in-daytona.ts 'Create a button component'");
      return;
    }

    console.log(`\n📦 Found ${components.length} component${components.length > 1 ? 's' : ''}:\n`);

    for (const componentName of components) {
      const compPath = path.join(componentsDir, componentName);
      const packagePath = path.join(compPath, "package.json");
      
      console.log(`🔧 ${componentName}`);
      console.log("   " + "=".repeat(componentName.length + 2));
      
      if (fs.existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
          
          console.log(`   Version: ${pkg.version || "unknown"}`);
          console.log(`   Description: ${pkg.description || "No description"}`);
          
          if (pkg.author) {
            console.log(`   Author: ${pkg.author}`);
          }
          
          if (pkg.keywords && pkg.keywords.length > 0) {
            console.log(`   Keywords: ${pkg.keywords.join(", ")}`);
          }
          
          // Show dependencies
          if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
            console.log(`   Dependencies: ${Object.keys(pkg.dependencies).join(", ")}`);
          }
          
        } catch {
          console.log("   ❌ Invalid package.json");
        }
      } else {
        console.log("   ❌ No package.json found");
      }
      
      // List component files
      const files = fs.readdirSync(compPath).filter(f => !f.startsWith('.'));
      console.log(`   Files: ${files.join(", ")}`);
      
      // Component URLs (if registry is running)
      if (isRunning) {
        console.log(`   🌐 Component URL: ${REGISTRY_URL}${componentName}`);
        console.log(`   📄 JSON Info: ${REGISTRY_URL}${componentName}?format=json`);
        console.log(`   🎨 With params: ${REGISTRY_URL}${componentName}?param=value`);
      } else {
        console.log("   ⚠️  URLs unavailable (registry not running)");
      }
      
      // Component size
      try {
        const stats = fs.statSync(compPath);
        const sizeInKb = (getDirectorySize(compPath) / 1024).toFixed(2);
        console.log(`   📏 Size: ~${sizeInKb} KB`);
        console.log(`   📅 Modified: ${stats.mtime.toLocaleDateString()}`);
      } catch {
        // Ignore size calculation errors
      }
      
      console.log(); // Empty line between components
    }

    // Registry info
    console.log("🌐 Registry Information:");
    console.log("========================");
    console.log(`Registry URL: ${REGISTRY_URL}`);
    console.log(`Components Storage: ${componentsDir}`);
    console.log(`Registry Status: ${isRunning ? "✅ Running" : "❌ Not Running"}`);
    
    if (!isRunning) {
      console.log("\n💡 To start registry: npx tsx scripts/start-oc-registry.ts");
    }

    // Usage examples
    console.log("\n💡 Usage Examples:");
    console.log("==================");
    console.log("HTML Integration:");
    console.log(`<script src="${REGISTRY_URL}your-component"></script>`);
    console.log("");
    console.log("JavaScript Fetch:");
    console.log(`fetch("${REGISTRY_URL}your-component").then(r => r.text())`);
    console.log("");
    console.log("Create New Component:");
    console.log(`npx tsx scripts/generate-oc-component-in-daytona.ts "Create a modal component"`);

  } catch (error: any) {
    console.error("❌ Error listing components:", error.message);
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
  await listComponents();
}

main();