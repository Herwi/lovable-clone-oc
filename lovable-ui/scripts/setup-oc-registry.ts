import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const REGISTRY_PORT = 3030;
const REGISTRY_DIR = path.join(process.cwd(), ".oc-registry");
const COMPONENTS_DIR = path.join(REGISTRY_DIR, "components");

async function setupOpenComponentsRegistry() {
  console.log("🚀 Setting up local OpenComponents registry...\n");

  try {
    // Step 1: Create registry directory
    console.log("1. Creating registry directory...");
    if (!fs.existsSync(REGISTRY_DIR)) {
      fs.mkdirSync(REGISTRY_DIR, { recursive: true });
      console.log(`✓ Created directory: ${REGISTRY_DIR}`);
    } else {
      console.log(`✓ Registry directory exists: ${REGISTRY_DIR}`);
    }

    if (!fs.existsSync(COMPONENTS_DIR)) {
      fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
      console.log(`✓ Created components directory: ${COMPONENTS_DIR}`);
    }

    // Step 2: Install OpenComponents CLI locally
    console.log("\n2. Installing OpenComponents CLI locally...");
    
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const installProcess = spawn(npmCmd, ["install", "oc"], { 
      cwd: process.cwd(),
      stdio: ["inherit", "pipe", "pipe"],
      shell: true
    });
    
    await new Promise((resolve, reject) => {
      let output = "";
      
      installProcess.stdout.on("data", (data) => {
        output += data.toString();
        process.stdout.write(data);
      });
      
      installProcess.stderr.on("data", (data) => {
        output += data.toString();
        process.stderr.write(data);
      });
      
      installProcess.on("close", (code) => {
        if (code === 0) {
          console.log("✓ OpenComponents CLI installed locally");
          resolve(code);
        } else {
          console.log("Installation output:", output);
          reject(new Error(`Installation failed with code ${code}`));
        }
      });
    });

    // Step 3: Create registry configuration
    console.log("\n3. Creating registry configuration...");
    const registryConfig = {
      baseUrl: `http://localhost:${REGISTRY_PORT}/`,
      port: REGISTRY_PORT,
      tempDir: path.join(REGISTRY_DIR, "temp"),
      storage: {
        adapter: "fs-adapter",
        options: {
          path: COMPONENTS_DIR
        }
      },
      env: {
        name: "local"
      },
      dependencies: [],
      cors: {
        origin: "*",
        credentials: true
      }
    };

    const configPath = path.join(REGISTRY_DIR, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(registryConfig, null, 2));
    console.log(`✓ Registry config created: ${configPath}`);

    // Step 4: Create registry startup script
    console.log("\n4. Creating registry startup script...");
    const startupScript = `
const oc = require('oc');
const config = require('./config.json');

console.log('Starting OpenComponents registry...');
console.log('Port:', config.port);
console.log('Components directory:', config.storage.options.path);
console.log('Base URL:', config.baseUrl);

// Configure the storage adapter
const fsAdapter = require('oc/dist/registry/domain/storage-adapters/file-system');
config.storage.adapter = fsAdapter;

const registry = new oc.Registry(config);

registry.start((err, app) => {
  if (err) {
    console.error('Failed to start registry:', err);
    process.exit(1);
  }
  
  console.log('');
  console.log('✅ OpenComponents Registry is running!');
  console.log('');
  console.log('🌐 Registry URL:', config.baseUrl);
  console.log('📁 Components stored in:', config.storage.path);
  console.log('');
  console.log('To publish a component:');
  console.log('  oc publish . ' + config.baseUrl);
  console.log('');
  console.log('To stop: Ctrl+C');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n\\n👋 Stopping OpenComponents registry...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n\\n👋 Stopping OpenComponents registry...');
  process.exit(0);
});
`;

    const startupScriptPath = path.join(REGISTRY_DIR, "start-registry.js");
    fs.writeFileSync(startupScriptPath, startupScript.trim());
    console.log(`✓ Startup script created: ${startupScriptPath}`);

    // Step 5: Create package.json for registry
    const registryPackageJson = {
      name: "lovable-oc-registry",
      version: "1.0.0",
      private: true,
      scripts: {
        start: "node start-registry.js"
      },
      dependencies: {
        "oc": "latest"
      }
    };

    const packagePath = path.join(REGISTRY_DIR, "package.json");
    if (!fs.existsSync(packagePath)) {
      fs.writeFileSync(packagePath, JSON.stringify(registryPackageJson, null, 2));
      console.log(`✓ Registry package.json created`);
    }

    // Step 6: Install registry dependencies
    console.log("\n5. Installing registry dependencies...");
    const registryInstallProcess = spawn(npmCmd, ["install"], {
      cwd: REGISTRY_DIR,
      stdio: ["inherit", "pipe", "pipe"],
      shell: true
    });

    await new Promise((resolve, reject) => {
      let output = "";
      
      registryInstallProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      registryInstallProcess.stderr.on("data", (data) => {
        output += data.toString();
      });
      
      registryInstallProcess.on("close", (code) => {
        if (code === 0) {
          console.log("✓ Registry dependencies installed");
          resolve(code);
        } else {
          console.log("Installation output:", output);
          reject(new Error(`Dependencies installation failed with code ${code}`));
        }
      });
    });

    console.log("\n✨ OpenComponents Registry setup complete!\n");
    console.log("📋 SUMMARY:");
    console.log("==========");
    console.log(`Registry directory: ${REGISTRY_DIR}`);
    console.log(`Components storage: ${COMPONENTS_DIR}`);
    console.log(`Registry port: ${REGISTRY_PORT}`);
    console.log(`Registry URL: http://localhost:${REGISTRY_PORT}/`);
    
    console.log("\n🚀 TO START THE REGISTRY:");
    console.log(`cd ${REGISTRY_DIR}`);
    console.log("npm start");
    
    console.log("\n💡 OR USE THE HELPER SCRIPT:");
    console.log("npx tsx scripts/start-oc-registry.ts");

    return {
      registryDir: REGISTRY_DIR,
      componentsDir: COMPONENTS_DIR,
      port: REGISTRY_PORT,
      url: `http://localhost:${REGISTRY_PORT}/`
    };

  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await setupOpenComponentsRegistry();
    process.exit(0);
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

main();