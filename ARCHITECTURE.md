# Lousa Digital Studio Tool - Architecture Documentation

## Overview

The Lousa Digital Integrated Studio Tool is a desktop application built with Electron, React, and TypeScript following Clean Architecture principles. It enables users to create, edit, and package extensions for the Lousa Digital platform.

## Architecture Principles

### Clean Architecture

The project follows Clean Architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│              UI LAYER (Renderer Process)                │
│         React Components, Pages, Styles                 │
└───────────────────┬─────────────────────────────────────┘
                    │ uses
┌───────────────────▼─────────────────────────────────────┐
│        APPLICATION LAYER (Services)                     │
│    PackageBuilder, ManifestGenerator, etc.              │
└───────────┬───────────────────┬─────────────────────────┘
            │ uses              │ uses
┌───────────▼───────────────────▼─────────────────────────┐
│   DOMAIN LAYER         INFRASTRUCTURE LAYER             │
│   Types, Interfaces,   File System, IPC,                │
│   Entities             Cloud Services                    │
└─────────────────────────────────────────────────────────┘
```

**Dependency Rules:**
- UI → Application → Domain
- Infrastructure → Domain
- Domain has NO dependencies (pure business logic)

### Project Structure

```
src/
├── main/                      # Electron main process
│   ├── index.ts              # App entry point
│   └── preload.ts            # IPC bridge
│
├── renderer/                  # React UI (renderer process)
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # React entry point
│   ├── components/           # Reusable components
│   ├── pages/                # Page components
│   └── styles/               # CSS/Tailwind styles
│
├── shared/                    # Shared between processes
│   ├── types/                # TypeScript types & interfaces
│   │   ├── manifest.types.ts
│   │   └── extension.types.ts
│   │
│   ├── schemas/              # JSON Schemas
│   │   └── manifest.schema.json
│   │
│   ├── utils/                # Utility functions
│   │   ├── validation.ts
│   │   ├── crypto.ts
│   │   └── __tests__/
│   │
│   └── services/             # Application services
│       ├── PackageBuilder.ts
│       └── ManifestGenerator.ts
│
└── modules/                   # Feature modules
    └── extensions/           # Extension Runtime Module
        ├── ExtensionRegistry.ts
        ├── CloudResourceManager.ts
        └── index.ts
```

## Core Modules

### 1. Extension Runtime Module

**Location:** `src/modules/extensions/`

**Purpose:** Manages extension lifecycle in the main Lousa Digital application.

**Components:**

#### ExtensionRegistry (Singleton)

Manages all installed extensions:

```typescript
const registry = getExtensionRegistry();

// Install extension
await registry.install('path/to/extension.ldip');

// Enable/disable
await registry.enable('com.example.pack');
await registry.disable('com.example.pack');

// Get templates
const templates = await registry.getTemplates('com.example.pack');
```

**Key Features:**
- Extension installation/uninstallation
- Lifecycle management (onEnable, onDisable hooks)
- Dependency resolution
- Permission validation
- Health monitoring

#### CloudResourceManager (Singleton)

Manages cloud resources with caching and resilience:

```typescript
const resourceManager = getCloudResourceManager();

// Load resource with automatic caching
const image = await resourceManager.loadResource(
  'https://cdn.example.com/image.png',
  { cache: true, cacheTTL: 86400 }
);

// Prefetch for performance
await resourceManager.prefetchResources([url1, url2, url3]);
```

**Key Features:**
- Lazy loading of resources
- Local caching (in-memory)
- Circuit breaker pattern (prevents cascade failures)
- Fallback strategies
- CDN support

### 2. Package Builder Service

**Location:** `src/shared/services/PackageBuilder.ts`

**Purpose:** Creates .ldip packages from extension data.

```typescript
const builder = new PackageBuilder();

const blob = await builder.buildPackage({
  manifest,
  templates,
  scripts,
  documentation
});

// Extract package
const data = await builder.extractPackage(blob);

// Validate
const validation = await builder.validatePackage(blob);
```

**Package Format (.ldip):**
- ZIP compressed archive
- Contains manifest, templates, scripts
- Resources stored in cloud (URLs only)
- Typical size: 50-200KB

### 3. Manifest Generator Service

**Location:** `src/shared/services/ManifestGenerator.ts`

**Purpose:** Creates and updates extension manifests.

```typescript
const generator = new ManifestGenerator();

// Create new manifest
const manifest = generator.createTemplatePackManifest(
  'com.example.mypack',
  'My Template Pack',
  'Author Name',
  'author@example.com'
);

