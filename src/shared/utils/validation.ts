/**
 * Validation Utilities
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { 
  ExtensionManifest, 
  ValidationResult,
  DependencyCheck,
  PermissionValidation,
  Permission
} from '../types';
import manifestSchema from '../schemas/manifest.schema.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateManifestSchema = ajv.compile(manifestSchema);

/**
 * List of restricted permissions that require special review
 */
export const RESTRICTED_PERMISSIONS: Permission[] = [
  'code-execution',
  'native-module',
  'file-system-write',
];

/**
 * Validate manifest structure against JSON Schema
 */
export function validateManifestStructure(manifest: unknown): ValidationResult {
  const valid = validateManifestSchema(manifest);
  
  if (!valid && validateManifestSchema.errors) {
    return {
      valid: false,
      errors: validateManifestSchema.errors.map(
        (err) => `${err.instancePath} ${err.message}`
      ),
    };
  }
  
  return { valid: true, errors: [] };
}

/**
 * Validate semantic version format
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-z0-9-.]+)?$/;
  return semverRegex.test(version);
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareSemver(v1: string, v2: string): number {
  const parts1 = v1.split('-')[0].split('.').map(Number);
  const parts2 = v2.split('-')[0].split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  
  return 0;
}

/**
 * Check if version matches semver range
 * Supports: "1.0.0", "^1.0.0", "~1.0.0", "1.x.x", ">=1.0.0"
 */
export function matchesSemverRange(version: string, range: string): boolean {
  // Exact match
  if (range === version) return true;
  
  // Wildcard match (1.x.x)
  if (range.includes('x')) {
    const rangeParts = range.split('.');
    const versionParts = version.split('.');
    for (let i = 0; i < rangeParts.length; i++) {
      if (rangeParts[i] !== 'x' && rangeParts[i] !== versionParts[i]) {
        return false;
      }
    }
    return true;
  }
  
  // Caret range (^1.0.0) - allows minor and patch updates
  if (range.startsWith('^')) {
    const baseVersion = range.slice(1);
    const comparison = compareSemver(version, baseVersion);
    if (comparison < 0) return false;
    
    const baseMajor = parseInt(baseVersion.split('.')[0]);
    const versionMajor = parseInt(version.split('.')[0]);
    return versionMajor === baseMajor;
  }
  
  // Tilde range (~1.0.0) - allows patch updates only
  if (range.startsWith('~')) {
    const baseVersion = range.slice(1);
    const comparison = compareSemver(version, baseVersion);
    if (comparison < 0) return false;
    
    const [baseMajor, baseMinor] = baseVersion.split('.').map(Number);
    const [versionMajor, versionMinor] = version.split('.').map(Number);
    return versionMajor === baseMajor && versionMinor === baseMinor;
  }
  
  // Greater than or equal (>=1.0.0)
  if (range.startsWith('>=')) {
    const baseVersion = range.slice(2);
    return compareSemver(version, baseVersion) >= 0;
  }
  
  return false;
}

/**
 * Check if app version is compatible with manifest requirements
 */
export function isCompatibleVersion(
  appVersion: string,
  manifest: ExtensionManifest
): boolean {
  const { minAppVersion, maxAppVersion } = manifest.requirements;
  
  // Check minimum version
  if (compareSemver(appVersion, minAppVersion) < 0) {
    return false;
  }
  
  // Check maximum version if specified
  if (maxAppVersion && !matchesSemverRange(appVersion, maxAppVersion)) {
    return false;
  }
  
  return true;
}

/**
 * Validate extension ID format (reverse domain notation)
 */
export function isValidExtensionId(id: string): boolean {
  const idRegex = /^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/;
  return idRegex.test(id);
}

/**
 * Validate permissions
 */
export function validatePermissions(
  manifest: ExtensionManifest
): PermissionValidation {
  const restricted = manifest.permissions.required.filter((perm) =>
    RESTRICTED_PERMISSIONS.includes(perm)
  );
  
  return {
    valid: restricted.length === 0,
    needsUserConsent: manifest.permissions.required.length > 0,
    restrictedPermissions: restricted,
  };
}

/**
 * Full manifest validation
 * Combines schema validation with semantic checks
 */
export function validateManifest(
  manifest: ExtensionManifest,
  appVersion: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Schema validation
  const schemaValidation = validateManifestStructure(manifest);
  if (!schemaValidation.valid) {
    errors.push(...schemaValidation.errors);
  }
  
  // Semantic validations
  if (!isValidExtensionId(manifest.metadata.id)) {
    errors.push('Invalid extension ID format');
  }
  
  if (!isValidSemver(manifest.metadata.version)) {
    errors.push('Invalid version format');
  }
  
  if (!isCompatibleVersion(appVersion, manifest)) {
    errors.push(
      `Incompatible app version. Requires ${manifest.requirements.minAppVersion}+`
    );
  }
  
  // Permission validation
  const permValidation = validatePermissions(manifest);
  if (!permValidation.valid) {
    warnings.push(
      `Extension requests restricted permissions: ${permValidation.restrictedPermissions.join(', ')}`
    );
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
