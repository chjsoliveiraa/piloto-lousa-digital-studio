/**
 * Manifest Generator Service
 * Creates and updates extension manifests
 * Following Clean Architecture - Application Layer
 */

import type {
  ExtensionManifest,
  ExtensionType,
  Metadata,
  Requirements,
  Resources,
  Permissions,
  Configuration,
  Lifecycle,
  Monitoring,
  Integrity,
  MetadataExtended,
} from '@/shared/types';
import { computeChecksum } from '@/shared/utils/crypto';
import { generateId } from '@/shared/utils/crypto';

export interface ManifestOptions {
  metadata: Metadata;
  type: ExtensionType;
  category: string;
  tags?: string[];
  targetAudience?: string[];
  requirements: Requirements;
  resources: Resources;
  permissions: Permissions;
  configuration?: Configuration;
  lifecycle?: Lifecycle;
  monitoring?: Monitoring;
}

export class ManifestGenerator {
  private readonly schemaUrl = 'https://lousa.digital/schemas/manifest-v1.0.json';
  private readonly manifestVersion = '1.0.0';
  private readonly schemaVersion = '1.0.0';
  private readonly studioVersion = '1.0.0';

  /**
   * Create a new extension manifest
   */
  public createManifest(options: ManifestOptions): ExtensionManifest {
    const now = new Date().toISOString();

    const manifest: Partial<ExtensionManifest> = {
      $schema: this.schemaUrl,
      manifest_version: this.manifestVersion,
      schema_version: this.schemaVersion,
      metadata: options.metadata,
      type: options.type,
      category: options.category,
      tags: options.tags || [],
      targetAudience: options.targetAudience,
      requirements: options.requirements,
      resources: options.resources,
      permissions: options.permissions,
      configuration: options.configuration,
      lifecycle: options.lifecycle,
      monitoring: options.monitoring || {
        telemetry: {
          enabled: false,
        },
        errorReporting: {
          enabled: false,
        },
        analytics: {
          enabled: false,
        },
      },
      metadata_extended: {
        created_at: now,
        updated_at: now,
        build_info: {
          studio_version: this.studioVersion,
          build_timestamp: now,
          build_hash: generateId(16),
        },
        size: {
          package: 0, // Will be updated after build
          resources_local: 0,
          resources_cloud: 0,
        },
      },
    };

    // Generate integrity checksums
    manifest.integrity = this.generateIntegrity(manifest as ExtensionManifest);

    return manifest as ExtensionManifest;
  }

  /**
   * Update an existing manifest
   */
  public updateManifest(
    manifest: ExtensionManifest,
    updates: Partial<ManifestOptions>
  ): ExtensionManifest {
    const updated: ExtensionManifest = {
      ...manifest,
      ...updates,
      metadata: updates.metadata || manifest.metadata,
      requirements: updates.requirements || manifest.requirements,
      resources: updates.resources || manifest.resources,
      permissions: updates.permissions || manifest.permissions,
      metadata_extended: {
        ...manifest.metadata_extended,
        updated_at: new Date().toISOString(),
        build_info: {
          ...manifest.metadata_extended?.build_info,
          studio_version: this.studioVersion,
          build_timestamp: new Date().toISOString(),
          build_hash: generateId(16),
        },
      } as MetadataExtended,
    };

    // Regenerate integrity checksums
    updated.integrity = this.generateIntegrity(updated);

    return updated;
  }

  /**
   * Generate integrity checksums for manifest
   */
  private generateIntegrity(manifest: ExtensionManifest): Integrity {
    // Create a copy without integrity for checksum calculation
    const manifestCopy = { ...manifest };
    delete (manifestCopy as Partial<ExtensionManifest>).integrity;

    const manifestJson = JSON.stringify(manifestCopy);
    const checksum = computeChecksum(manifestJson, 'sha256');

    return {
      checksum: {
        algorithm: 'sha256',
        manifest: checksum,
      },
    };
  }

  /**
   * Create default manifest for template pack
   */
  public createTemplatePackManifest(
    id: string,
    name: string,
    author: string,
    authorEmail: string
  ): ExtensionManifest {
    return this.createManifest({
      metadata: {
        id,
        name,
        version: '1.0.0',
        description: 'A collection of lesson templates',
        author: {
          name: author,
          email: authorEmail,
        },
        license: 'MIT',
      },
      type: 'template-pack',
      category: 'education',
      tags: ['templates', 'lessons'],
      requirements: {
        minAppVersion: '1.0.0',
        dependencies: [],
      },
      resources: {
        baseUrl: `https://cdn.lousa.digital/extensions/${id}/v1.0.0`,
        manifest: {
          templates: './templates/index.json',
        },
      },
      permissions: {
        required: ['template-create', 'document-read'],
        optional: [],
        restrictedApis: [],
      },
    });
  }

  /**
   * Create default manifest for tool plugin
   */
  public createToolPluginManifest(
    id: string,
    name: string,
    author: string,
    authorEmail: string
  ): ExtensionManifest {
    return this.createManifest({
      metadata: {
        id,
        name,
        version: '1.0.0',
        description: 'A custom tool plugin',
        author: {
          name: author,
          email: authorEmail,
        },
        license: 'MIT',
      },
      type: 'tool',
      category: 'tools',
      tags: ['tool', 'plugin'],
      requirements: {
        minAppVersion: '1.0.0',
        dependencies: [],
      },
      resources: {
        baseUrl: `https://cdn.lousa.digital/extensions/${id}/v1.0.0`,
        manifest: {},
      },
      permissions: {
        required: ['document-write', 'layer-create'],
        optional: [],
        restrictedApis: [],
      },
    });
  }

  /**
   * Create default manifest for theme pack
   */
  public createThemePackManifest(
    id: string,
    name: string,
    author: string,
    authorEmail: string
  ): ExtensionManifest {
    return this.createManifest({
      metadata: {
        id,
        name,
        version: '1.0.0',
        description: 'A collection of visual themes',
        author: {
          name: author,
          email: authorEmail,
        },
        license: 'MIT',
      },
      type: 'theme',
      category: 'themes',
      tags: ['theme', 'design'],
      requirements: {
        minAppVersion: '1.0.0',
        dependencies: [],
      },
      resources: {
        baseUrl: `https://cdn.lousa.digital/extensions/${id}/v1.0.0`,
        manifest: {},
      },
      permissions: {
        required: [],
        optional: [],
        restrictedApis: [],
      },
    });
  }

  /**
   * Validate manifest ID format
   */
  public validateManifestId(id: string): boolean {
    const idRegex = /^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*\.[a-z0-9-]+$/;
    return idRegex.test(id);
  }

  /**
   * Generate a valid manifest ID from name
   */
  public generateManifestId(domain: string, name: string): string {
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${domain}.${sanitizedName}`;
  }
}
