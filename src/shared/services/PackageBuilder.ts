/**
 * Package Builder Service
 * Creates .ldip packages from extension data
 * Following Clean Architecture - Application Layer
 */

import JSZip from 'jszip';
import type { ExtensionManifest, LessonTemplate } from '@/shared/types';
import { computeChecksum } from '@/shared/utils/crypto';

export interface PackageData {
  manifest: ExtensionManifest;
  templates?: LessonTemplate[];
  scripts?: PackageScript[];
  schemas?: PackageSchema[];
  documentation?: PackageDocumentation;
}

export interface PackageScript {
  name: string;
  content: string;
}

export interface PackageSchema {
  name: string;
  content: object;
}

export interface PackageDocumentation {
  readme?: string;
  changelog?: string;
  license?: string;
}

export class PackageBuilder {
  /**
   * Build a .ldip package from extension data
   */
  public async buildPackage(data: PackageData): Promise<Blob> {
    const zip = new JSZip();

    // Add manifest
    const manifestJson = JSON.stringify(data.manifest, null, 2);
    zip.file('manifest.json', manifestJson);

    // Add templates if present
    if (data.templates && data.templates.length > 0) {
      const templatesFolder = zip.folder('templates');
      if (templatesFolder) {
        // Add index file
        const templatesIndex = {
          version: data.manifest.metadata.version,
          templates: data.templates.map((t) => ({
            id: t.id,
            name: t.metadata.name,
            description: t.metadata.description,
            file: `${t.id}.json`,
          })),
        };
        templatesFolder.file('index.json', JSON.stringify(templatesIndex, null, 2));

        // Add individual template files
        for (const template of data.templates) {
          templatesFolder.file(
            `${template.id}.json`,
            JSON.stringify(template, null, 2)
          );
        }
      }
    }

    // Add scripts if present
    if (data.scripts && data.scripts.length > 0) {
      const scriptsFolder = zip.folder('scripts');
      if (scriptsFolder) {
        for (const script of data.scripts) {
          scriptsFolder.file(script.name, script.content);
        }
      }
    }

    // Add schemas if present
    if (data.schemas && data.schemas.length > 0) {
      const schemasFolder = zip.folder('schemas');
      if (schemasFolder) {
        for (const schema of data.schemas) {
          schemasFolder.file(
            schema.name,
            JSON.stringify(schema.content, null, 2)
          );
        }
      }
    }

    // Add documentation
    if (data.documentation) {
      if (data.documentation.readme) {
        zip.file('README.md', data.documentation.readme);
      }
      if (data.documentation.changelog) {
        zip.file('CHANGELOG.md', data.documentation.changelog);
      }
      if (data.documentation.license) {
        zip.file('LICENSE', data.documentation.license);
      }
    }

    // Generate ZIP blob
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9, // Maximum compression
      },
    });

    return blob;
  }

  /**
   * Extract package contents from .ldip file
   */
  public async extractPackage(blob: Blob): Promise<PackageData> {
    const zip = await JSZip.loadAsync(blob);

    // Read manifest
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      throw new Error('Invalid package: manifest.json not found');
    }
    const manifestJson = await manifestFile.async('string');
    const manifest: ExtensionManifest = JSON.parse(manifestJson);

    // Read templates if present
    let templates: LessonTemplate[] | undefined;
    const templatesFolder = zip.folder('templates');
    if (templatesFolder) {
      templates = [];
      const indexFile = zip.file('templates/index.json');
      if (indexFile) {
        const indexJson = await indexFile.async('string');
        const index = JSON.parse(indexJson);
        
        for (const templateRef of index.templates) {
          const templateFile = zip.file(`templates/${templateRef.file}`);
          if (templateFile) {
            const templateJson = await templateFile.async('string');
            const template: LessonTemplate = JSON.parse(templateJson);
            templates.push(template);
          }
        }
      }
    }

    // Read scripts if present
    let scripts: PackageScript[] | undefined;
    const scriptsFolder = zip.folder('scripts');
    if (scriptsFolder) {
      scripts = [];
      const scriptFiles = Object.keys(zip.files).filter((name) =>
        name.startsWith('scripts/') && !name.endsWith('/')
      );
      for (const scriptPath of scriptFiles) {
        const scriptFile = zip.file(scriptPath);
        if (scriptFile) {
          const content = await scriptFile.async('string');
          scripts.push({
            name: scriptPath.replace('scripts/', ''),
            content,
          });
        }
      }
    }

    // Read documentation
    const documentation: PackageDocumentation = {};
    const readmeFile = zip.file('README.md');
    if (readmeFile) {
      documentation.readme = await readmeFile.async('string');
    }
    const changelogFile = zip.file('CHANGELOG.md');
    if (changelogFile) {
      documentation.changelog = await changelogFile.async('string');
    }
    const licenseFile = zip.file('LICENSE');
    if (licenseFile) {
      documentation.license = await licenseFile.async('string');
    }

    return {
      manifest,
      templates,
      scripts,
      documentation,
    };
  }

  /**
   * Validate package integrity
   */
  public async validatePackage(blob: Blob): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const data = await this.extractPackage(blob);

      // Validate manifest checksum
      const manifestJson = JSON.stringify(data.manifest);
      const computedChecksum = computeChecksum(manifestJson, 'sha256');

      if (data.manifest.integrity?.checksum?.manifest !== computedChecksum) {
        errors.push('Manifest checksum mismatch - possible tampering');
      }

      // Additional validations can be added here

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(
        `Failed to validate package: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return { valid: false, errors };
    }
  }

  /**
   * Get package size information
   */
  public async getPackageSize(blob: Blob): Promise<{
    compressed: number;
    uncompressed: number;
  }> {
    const compressed = blob.size;

    // Calculate uncompressed size by reading file contents
    const zip = await JSZip.loadAsync(blob);
    let uncompressed = 0;
    
    const promises: Promise<void>[] = [];
    zip.forEach((_, file) => {
      if (!file.dir) {
        promises.push(
          file.async('uint8array').then((content) => {
            uncompressed += content.length;
          })
        );
      }
    });
    
    await Promise.all(promises);

    return { compressed, uncompressed };
  }
}
