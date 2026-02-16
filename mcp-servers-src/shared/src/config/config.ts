/**
 * Configuration Management for BetterCallClaude
 * Handles environment-specific configuration with validation
 */

import Joi from 'joi';

export type Environment = 'development' | 'staging' | 'production' | 'test';
export type DatabaseType = 'postgres' | 'sqlite';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'json' | 'text';

export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  poolSize: number;
  ssl?: boolean;
}

export interface APIConfig {
  baseUrl: string;
  apiKey?: string;
  rateLimit: number;
  timeout: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache entries
}

export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  file?: string;
}

export interface AppConfig {
  environment: Environment;
  database: DatabaseConfig;
  apis: {
    bundesgericht: APIConfig;
    cantons: Record<string, APIConfig>;
    entscheidsuche: APIConfig;
  };
  cache: CacheConfig;
  logging: LoggingConfig;
}

/**
 * Configuration schema for validation
 */
const configSchema = Joi.object<AppConfig>({
  environment: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .required(),

  database: Joi.object({
    type: Joi.string().valid('postgres', 'sqlite').required(),
    host: Joi.string().when('type', {
      is: 'postgres',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    port: Joi.number().when('type', {
      is: 'postgres',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    database: Joi.string().required(),
    username: Joi.string().when('type', {
      is: 'postgres',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    password: Joi.string().when('type', {
      is: 'postgres',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    poolSize: Joi.number().integer().min(1).max(100).default(10),
    ssl: Joi.boolean().optional(),
  }).required(),

  apis: Joi.object({
    bundesgericht: Joi.object({
      baseUrl: Joi.string().uri().required(),
      apiKey: Joi.string().optional(),
      rateLimit: Joi.number().integer().min(1).max(100).default(10),
      timeout: Joi.number().integer().min(1000).max(60000).default(10000),
    }).required(),

    entscheidsuche: Joi.object({
      baseUrl: Joi.string().uri().required(),
      apiKey: Joi.string().optional(),
      rateLimit: Joi.number().integer().min(1).max(100).default(10),
      timeout: Joi.number().integer().min(1000).max(60000).default(15000),
    }).required(),

    cantons: Joi.object().pattern(
      Joi.string().length(2).uppercase(),
      Joi.object({
        baseUrl: Joi.string().uri().required(),
        apiKey: Joi.string().optional(),
        rateLimit: Joi.number().integer().min(1).max(100).default(10),
        timeout: Joi.number().integer().min(1000).max(60000).default(10000),
      })
    ).required(),
  }).required(),

  cache: Joi.object({
    ttl: Joi.number().integer().min(60).max(604800).default(86400), // 1 min to 7 days
    maxSize: Joi.number().integer().min(100).max(1000000).default(10000),
  }).required(),

  logging: Joi.object({
    level: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    format: Joi.string().valid('json', 'text').default('text'),
    file: Joi.string().optional(),
  }).required(),
});

/**
 * Load configuration from environment variables
 */
export function loadConfig(): AppConfig {
  const config: AppConfig = {
    environment: (process.env.NODE_ENV as Environment) || 'development',

    database: {
      type: (process.env.DB_TYPE as DatabaseType) || 'sqlite',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
      database: process.env.DB_DATABASE || './data/bettercallclaude.db',
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      poolSize: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE) : 10,
      ssl: process.env.DB_SSL === 'true',
    },

    apis: {
      bundesgericht: {
        baseUrl: process.env.BUNDESGERICHT_API_URL || 'https://www.bger.ch/api',
        apiKey: process.env.BUNDESGERICHT_API_KEY,
        rateLimit: process.env.BUNDESGERICHT_RATE_LIMIT
          ? parseInt(process.env.BUNDESGERICHT_RATE_LIMIT)
          : 10,
        timeout: process.env.BUNDESGERICHT_TIMEOUT
          ? parseInt(process.env.BUNDESGERICHT_TIMEOUT)
          : 10000,
      },

      entscheidsuche: {
        baseUrl: process.env.ENTSCHEIDSUCHE_API_URL || 'https://entscheidsuche.ch',
        apiKey: process.env.ENTSCHEIDSUCHE_API_KEY,
        rateLimit: process.env.ENTSCHEIDSUCHE_RATE_LIMIT
          ? parseInt(process.env.ENTSCHEIDSUCHE_RATE_LIMIT)
          : 10,
        timeout: process.env.ENTSCHEIDSUCHE_TIMEOUT
          ? parseInt(process.env.ENTSCHEIDSUCHE_TIMEOUT)
          : 15000,
      },

      cantons: {
        ZH: {
          baseUrl: process.env.ZH_API_URL || 'https://www.zh.ch/api/court-decisions',
          apiKey: process.env.ZH_API_KEY,
          rateLimit: 10,
          timeout: 10000,
        },
        BE: {
          baseUrl: process.env.BE_API_URL || 'https://www.be.ch/api/court-decisions',
          apiKey: process.env.BE_API_KEY,
          rateLimit: 10,
          timeout: 10000,
        },
        GE: {
          baseUrl: process.env.GE_API_URL || 'https://ge.ch/api/court-decisions',
          apiKey: process.env.GE_API_KEY,
          rateLimit: 10,
          timeout: 10000,
        },
        BS: {
          baseUrl: process.env.BS_API_URL || 'https://www.bs.ch/api/court-decisions',
          apiKey: process.env.BS_API_KEY,
          rateLimit: 10,
          timeout: 10000,
        },
        VD: {
          baseUrl: process.env.VD_API_URL || 'https://www.vd.ch/api/court-decisions',
          apiKey: process.env.VD_API_KEY,
          rateLimit: 10,
          timeout: 10000,
        },
        TI: {
          baseUrl: process.env.TI_API_URL || 'https://www.ti.ch/api/court-decisions',
          apiKey: process.env.TI_API_KEY,
          rateLimit: 10,
          timeout: 10000,
        },
      },
    },

    cache: {
      ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 86400, // 24 hours
      maxSize: process.env.CACHE_MAX_SIZE ? parseInt(process.env.CACHE_MAX_SIZE) : 10000,
    },

    logging: {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      format: (process.env.LOG_FORMAT as LogFormat) || 'text',
      file: process.env.LOG_FILE,
    },
  };

  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: AppConfig): void {
  const { error } = configSchema.validate(config, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }
}

/**
 * Get validated configuration singleton
 */
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
    try {
      validateConfig(configInstance);
    } catch (error) {
      console.error(`[WARN] Config validation: ${(error as Error).message}`);
    }
  }
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}