// Update existing
const updated = generator.updateManifest(manifest, {
  metadata: { version: '1.1.0' }
});
```

**Manifest Features:**
- Schema validation
- Checksum generation
- Version management
- Dependency tracking

## Extension System

### Extension Types

1. **Template Pack** - Lesson templates
2. **Tool Plugin** - Custom tools
3. **Theme Pack** - Visual themes
4. **Integration Plugin** - External integrations
5. **Resource Pack** - Media collections

### Manifest Structure

Every extension has a `manifest.json`:

```json
{
  "$schema": "https://lousa.digital/schemas/manifest-v1.0.json",
  "manifest_version": "1.0.0",
  "metadata": {
    "id": "com.example.pack",
    "name": "My Extension",
    "version": "1.0.0",
    "description": "...",
    "author": { "name": "...", "email": "..." },
    "license": "MIT"
  },
  "type": "template-pack",
  "requirements": {
    "minAppVersion": "1.0.0",
    "dependencies": []
  },
  "resources": {
    "baseUrl": "https://cdn.example.com/...",
    "manifest": { "templates": "./templates/index.json" }
  },
  "permissions": {
    "required": ["template-create"],
    "optional": [],
    "restrictedApis": []
  },
  "integrity": {
    "checksum": { "algorithm": "sha256", "manifest": "..." }
  }
}
```

### Cloud-First Resource Model

**Problem:** Traditional extensions bundle all resources → large packages

**Solution:** Store heavy resources in cloud, only metadata in package

```
Package (.ldip) - 50KB
├── manifest.json (metadata)
├── templates/index.json (definitions)
└── scripts/ (small code)

Cloud Storage - 15MB
├── images/ (high-res photos)
├── videos/ (clips)
└── fonts/ (typefaces)
```

**Benefits:**
- Fast installation
- Reduced bandwidth
- Easy updates
- CDN acceleration

### Resource Loading Flow

1. **Install:** Extract .ldip, validate manifest
2. **Enable:** Execute onEnable hook
3. **Use Template:** Load template definition (local)
4. **Render:** Fetch images from cloud (lazy)
5. **Cache:** Store in memory for reuse

### Fail-Safe Mechanisms

#### 1. Validation Layers

```typescript
// Schema validation
validateManifestStructure(manifest);

// Dependency check
checkDependencies(manifest);

// Permission validation
validatePermissions(manifest);

// Checksum verification
verifyChecksum(manifest);
```

#### 2. Circuit Breaker

Prevents cascade failures when cloud resources are unavailable:

```typescript
// After 5 consecutive failures, circuit opens
// Waits 60s before retry
// Falls back to cache or placeholder
```

#### 3. Rollback

If installation fails, automatic rollback:

```typescript
try {
  await transaction.install(extension);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();  // Restore previous state
  throw error;
}
```

## Security

### Sandboxing

Extensions run in isolated context:

```typescript
// Limited API access
const sandbox = {
  console: createSafeConsole(),
  fetch: createRestrictedFetch(),
  // NO: fs, require, child_process
};
```

### Permissions

Granular permission system:

```typescript
enum Permission {
  DOCUMENT_READ = 'document-read',
  DOCUMENT_WRITE = 'document-write',
  TEMPLATE_CREATE = 'template-create',
  NETWORK_ACCESS = 'network-access',
  CODE_EXECUTION = 'code-execution',  // Restricted
  NATIVE_MODULE = 'native-module',    // Restricted
}
```

### Integrity

- **Checksums:** SHA-256 for manifest and resources
- **Signatures:** RSA-SHA256 digital signatures
- **Validation:** Multi-layer validation on install

## Testing Strategy

### Unit Tests

Test individual functions:

```typescript
describe('isValidSemver', () => {
  it('should validate correct semver', () => {
    expect(isValidSemver('1.0.0')).toBe(true);
  });
});
```

Run: `npm test`

### Integration Tests

Test service interactions (TODO)

### E2E Tests

Test full user flows (TODO)

## Build System

### Development

```bash
npm run dev          # Start dev server (hot reload)
npm run type-check   # TypeScript validation
npm run lint         # ESLint
npm test            # Run tests
```

### Production

```bash
npm run build       # Build for production
npm run package     # Create Electron package
```

### Vite Configuration

- **Main Process:** `vite.main.config.ts` (Node.js bundle)
- **Renderer:** `vite.renderer.config.ts` (React SPA)

## Performance Optimizations

### Lazy Loading

Resources loaded on-demand:

```typescript
// Template metadata loaded immediately (KB)
const template = loadTemplate(id);

// Images loaded when rendered (MB)
const image = await loadResource(template.imageUrl);
```

### Caching Strategy

- **Memory Cache:** Fast access for current session
- **TTL:** 24 hours default
- **Invalidation:** Manual or on update

### Compression

- ZIP compression (level 9)
- Typical compression ratio: 60-80%

## Future Enhancements

### V1 (MVP)
- [x] Core architecture
- [x] Extension registry
- [x] Package builder
- [x] Manifest generator
- [ ] Full UI implementation
- [ ] Cloud upload

### V2
- [ ] Marketplace integration
- [ ] Auto-updates
- [ ] Visual scripting
- [ ] Collaborative editing

### V3
- [ ] Plugin SDK
- [ ] Enterprise features
- [ ] Analytics dashboard

## Contributing

### Code Style

- **TypeScript:** Strict mode enabled
- **Formatting:** Follow ESLint rules
- **Naming:** camelCase for variables, PascalCase for types
- **Comments:** JSDoc for public APIs

### Pull Request Process

1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with description

## Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Electron Documentation](https://www.electronjs.org/docs)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Last Updated:** 2025-01-18  
**Version:** 1.0.0  
**Maintainers:** Product Orchestrator, Architecture & Platform Team
