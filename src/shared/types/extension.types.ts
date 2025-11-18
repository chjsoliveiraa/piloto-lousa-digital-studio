/**
 * Extension Domain Types
 */

import type { ExtensionManifest } from './manifest.types';

export type ExtensionStatus = 
  | 'installed' 
  | 'enabled' 
  | 'disabled' 
  | 'degraded' 
  | 'error';

export interface Extension {
  id: string;
  manifest: ExtensionManifest;
  status: ExtensionStatus;
  installPath: string;
  installedAt: Date;
  enabledAt?: Date;
  error?: string;
}

export interface InstallResult {
  success: boolean;
  extensionId?: string;
  error?: string;
}

export interface ExtensionHealth {
  status: 'healthy' | 'unhealthy';
  issues: string[];
  timestamp: number;
}

/**
 * Cloud Resource Types
 */
export interface ResourceReference {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  checksum: {
    algorithm: string;
    value: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    license?: string;
  };
  variants?: {
    thumbnail?: string;
    preview?: string;
  };
}

export interface ResourceDimensions {
  width: number;
  height: number;
}

export interface ImageResource extends ResourceReference {
  type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';
  dimensions?: ResourceDimensions;
}

export interface VideoResource extends ResourceReference {
  type: 'video/mp4' | 'video/webm';
  dimensions?: ResourceDimensions;
  duration?: number;
}

export interface AudioResource extends ResourceReference {
  type: 'audio/mpeg' | 'audio/wav' | 'audio/ogg';
  duration?: number;
}

export interface FontResource extends ResourceReference {
  type: 'font/woff2' | 'font/woff' | 'font/ttf';
  fontFamily?: string;
  fontWeight?: string;
}

export interface Pagination {
  total: number;
  page: number;
  perPage: number;
  nextPage?: string;
}

export interface CloudResourceManifest {
  version: string;
  baseUrl: string;
  resources: ResourceReference[];
  pagination?: Pagination;
  integrity: {
    checksum: string;
    timestamp: string;
  };
}

/**
 * Template Types
 */
export interface LessonTemplate {
  id: string;
  metadata: {
    name: string;
    description: string;
    category?: string;
    tags?: string[];
    targetAudience?: string[];
  };
  pages: TemplatePage[];
  resources: ResourceReference[];
}

export interface TemplatePage {
  id: string;
  pageNumber: number;
  title?: string;
  backgroundColor?: string;
  objects: TemplateObject[];
}

export type TemplateObjectType = 
  | 'text' 
  | 'image' 
  | 'shape' 
  | 'stroke' 
  | 'video' 
  | 'audio';

export interface TemplateObject {
  id: string;
  type: TemplateObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  properties: Record<string, unknown>;
}

/**
 * Theme Types
 */
export interface Theme {
  id: string;
  name: string;
  description?: string;
  colors: ColorPalette;
  typography?: Typography;
  spacing?: Record<string, number>;
}

export interface ColorPalette {
  background: string;
  foreground: string;
  primary: string;
  secondary?: string;
  accent?: string;
  muted?: string;
  destructive?: string;
  border?: string;
  [key: string]: string | undefined;
}

export interface Typography {
  fontFamily: string;
  fontSize: Record<string, number>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number>;
}

/**
 * Tool Plugin Types
 */
export interface ToolContext {
  canvas: unknown; // Canvas API reference
  document: unknown; // Document API reference
  selection: unknown; // Selection API reference
}

export interface ToolDefinition {
  icon: string;
  name: string;
  description?: string;
  category: string;
  activate: (context: ToolContext) => void;
  deactivate?: (context: ToolContext) => void;
}

/**
 * Integration Plugin Types
 */
export interface IntegrationAdapter {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sync: (data: unknown) => Promise<void>;
  export: (data: unknown) => Promise<void>;
  import: () => Promise<unknown>;
}

export interface IntegrationConfig {
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  oauth?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}
