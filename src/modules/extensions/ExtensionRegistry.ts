/**
 * Extension Registry
 * Singleton service for managing extension lifecycle
 * Following Clean Architecture principles (Application Layer)
 */

import type {
  Extension,
  ExtensionManifest,
  InstallResult,
  DependencyCheck,
  ValidationResult,
} from '@/shared/types';
import { validateManifest, compareSemver } from '@/shared/utils';

export class ExtensionRegistry {
  private static instance: ExtensionRegistry;
  private extensions: Map<string, Extension> = new Map();
  private readonly appVersion = '1.0.0'; // Should come from config

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    return ExtensionRegistry.instance;
  }

  /**
   * Install an extension from a .ldip package
   */
  public async install(packagePath: string): Promise<InstallResult> {
    try {
      // This would extract and validate the package
      // For now, this is a placeholder implementation
      console.log('Installing extension from:', packagePath);
      
      return {
        success: true,
        extensionId: 'example-extension',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Register an extension (after installation)
   */
  public registerExtension(extension: Extension): void {
    // Validate manifest
    const validation = this.validateExtension(extension.manifest);
    if (!validation.valid) {
      throw new Error(`Invalid extension: ${validation.errors.join(', ')}`);
    }

    // Check dependencies
    const depCheck = this.checkDependencies(extension.manifest);
    if (!depCheck.satisfied) {
      throw new Error(
        `Missing dependencies: ${depCheck.missing.map((d) => d.id).join(', ')}`
      );
    }

    // Register extension
    this.extensions.set(extension.id, extension);
    console.log(`Registered extension: ${extension.id}`);
  }

  /**
   * Enable an extension
   */
  public async enable(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (extension.status === 'enabled') {
      console.log(`Extension already enabled: ${extensionId}`);
      return;
    }

    // Execute onEnable lifecycle hook
    if (extension.manifest.lifecycle?.onEnable) {
      // Execute lifecycle script (sandboxed)
      console.log(`Executing onEnable hook for: ${extensionId}`);
    }

    extension.status = 'enabled';
    extension.enabledAt = new Date();
    console.log(`Enabled extension: ${extensionId}`);
  }

  /**
   * Disable an extension
   */
  public async disable(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (extension.status === 'disabled') {
      console.log(`Extension already disabled: ${extensionId}`);
      return;
    }

    // Execute onDisable lifecycle hook
    if (extension.manifest.lifecycle?.onDisable) {
      console.log(`Executing onDisable hook for: ${extensionId}`);
    }

    extension.status = 'disabled';
    console.log(`Disabled extension: ${extensionId}`);
  }

  /**
   * Uninstall an extension
   */
  public async uninstall(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    // Disable first if enabled
    if (extension.status === 'enabled') {
      await this.disable(extensionId);
    }

    // Execute onUninstall lifecycle hook
    if (extension.manifest.lifecycle?.onUninstall) {
      console.log(`Executing onUninstall hook for: ${extensionId}`);
    }

    // Remove from registry
    this.extensions.delete(extensionId);
    console.log(`Uninstalled extension: ${extensionId}`);
  }

  /**
   * Get an extension by ID
   */
  public getExtension(extensionId: string): Extension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * List all installed extensions
   */
  public listExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * List enabled extensions
   */
  public listEnabledExtensions(): Extension[] {
    return this.listExtensions().filter((ext) => ext.status === 'enabled');
  }

  /**
   * Validate extension manifest
   */
  private validateExtension(manifest: ExtensionManifest): ValidationResult {
    return validateManifest(manifest, this.appVersion);
  }

  /**
   * Check if all dependencies are satisfied
   */
  private checkDependencies(manifest: ExtensionManifest): DependencyCheck {
    const missing = manifest.requirements.dependencies
      .filter((dep) => !dep.optional)
      .filter((dep) => {
        const installed = this.extensions.get(dep.id);
        if (!installed) return true;

        // Check version compatibility
        return compareSemver(installed.manifest.metadata.version, dep.version) < 0;
      });

    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * Get templates from a specific extension
   */
  public async getTemplates(extensionId: string): Promise<unknown[]> {
    const extension = this.getExtension(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (extension.manifest.type !== 'template-pack') {
      throw new Error(`Extension is not a template pack: ${extensionId}`);
    }

    // Load templates (would fetch from resources)
    return [];
  }
}

/**
 * Factory function to get the singleton instance
 */
export function getExtensionRegistry(): ExtensionRegistry {
  return ExtensionRegistry.getInstance();
}
