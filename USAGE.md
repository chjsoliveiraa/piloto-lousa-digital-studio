# Lousa Digital Studio Tool - Usage Guide

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/chjsoliveiraa/piloto-lousa-digital-studio.git
cd piloto-lousa-digital-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open in a new window.

## Creating Your First Extension

### 1. Choose Extension Type

Click on one of the cards:
- **Template Pack** - For lesson templates
- **Tool Plugin** - For custom tools
- **Theme Pack** - For visual themes
- **Resource Pack** - For media collections

### 2. Fill Extension Metadata

```typescript
{
  id: "com.yourname.myextension",  // Unique ID (reverse domain)
  name: "My First Extension",
  version: "1.0.0",
  description: "A helpful description",
  author: {
    name: "Your Name",
    email: "you@example.com"
  },
  license: "MIT"
}
```

**Important:** The ID must follow reverse domain notation:
- ✅ Good: `com.example.myextension`
- ❌ Bad: `MyExtension` or `example`

### 3. Add Templates (for Template Pack)

#### Using the UI (Coming Soon)

The visual editor will allow drag-and-drop template creation.

#### Programmatically

```typescript
import { ManifestGenerator, PackageBuilder } from '@/shared/services';

// Create manifest
const generator = new ManifestGenerator();
const manifest = generator.createTemplatePackManifest(
  'com.example.math-pack',
  'Mathematics Templates',
  'Your Name',
  'you@example.com'
);

// Define templates
const templates = [
  {
    id: 'template-fractions',
    metadata: {
      name: 'Fractions Practice',
      description: 'Interactive fraction exercises',
      tags: ['math', 'fractions']
    },
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        title: 'Fractions',
        backgroundColor: '#FFFFFF',
        objects: [
          {
            id: 'obj-1',
            type: 'text',
            x: 100,
            y: 100,
            width: 400,
            height: 50,
            properties: {
              text: 'What is 1/2 + 1/4?',
              fontSize: 24,
              color: '#000000'
            }
          }
        ]
      }
    ],
    resources: []
  }
];

// Build package
const builder = new PackageBuilder();
const blob = await builder.buildPackage({
  manifest,
  templates,
  documentation: {
    readme: '# My Template Pack\n\nA collection of math templates.'
  }
});

// Save to file
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'math-pack.ldip';
a.click();
```

### 4. Upload Resources to Cloud

Before building the package, upload images/videos to cloud storage:

```typescript
// TODO: Cloud upload service
// For now, manually upload to:
// - AWS S3
// - Google Cloud Storage
// - Azure Blob Storage
// - Cloudflare R2

// Then update manifest with URLs:
manifest.resources.baseUrl = 'https://cdn.example.com/math-pack/v1.0.0';
```

### 5. Build Package

Click "Build Package" button or use the service:

```typescript
const blob = await builder.buildPackage(data);

// Validate before distribution
const validation = await builder.validatePackage(blob);
if (!validation.valid) {
  console.error('Package validation failed:', validation.errors);
}
```

### 6. Test Locally

Install your extension in Lousa Digital:

```typescript
import { getExtensionRegistry } from '@/modules/extensions';

const registry = getExtensionRegistry();

// Install
const result = await registry.install('./math-pack.ldip');
if (result.success) {
  console.log('Installed:', result.extensionId);
  
  // Enable
  await registry.enable(result.extensionId);
  
  // Get templates
  const templates = await registry.getTemplates(result.extensionId);
  console.log('Available templates:', templates);
}
```

### 7. Distribute

Options:
- **Direct download:** Share .ldip file
- **Marketplace:** Upload to Lousa Digital Marketplace (future)
- **Internal:** Deploy via MDM for institutions

## Extension Types in Detail

### Template Pack

**Use Case:** Pre-configured lesson templates

**Example:**
```json
{
  "type": "template-pack",
  "category": "education",
  "tags": ["math", "algebra"],
  "permissions": {
    "required": ["template-create", "document-read"]
  }
}
```

