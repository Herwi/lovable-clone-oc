# Lovable Clone - OpenComponents Edition

Thank you so much for checking out this project! 🙏  
This is a lovable-clone that uses Claude Code SDK to create **OpenComponents** - reusable web components that are published to a local registry for maximum privacy.

## What's Different

Instead of generating full websites, this version creates focused, reusable **OpenComponents** that can be embedded anywhere:

- 🧩 **Component-First**: Creates single-purpose, reusable components
- 🏠 **Local Registry**: Private OpenComponents registry (no external dependencies)
- 🔒 **Privacy-Focused**: Uses Daytona for isolated development environments
- ⚡ **Instant Preview**: Components are immediately available at registry URLs

## Quick Start

### 1. Set Up API Keys

Before you begin, please make sure to **replace the API keys** in your `.env` file:

- Get your Anthropic API key from: [Anthropic Console](https://console.anthropic.com/dashboard)
- Get your Daytona API key from: [Daytona Dashboard](https://www.daytona.io/)

Add these keys to your `.env` file as follows:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
DAYTONA_API_KEY=your_daytona_api_key
```

### 2. Install Dependencies

From the `lovable-ui` directory:

```bash
cd lovable-ui
npm install
```

### 3. Set Up OpenComponents Registry

**Important**: Make sure you're in the `lovable-ui` directory:

```bash
# Initialize the local registry
npm run oc:setup

# Start the registry server (in a separate terminal)
npm run oc:start
```

If you get path errors, try running directly:
```bash
# Alternative method
npx tsx scripts/setup-oc-registry.ts
npx tsx scripts/start-oc-registry.ts
```

The registry will run on `http://localhost:3030/`

### 4. Start the Web Interface

```bash
npm run dev
```

This launches the web interface at `http://localhost:3000`

## How It Works

1. **Enter a prompt** in the web interface (e.g., "Create a modern button component")
2. **Claude Code generates** the component in a Daytona sandbox
3. **Component is built** and published to your local registry
4. **Preview URL** shows the live component from the registry

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the web interface |
| `npm run oc:setup` | Initialize OpenComponents registry |
| `npm run oc:start` | Start registry server |
| `npm run oc:status` | Check registry status and components |
| `npm run oc:list` | List all published components |
| `npm run oc:generate "prompt"` | Generate component via CLI |
| `npm run oc:clean` | Reset registry (removes all components) |

## Component Examples

Try these prompts:

- "Create a modern button component with multiple variants"
- "Build a responsive card component for product listings" 
- "Make a data table with sorting and filtering"
- "Create a modal dialog with animations"
- "Build a search input with autocomplete"

## Using Your Components

Once published, components are available at:
```
http://localhost:3030/your-component-name
```

### HTML Integration
```html
<script src="http://localhost:3030/my-button-component"></script>
```

### JavaScript
```javascript
const response = await fetch('http://localhost:3030/my-button-component');
const html = await response.text();
```

### With Parameters
```html
<script src="http://localhost:3030/my-button-component?variant=primary&size=large"></script>
```

## Documentation

See [OC.md](./OC.md) for comprehensive OpenComponents integration documentation.

## Architecture

- **Web Interface**: Next.js app for component generation
- **Claude Code SDK**: AI-powered component creation
- **Daytona**: Isolated development sandboxes
- **OpenComponents Registry**: Local component distribution
- **Privacy First**: Everything runs locally

