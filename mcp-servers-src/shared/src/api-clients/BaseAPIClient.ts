/**
 * Base API Client
 * Foundation for all court decision API clients with rate limiting and retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Bottleneck from 'bottleneck';
import pRetry, { Options as PRetryOptions } from 'p-retry';
import { APIConfig } from '../config/config';
import { Logger } from '../logging/logger';
import {
  APIError,
  APIRateLimitError,
  APITimeoutError,
  APIAuthenticationError,
  APINotFoundError,
} from '../errors/errors';

export interface APIClientOptions {
  config: APIConfig;
  logger: Logger;
  serviceName: string;
}

export abstract class BaseAPIClient {
  protected axios: AxiosInstance;
  protected limiter: Bottleneck;
  protected logger: Logger;
  protected serviceName: string;
  protected config: APIConfig;

  constructor(options: APIClientOptions) {
    this.serviceName = options.serviceName;
    this.config = options.config;
    this.logger = options.logger.child({ service: this.serviceName });

    // Create axios instance
    this.axios = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'BetterCallClaude/2.0',
        ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}),
      },
    });

    // Create rate limiter
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: Math.floor(60000 / this.config.rateLimit), // Convert rate/min to ms between requests
    });

    // Add request interceptor for logging
    this.axios.interceptors.request.use(
      (config) => {
        this.logger.debug('API request', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        this.logger.error('API request error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug('API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        this.handleAxiosError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make HTTP request with rate limiting and retry logic
   */
  protected async request<T>(
    config: AxiosRequestConfig,
    retryOptions?: PRetryOptions
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const response = await pRetry(
        async () => {
          return await this.limiter.schedule(() => this.axios.request<T>(config));
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 1000,
          maxTimeout: 10000,
          onFailedAttempt: (error) => {
            this.logger.warn('API request retry', {
              attempt: error.attemptNumber,
              retriesLeft: error.retriesLeft,
              error: error.message,
            });
          },
          ...retryOptions,
        }
      );

      const duration = Date.now() - startTime;

      this.logger.info('API request successful', {
        method: config.method,
        url: config.url,
        statusCode: response.status,
        duration,
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('API request failed', error as Error, {
        method: config.method,
        url: config.url,
        duration,
      });

      throw error;
    }
  }

  /**
   * GET request
   */
  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config,
    });
  }

  /**
   * POST request
   */
  protected async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * PUT request
   */
  protected async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  /**
   * Handle axios errors and convert to custom errors
   */
  private handleAxiosError(error: unknown): void {
    // Type guard for axios errors
    const axiosError = error as { config?: { url?: string }; response?: { status: number; headers: Record<string, string>; data?: { message?: string } }; request?: unknown; message?: string };
    const endpoint = axiosError.config?.url || 'unknown';

    if (axiosError.response) {
      // Server responded with error status
      const status = axiosError.response.status;

      if (status === 429) {
        const retryAfter = axiosError.response.headers['retry-after'];
        throw new APIRateLimitError(
          this.serviceName,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      if (status === 401 || status === 403) {
        throw new APIAuthenticationError(this.serviceName);
      }

      if (status === 404) {
        throw new APINotFoundError(this.serviceName, endpoint);
      }

      throw new APIError(
        axiosError.response.data?.message || axiosError.message || 'Unknown error',
        this.serviceName,
        endpoint,
        status
      );
    } else if (axiosError.request) {
      // Request made but no response
      const errorWithCode = axiosError as { code?: string; message?: string };
      if (errorWithCode.code === 'ECONNABORTED') {
        throw new APITimeoutError(this.serviceName, endpoint);
      }

      throw new APIError(
        `No response from ${this.serviceName}: ${axiosError.message || 'Unknown error'}`,
        this.serviceName,
        endpoint,
        503
      );
    } else {
      // Error setting up request
      throw new APIError(
        `Request setup error: ${axiosError.message || 'Unknown error'}`,
        this.serviceName,
        endpoint,
        500
      );
    }
  }

  /**
   * Get current rate limiter status
   */
  public getRateLimiterStatus(): {
    running: number;
    queued: number;
  } {
    return {
      running: this.limiter.counts().RUNNING,
      queued: this.limiter.counts().QUEUED,
    };
  }

  /**
   * Clear rate limiter queue
   */
  public clearQueue(): void {
    this.limiter.stop({ dropWaitingJobs: true });
  }
}
