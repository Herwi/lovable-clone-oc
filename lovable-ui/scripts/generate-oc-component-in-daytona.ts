import { Daytona } from "@daytonaio/sdk";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const REGISTRY_URL = "http://host.docker.internal:3030";

async function generateOpenComponentInDaytona(
  sandboxIdArg?: string,
  prompt?: string
) {
  console.log("🚀 Starting OpenComponent generation in Daytona sandbox...\n");

  if (!process.env.DAYTONA_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: DAYTONA_API_KEY and ANTHROPIC_API_KEY must be set");
    process.exit(1);
  }

  const daytona = new Daytona({
    apiKey: process.env.DAYTONA_API_KEY,
  });

  let sandbox;
  let sandboxId = sandboxIdArg;
  let componentName = "";

  try {
    // Step 1: Create or get sandbox
    if (sandboxId) {
      console.log(`1. Using existing sandbox: ${sandboxId}`);
      const sandboxes = await daytona.list();
      sandbox = sandboxes.find((s: any) => s.id === sandboxId);
      if (!sandbox) {
        throw new Error(`Sandbox ${sandboxId} not found`);
      }
      console.log(`✓ Connected to sandbox: ${sandbox.id}`);
    } else {
      console.log("1. Creating new Daytona sandbox...");
      sandbox = await daytona.create({
        public: true,
        image: "node:20",
      });
      sandboxId = sandbox.id;
      console.log(`✓ Sandbox created: ${sandboxId}`);
    }

    const rootDir = await sandbox.getUserRootDir();
    console.log(`✓ Working directory: ${rootDir}`);

    // Step 2: Install OpenComponents CLI and Claude Code SDK
    console.log("\n2. Installing OpenComponents CLI and Claude Code SDK...");
    
    // Install OC CLI globally
    const installOc = await sandbox.process.executeCommand(
      "npm install -g oc",
      rootDir,
      undefined,
      180000 // 3 minute timeout
    );
    
    if (installOc.exitCode !== 0) {
      console.error("OC CLI installation failed:", installOc.result);
      throw new Error("Failed to install OpenComponents CLI");
    }
    console.log("✓ OpenComponents CLI installed");

    // Install Claude Code SDK locally for generation
    await sandbox.process.executeCommand(
      "npm install @anthropic-ai/claude-code@latest",
      rootDir,
      undefined,
      180000
    );
    console.log("✓ Claude Code SDK installed");

    // Step 3: Generate component name from prompt
    console.log("\n3. Generating component name...");
    const defaultComponentName = prompt
      ? prompt.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 30) // Limit length
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      : "generated-component";
    
    componentName = defaultComponentName || "generated-component";
    console.log(`✓ Component name: ${componentName}`);

    // Step 4: Initialize OpenComponent
    console.log("\n4. Initializing OpenComponent structure...");
    const componentDir = `${rootDir}/${componentName}`;
    
    const initResult = await sandbox.process.executeCommand(
      `oc init ${componentName}`,
      rootDir
    );
    
    if (initResult.exitCode !== 0) {
      console.log("Init output:", initResult.result);
      throw new Error("Failed to initialize OpenComponent");
    }
    console.log(`✓ Component scaffolded: ${componentDir}`);

    // Step 5: Create the generation script for Claude Code
    console.log("\n5. Creating Claude Code generation script...");

    const generationScript = `const { query } = require('@anthropic-ai/claude-code');
const fs = require('fs');
const path = require('path');

async function generateOpenComponent() {
  const prompt = \`${prompt || "Create a beautiful, reusable UI component"}
  
  IMPORTANT: You are creating an OpenComponent, not a full website. Requirements:
  
  1. COMPONENT STRUCTURE: You are working in a directory that already has:
     - package.json (component metadata - you may need to update dependencies)
     - view.js (main component rendering - REPLACE this with your component)
     - server.js (server-side logic - optional, update if needed for data)
     - public/ directory (for static assets like CSS, images)
  
  2. COMPONENT TYPE: Create a ${prompt ? prompt.toLowerCase().includes('data') || prompt.toLowerCase().includes('api') || prompt.toLowerCase().includes('chart') ? 'data-driven' : 'UI' : 'UI'} component that:
     - Is focused and reusable
     - Has a single clear purpose
     - Can be embedded in other applications
     - ${prompt?.toLowerCase().includes('react') ? 'Uses React' : prompt?.toLowerCase().includes('vue') ? 'Uses Vue' : 'Uses vanilla JavaScript or your preferred framework'}
  
  3. FILES TO GENERATE:
     - view.js: Main component rendering logic (this is what users see)
     - server.js: Server-side data logic (if component needs data fetching)
     - package.json: Update with proper dependencies and metadata
     - public/style.css: Component styles (if needed)
     - Any other assets in public/ folder
  
  4. COMPONENT FEATURES:
     - Make it visually appealing and modern
     - Include proper error handling
     - Make it responsive if it's a UI component
     - Include reasonable defaults
     - Add proper documentation in package.json description
  
  5. EXAMPLES OF GOOD COMPONENTS:
     - Button with variants (primary, secondary, etc.)
     - Card component with customizable content
     - Data table with sorting
     - Chart component with API integration
     - Modal/dialog component
     - Form input with validation
     - Navigation menu
     - Loading spinner/skeleton
  
  Focus on creating ONE high-quality, reusable component rather than multiple components.
  \`;

  console.log('Starting OpenComponent generation with Claude Code...');
  console.log('Working directory:', process.cwd());
  console.log('Component:', '${componentName}');
  
  const messages = [];
  const abortController = new AbortController();
  
  try {
    for await (const message of query({
      prompt: prompt,
      abortController: abortController,
      options: {
        maxTurns: 15,
        allowedTools: [
          'Read',
          'Write',
          'Edit',
          'MultiEdit',
          'Bash',
          'LS',
          'Glob',
          'Grep'
        ]
      }
    })) {
      messages.push(message);
      
      // Log progress
      if (message.type === 'text') {
        console.log('[Claude]:', (message.text || '').substring(0, 80) + '...');
        console.log('__CLAUDE_MESSAGE__', JSON.stringify({ type: 'assistant', content: message.text }));
      } else if (message.type === 'tool_use') {
        console.log('[Tool]:', message.name, message.input?.file_path || '');
        console.log('__TOOL_USE__', JSON.stringify({ 
          type: 'tool_use', 
          name: message.name, 
          input: message.input 
        }));
      } else if (message.type === 'result') {
        console.log('__TOOL_RESULT__', JSON.stringify({ 
          type: 'tool_result', 
          result: message.result 
        }));
      }
    }
    
    console.log('\\nComponent generation complete!');
    console.log('Total messages:', messages.length);
    
    // Save generation log
    fs.writeFileSync('generation-log.json', JSON.stringify(messages, null, 2));
    
    // List generated files
    const files = fs.readdirSync('.').filter(f => !f.startsWith('.') && f !== 'node_modules');
    console.log('\\nComponent files:', files.join(', '));
    
    // Check component structure
    const hasView = fs.existsSync('view.js') || fs.existsSync('view.jsx') || fs.existsSync('view.ts');
    const hasPackage = fs.existsSync('package.json');
    
    console.log('\\nComponent validation:');
    console.log('- view.js present:', hasView);
    console.log('- package.json present:', hasPackage);
    
    if (!hasView || !hasPackage) {
      console.error('⚠️ Component structure incomplete!');
      console.error('OpenComponents require at least view.js and package.json');
    }
    
  } catch (error) {
    console.error('Generation error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

generateOpenComponent().catch(console.error);`;

    // Write the generation script
    await sandbox.process.executeCommand(
      `cat > generate-component.js << 'SCRIPT_EOF'
${generationScript}
SCRIPT_EOF`,
      componentDir
    );
    console.log("✓ Generation script written");

    // Step 6: Run Claude Code generation
    console.log("\n6. Running Claude Code generation...");
    console.log(`Prompt: "${prompt || 'Create a beautiful, reusable UI component'}"`);
    console.log("\nThis may take several minutes...\n");

    const genResult = await sandbox.process.executeCommand(
      "node generate-component.js",
      componentDir,
      {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        NODE_PATH: `${rootDir}/node_modules`,
      },
      600000 // 10 minute timeout
    );

    console.log("\nGeneration output:");
    console.log(genResult.result);

    if (genResult.exitCode !== 0) {
      throw new Error("Component generation failed");
    }

    // Step 7: Validate component structure
    console.log("\n7. Validating component structure...");
    const checkFiles = await sandbox.process.executeCommand(
      "ls -la && echo '---' && cat package.json | head -10",
      componentDir
    );
    console.log(checkFiles.result);

    // Step 8: Build the component
    console.log("\n8. Building OpenComponent...");
    const buildResult = await sandbox.process.executeCommand(
      "oc build .",
      componentDir,
      undefined,
      180000 // 3 minute timeout
    );

    if (buildResult.exitCode !== 0) {
      console.log("Build output:", buildResult.result);
      // Try to show more details
      const debugBuild = await sandbox.process.executeCommand(
        "oc build . --verbose",
        componentDir
      );
      console.log("Debug build:", debugBuild.result);
      throw new Error("Component build failed");
    }
    console.log("✓ Component built successfully");

    // Step 9: Publish to registry
    console.log("\n9. Publishing component to registry...");
    console.log(`Registry URL: ${REGISTRY_URL}`);
    
    const publishResult = await sandbox.process.executeCommand(
      `oc publish . ${REGISTRY_URL}`,
      componentDir,
      undefined,
      180000 // 3 minute timeout
    );

    console.log("Publish output:", publishResult.result);

    if (publishResult.exitCode !== 0) {
      // Check if registry is accessible
      const checkRegistry = await sandbox.process.executeCommand(
        `curl -f ${REGISTRY_URL} || echo 'Registry not accessible'`,
        componentDir
      );
      console.log("Registry check:", checkRegistry.result);
      
      throw new Error("Component publish failed - check if registry is running");
    }
    console.log("✓ Component published to registry");

    // Step 10: Get component info
    console.log("\n10. Getting component information...");
    const componentUrl = `${REGISTRY_URL}${componentName}`;
    
    // Test component accessibility
    const testComponent = await sandbox.process.executeCommand(
      `curl -f "${componentUrl}" -H "Accept: application/json" || echo 'Component not accessible'`,
      componentDir
    );
    console.log("Component test:", testComponent.result);

    console.log("\n✨ SUCCESS! OpenComponent created and published!");
    console.log("\n📊 SUMMARY:");
    console.log("===========");
    console.log(`Sandbox ID: ${sandboxId}`);
    console.log(`Component Name: ${componentName}`);
    console.log(`Component Directory: ${componentDir}`);
    console.log(`Registry URL: ${REGISTRY_URL}`);
    console.log(`Component URL: ${componentUrl}`);

    console.log("\n🌐 ACCESS YOUR COMPONENT:");
    console.log(`Direct URL: ${componentUrl}`);
    console.log(`With parameters: ${componentUrl}?param=value`);
    console.log(`As JSON: ${componentUrl}?format=json`);

    console.log("\n💡 INTEGRATION EXAMPLES:");
    console.log("HTML: <script src='" + componentUrl + "'></script>");
    console.log("React: <Component src='" + componentUrl + "' />");
    console.log("Server-side: fetch('" + componentUrl + "')");

    console.log("\n🔧 TIPS:");
    console.log("- Component is now live and can be consumed by any application");
    console.log("- Registry provides both server-side and client-side rendering");
    console.log("- Component is versioned and immutable");
    console.log(`- To republish: cd ${componentDir} && oc publish . ${REGISTRY_URL}`);
    console.log(`- To remove sandbox: npx tsx scripts/remove-sandbox.ts ${sandboxId}`);

    return {
      success: true,
      sandboxId: sandboxId,
      componentName: componentName,
      componentDir: componentDir,
      componentUrl: componentUrl,
      registryUrl: REGISTRY_URL,
    };

  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);

    if (sandbox) {
      console.log(`\nSandbox ID: ${sandboxId}`);
      console.log("The sandbox is still running for debugging.");

      // Try to get debug info
      try {
        const debugInfo = await sandbox.process.executeCommand(
          `pwd && echo '---' && ls -la && echo '---' && ls -la ${componentName} 2>/dev/null || echo 'No component dir'`,
          rootDir
        );
        console.log("\nDebug info:");
        console.log(debugInfo.result);
      } catch (e) {
        // Ignore debug errors
      }
    }

    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  let sandboxId: string | undefined;
  let prompt: string | undefined;

  // Parse arguments
  if (args.length > 0) {
    // Check if first arg is a sandbox ID (UUID format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(args[0])) {
      sandboxId = args[0];
      prompt = args.slice(1).join(" ");
    } else {
      prompt = args.join(" ");
    }
  }

  if (!prompt) {
    prompt = "Create a beautiful, modern button component with multiple variants (primary, secondary, outline) and different sizes. Include hover effects and proper accessibility features.";
  }

  console.log("📝 Configuration:");
  console.log(`- Sandbox: ${sandboxId ? `Using existing ${sandboxId}` : "Creating new"}`);
  console.log(`- Prompt: ${prompt}`);
  console.log(`- Registry: ${REGISTRY_URL}`);
  console.log();

  try {
    await generateOpenComponentInDaytona(sandboxId, prompt);
  } catch (error) {
    console.error("Failed to generate component:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Exiting... The sandbox will continue running.");
  process.exit(0);
});

main();