**Structure:**
```
templates/
├── index.json              # Template registry
├── algebra-basics.json     # Template definition
└── geometry-intro.json     # Template definition
```

### Tool Plugin

**Use Case:** Custom interactive tools

**Example:**
```json
{
  "type": "tool",
  "category": "tools",
  "permissions": {
    "required": ["document-write", "layer-create"]
  }
}
```

**Tool Definition:**
```typescript
interface ToolDefinition {
  icon: 'ruler.svg',
  name: 'Advanced Ruler',
  category: 'measurement',
  activate: (context: ToolContext) => {
    // Tool logic here
    context.canvas.addLine(...);
  }
}
```

### Theme Pack

**Use Case:** Visual themes

**Example:**
```json
{
  "type": "theme",
  "category": "themes",
  "permissions": {
    "required": []
  }
}
```

**Theme Definition:**
```typescript
interface Theme {
  id: 'dark-professional',
  name: 'Dark Professional',
  colors: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    primary: '#007acc',
    accent: '#ff6b6b'
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: { base: 16, large: 24 }
  }
}
```

### Integration Plugin

**Use Case:** External system integration

**Example:**
```json
{
  "type": "integration",
  "category": "integrations",
  "permissions": {
    "required": ["network-access", "external-auth"]
  }
}
```

**Adapter:**
```typescript
class GoogleClassroomAdapter implements IntegrationAdapter {
  async connect() { /* OAuth flow */ }
  async sync(document) { /* Upload to Classroom */ }
  async export(document) { /* Export as assignment */ }
}
```

### Resource Pack

**Use Case:** Media collections

**Example:**
```json
{
  "type": "resource-pack",
  "category": "media",
  "tags": ["science", "biology", "illustrations"]
}
```

## Working with Cloud Resources

### Resource Manifest

Cloud resources are described in a separate manifest:

```json
{
  "version": "1.0.0",
  "baseUrl": "https://cdn.example.com/pack/v1.0.0",
  "resources": [
    {
      "id": "img-dna-structure",
      "filename": "dna-structure.png",
      "url": "https://cdn.example.com/pack/v1.0.0/images/dna.png",
      "type": "image/png",
      "size": 125000,
      "dimensions": { "width": 800, "height": 600 },
      "checksum": {
        "algorithm": "sha256",
        "value": "abc123..."
      },
      "variants": {
        "thumbnail": "https://cdn.example.com/.../dna-thumb.png",
        "preview": "https://cdn.example.com/.../dna-preview.png"
      }
    }
  ]
}
```

### Loading Resources

```typescript
import { getCloudResourceManager } from '@/modules/extensions';

const resourceManager = getCloudResourceManager();

// Load with caching
const image = await resourceManager.loadResource(
  'https://cdn.example.com/image.png',
  {
    cache: true,
    cacheTTL: 86400,  // 24 hours
    fallback: 'placeholder'
  }
);

// Display image
const url = URL.createObjectURL(image);
imgElement.src = url;
```

### Prefetching

For better performance:

```typescript
// Prefetch on enable
await resourceManager.prefetchResources([
  'https://cdn.example.com/image1.png',
  'https://cdn.example.com/image2.png',
  'https://cdn.example.com/image3.png'
]);
```

## Permissions System

### Required vs Optional

```json
{
  "permissions": {
    "required": [
      "template-create",   // Must be granted
      "document-read"
    ],
    "optional": [
      "cloud-storage-read" // Nice to have
    ]
  }
}
```

### Permission Types

| Permission | Description | Restricted |
|------------|-------------|------------|
| `document-read` | Read document data | No |
| `document-write` | Modify documents | No |
| `template-create` | Create templates | No |
| `network-access` | Make HTTP requests | No |
| `file-system-read` | Read local files | No |
| `file-system-write` | Write local files | Yes |
| `code-execution` | Execute arbitrary code | Yes |
| `native-module` | Load native modules | Yes |

