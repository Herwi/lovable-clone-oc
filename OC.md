# OpenComponents Integration

This document explains the OpenComponents integration with your lovable-clone project.

## What is OpenComponents?

OpenComponents is a micro-frontend framework that allows you to create, publish, and consume reusable web components. Unlike your previous setup that generated full websites, OpenComponents creates focused, reusable components that can be embedded in any application.

## Architecture Overview

```
User Input (Prompt)
       ↓
Claude Code SDK (in Daytona)
       ↓
OpenComponent Generation
       ↓
Component Build & Publish
       ↓
Local OC Registry
       ↓
Component URL Preview
```

## Key Benefits

- **Reusable Components**: Create once, use anywhere
- **Micro-Frontend Architecture**: Independent, focused components
- **Server-Side Rendering**: Components work with SSR
- **Versioned & Immutable**: Proper component lifecycle management
- **Privacy**: Local registry keeps everything private (as required)

## Quick Start

### 1. Set Up Registry

```bash
# Setup the local OpenComponents registry
npm run oc:setup

# Start the registry server
npm run oc:start
```

The registry will run on `http://localhost:3030/`

### 2. Generate a Component

```bash
# Via script (generates in Daytona)
npm run oc:generate "Create a modern button component"

# Or via your web interface
# Visit your lovable-ui app and use the form
```

### 3. View Your Components

```bash
# Check registry status and list components
npm run oc:status
npm run oc:list
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Setup | `npm run oc:setup` | Initialize local registry |
| Start | `npm run oc:start` | Start registry server |
| Status | `npm run oc:status` | Check registry health |
| List | `npm run oc:list` | List all components |
| Generate | `npm run oc:generate "prompt"` | Create component in Daytona |
| Clean | `npm run oc:clean` | Reset registry (removes all components) |

## Component Structure

Each OpenComponent has this structure:

```
my-component/
├── package.json    # Component metadata & dependencies
├── view.js         # Main rendering logic (what users see)
├── server.js       # Server-side logic (optional, for data fetching)
└── public/         # Static assets (CSS, images, etc.)
    └── style.css
```

## Component Types You Can Create

### UI Components
- Buttons with variants (primary, secondary, outline)
- Form inputs with validation
- Cards and layouts
- Navigation menus
- Modals and dialogs
- Loading spinners

### Data Components
- Charts and graphs
- Tables with sorting/filtering
- API integration components
- Real-time data displays

### Interactive Components
- Dropdown menus
- Tabs and accordions
- Image carousels
- Search interfaces

## Usage Examples

### Direct HTML Integration
```html
<!-- Embed component directly -->
<script src="http://localhost:3030/my-button-component"></script>
```

### JavaScript Fetch
```javascript
// Fetch component HTML
const response = await fetch('http://localhost:3030/my-button-component');
const componentHTML = await response.text();
document.getElementById('container').innerHTML = componentHTML;
```

### With Parameters
```html
<!-- Pass parameters to component -->
<script src="http://localhost:3030/my-button-component?variant=primary&size=large"></script>
```

### JSON Data
```javascript
// Get component metadata
const componentData = await fetch('http://localhost:3030/my-button-component?format=json');
const metadata = await componentData.json();
```

## Integration with Your Lovable-Clone

### Before (Website Generation)
1. User enters prompt
2. Claude Code generates full Next.js website
3. Website runs on dev server
4. User gets preview URL to dev server

### After (Component Generation)
1. User enters prompt
2. Claude Code generates focused OpenComponent
3. Component is built and published to registry
4. User gets component URL from registry

### API Changes

The `/api/generate-daytona` endpoint now returns:

```json
{
  "type": "complete",
  "sandboxId": "abc-123",
  "componentName": "my-button-component",
  "componentUrl": "http://localhost:3030/my-button-component",
  "previewUrl": "http://localhost:3030/my-button-component"
}
```

## Registry Management

### Starting the Registry
```bash
npm run oc:start
```
Registry runs on `http://localhost:3030/`

### Checking Status
```bash
npm run oc:status
```
Shows registry health, components count, and connectivity.

### Listing Components
```bash
npm run oc:list
```
Shows detailed information about all published components.

### Cleaning Registry
```bash
npm run oc:clean
```
⚠️ **Warning**: This permanently deletes all components!

## Component Development Flow

1. **Generate**: Use Claude Code to create component structure
2. **Build**: OpenComponents CLI builds the component
3. **Publish**: Component is published to local registry
4. **Consume**: Component becomes available at registry URL
5. **Iterate**: Republish updated versions

## Troubleshooting

### Registry Not Starting
- Check if port 3030 is available
- Run `npm run oc:setup` to reinitialize
- Check `.oc-registry` directory exists

### Component Generation Fails
- Ensure Daytona API key is set
- Check sandbox connectivity
- Verify registry is accessible from sandbox

### Component Not Accessible
- Check registry is running: `npm run oc:status`
- Verify component was published successfully
- Check component exists: `npm run oc:list`

### Network Issues
- Registry uses `http://host.docker.internal:3030` for Daytona→Registry communication
- Ensure Docker networking allows host access

## File Structure

```
lovable-ui/
├── scripts/
│   ├── setup-oc-registry.ts              # Registry setup
│   ├── start-oc-registry.ts               # Start registry
│   ├── oc-registry-status.ts              # Check status
│   ├── oc-list-components.ts              # List components
│   ├── oc-clean-registry.ts               # Clean registry
│   └── generate-oc-component-in-daytona.ts # Generate components
├── .oc-registry/                          # Registry data
│   ├── components/                        # Published components
│   ├── config.json                        # Registry config
│   └── start-registry.js                  # Registry server
└── app/api/generate-daytona/route.ts      # Updated API endpoint
```

## Next Steps

1. **Start Registry**: `npm run oc:setup && npm run oc:start`
2. **Test Generation**: Use your web interface to create a component
3. **Explore Components**: `npm run oc:list` to see what was created
4. **Integrate**: Use component URLs in other projects

## Advanced Usage

### Custom Registry Configuration
Edit `.oc-registry/config.json` to customize:
- Port number
- Storage location
- CORS settings
- Custom plugins

### Component Publishing
Components are automatically published during generation, but you can also publish manually:

```bash
cd .oc-registry/components/my-component
oc publish . http://localhost:3030/
```

### Version Management
OpenComponents supports semantic versioning:
- Update `version` in component's `package.json`
- Republish to create new version
- Access specific versions: `http://localhost:3030/my-component/1.2.0`

---

🎉 **Your lovable-clone now creates reusable OpenComponents instead of full websites!**

Each component is a focused, reusable piece of functionality that can be embedded anywhere, maintaining your privacy requirements through the local registry.