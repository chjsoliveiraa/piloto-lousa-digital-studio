/**
 * Extension Manifest Types
 * Following the specification from ADR-006
 */

export type ExtensionType = 
  | 'template-pack' 
  | 'tool' 
  | 'theme' 
  | 'integration' 
  | 'resource-pack';

export type Platform = 'win32' | 'darwin' | 'linux';

export type Permission =
  | 'document-read'
  | 'document-write'
  | 'template-create'
  | 'template-read'
  | 'layer-create'
  | 'resource-read'
  | 'network-access'
  | 'cloud-storage-read'
  | 'cloud-storage-write'
  | 'file-system-read'
  | 'file-system-write'
  | 'external-auth'
  | 'code-execution'
  | 'native-module';

export interface Author {
  name: string;
  email: string;
  url?: string;
}

export interface Dependency {
  id: string;
  version: string;
  optional: boolean;
  reason?: string;
}

export interface Requirements {
  minAppVersion: string;
  maxAppVersion?: string;
  platform?: Platform[];
  dependencies: Dependency[];
}

export interface ResourceManifestConfig {
  templates?: string;
  images?: string;
  videos?: string;
  audio?: string;
  fonts?: string;
}

export interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'google' | 'azure' | 'custom';
  region?: string;
  caching: {
    enabled: boolean;
    ttl: number;
    immutable?: boolean;
  };
}

export interface Resources {
  baseUrl: string;
  manifest: ResourceManifestConfig;
  cdn?: CDNConfig;
}

export interface Permissions {
  required: Permission[];
  optional: Permission[];
  restrictedApis: string[];
}

export interface Configuration {
  configurable: boolean;
  schema?: string;
  defaults?: Record<string, unknown>;
}

export interface LifecycleScript {
  script: string | null;
  timeout?: number;
}

export interface Lifecycle {
  onInstall?: LifecycleScript & { migrations?: string[] };
  onEnable?: LifecycleScript;
  onDisable?: LifecycleScript;
  onUninstall?: LifecycleScript & { cleanup?: boolean };
}

export interface Telemetry {
  enabled: boolean;
  endpoint?: string;
  events?: string[];
}

export interface ErrorReporting {
  enabled: boolean;
  endpoint?: string;
  sampleRate?: number;
}

export interface Analytics {
  enabled: boolean;
  provider?: string;
}

export interface Monitoring {
  telemetry?: Telemetry;
  errorReporting?: ErrorReporting;
  analytics?: Analytics;
}

export interface Checksum {
  algorithm: 'sha256' | 'sha512';
  manifest: string;
  resources?: string;
}

export interface Signature {
  algorithm: 'RSA-SHA256' | 'ECDSA-SHA256';
  publicKey: string;
  signature: string;
}

export interface Integrity {
  checksum: Checksum;
  signature?: Signature;
}

export interface BuildInfo {
  studio_version: string;
  build_timestamp: string;
  build_hash: string;
}

export interface SizeInfo {
  package: number;
  resources_local: number;
  resources_cloud: number;
}

export interface Stats {
  downloads?: number;
  rating?: number;
  reviews?: number;
}

export interface MetadataExtended {
  created_at: string;
  updated_at: string;
  build_info: BuildInfo;
  size: SizeInfo;
  stats?: Stats;
}

export interface Metadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: Author;
  license: string;
  homepage?: string;
  repository?: string;
}

/**
 * Main Extension Manifest Interface
 * This is the core schema for all extensions
 */
export interface ExtensionManifest {
  $schema: string;
  manifest_version: string;
  schema_version: string;
  
  metadata: Metadata;
  
  type: ExtensionType;
  category: string;
  tags: string[];
  targetAudience?: string[];
  
  requirements: Requirements;
  resources: Resources;
  permissions: Permissions;
  configuration?: Configuration;
  lifecycle?: Lifecycle;
  monitoring?: Monitoring;
  integrity: Integrity;
  metadata_extended?: MetadataExtended;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Dependency Check Result
 */
export interface DependencyCheck {
  satisfied: boolean;
  missing: Dependency[];
}

/**
 * Permission Validation Result
 */
export interface PermissionValidation {
  valid: boolean;
  needsUserConsent: boolean;
  restrictedPermissions: Permission[];
}