**Restricted permissions** require special review and user approval.

## Lifecycle Hooks

Extensions can respond to lifecycle events:

```json
{
  "lifecycle": {
    "onInstall": {
      "script": "./scripts/on-install.js",
      "migrations": ["./migrations/v1.0.0.js"]
    },
    "onEnable": {
      "script": "./scripts/on-enable.js",
      "timeout": 5000
    },
    "onDisable": {
      "script": "./scripts/on-disable.js"
    },
    "onUninstall": {
      "script": "./scripts/on-uninstall.js",
      "cleanup": true
    }
  }
}
```

**Example hook:**

```javascript
// scripts/on-enable.js
export function onEnable(context) {
  console.log('Extension enabled!');
  
  // Register templates
  context.registry.registerTemplates(templates);
  
  // Setup UI
  context.ui.addMenuItem({
    label: 'My Extension',
    action: () => { /* ... */ }
  });
}
```

## Versioning & Updates

### Semantic Versioning

Follow semver: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes (requires migration)
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

```json
{
  "metadata": {
    "version": "2.1.3"
  }
}
```

### Dependency Ranges

```json
{
  "requirements": {
    "minAppVersion": "1.0.0",
    "maxAppVersion": "2.x.x",  // Wildcard
    "dependencies": [
      {
        "id": "com.lousa.core-fonts",
        "version": "^1.0.0",   // Caret: >=1.0.0 <2.0.0
        "optional": false
      },
      {
        "id": "com.lousa.animations",
        "version": "~1.2.0",   // Tilde: >=1.2.0 <1.3.0
        "optional": true
      }
    ]
  }
}
```

## Troubleshooting

### Validation Errors

**Error:** "Invalid extension ID format"

**Fix:** Use reverse domain notation:
```
❌ myextension
✅ com.example.myextension
```

**Error:** "Manifest checksum mismatch"

**Fix:** Regenerate checksum:
```typescript
const checksum = computeChecksum(
  JSON.stringify(manifest),
  'sha256'
);
manifest.integrity.checksum.manifest = checksum;
```

### Installation Fails

**Error:** "Missing dependencies"

**Fix:** Install required extensions first, or mark as optional:
```json
{
  "dependencies": [
    {
      "id": "com.lousa.core-fonts",
      "version": "^1.0.0",
      "optional": true  // Won't block install
    }
  ]
}
```

### Cloud Resources Not Loading

**Error:** "Circuit breaker open"

**Fix:** Check CDN availability, or enable fallback:
```typescript
await resourceManager.loadResource(url, {
  fallback: 'cache'  // Use stale cache
});
```

## Best Practices

### 1. Keep Packages Small

✅ Store only metadata in .ldip  
❌ Don't bundle large images/videos

### 2. Use CDN

✅ Host resources on CDN (Cloudflare, AWS)  
❌ Don't use slow hosting

### 3. Provide Fallbacks

```typescript
// Good: Graceful degradation
try {
  const image = await loadResource(url);
} catch {
  showPlaceholder();
}
```

### 4. Test Thoroughly

- Test in offline mode
- Test with missing dependencies
- Test permission denials

### 5. Document Well

Include:
- README.md (user guide)
- CHANGELOG.md (version history)
- LICENSE (legal)

## Examples

See `examples/` directory for complete examples:

- `examples/alfabetizacao-pack/` - Template pack example
- `examples/dark-theme/` - Theme pack example (TODO)
- `examples/ruler-tool/` - Tool plugin example (TODO)

## API Reference

See `ARCHITECTURE.md` for detailed API documentation.

## Support

- Issues: [GitHub Issues](https://github.com/chjsoliveiraa/piloto-lousa-digital-studio/issues)
- Discussions: [GitHub Discussions](https://github.com/chjsoliveiraa/piloto-lousa-digital-studio/discussions)

---

**Happy extension building! 🚀**
