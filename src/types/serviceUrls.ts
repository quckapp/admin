export type Environment = 'local' | 'development' | 'qa' | 'uat1' | 'uat2' | 'uat3' | 'staging' | 'production';
export type ServiceCategory = 'SPRING' | 'NESTJS' | 'ELIXIR' | 'GO' | 'PYTHON';

export const ENVIRONMENTS: Environment[] = [
  'local', 'development', 'qa', 'uat1', 'uat2', 'uat3', 'staging', 'production',
];

export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  local: 'Local',
  development: 'Development',
  qa: 'QA',
  uat1: 'UAT 1',
  uat2: 'UAT 2',
  uat3: 'UAT 3',
  staging: 'Staging',
  production: 'Production',
};

export const ENVIRONMENT_COLORS: Record<Environment, string> = {
  local: 'gray',
  development: 'blue',
  qa: 'purple',
  uat1: 'orange',
  uat2: 'orange',
  uat3: 'orange',
  staging: 'yellow',
  production: 'red',
};

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  SPRING: 'Spring Boot',
  NESTJS: 'NestJS',
  ELIXIR: 'Elixir',
  GO: 'Go',
  PYTHON: 'Python',
};

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  SPRING: 'green',
  NESTJS: 'red',
  ELIXIR: 'purple',
  GO: 'blue',
  PYTHON: 'yellow',
};

export interface ServiceUrlConfig {
  id: string;
  environment: Environment;
  serviceKey: string;
  category: ServiceCategory;
  url: string;
  description: string;
  isActive: boolean;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InfrastructureConfig {
  id: string;
  environment: Environment;
  infraKey: string;
  host: string;
  port: number;
  username?: string;
  connectionString?: string;
  isActive: boolean;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseConfig {
  id: string;
  environment: Environment;
  projectId: string;
  clientEmail: string;
  privateKeyMasked: string;
  storageBucket: string;
  isActive: boolean;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentSummary {
  environment: Environment;
  serviceCount: number;
  infraCount: number;
  hasFirebase: boolean;
  lastUpdated: string | null;
}

export interface BulkExportResponse {
  environment: string;
  services: ServiceUrlConfig[];
  infrastructure: InfrastructureConfig[];
  firebase: FirebaseConfig | null;
  exportedAt: string;
}
