// backend/src/services/supabaseOptimized.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Connection pool configuration
interface SupabasePoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

class SupabaseConnectionPool {
  private clients: SupabaseClient[] = [];
  private availableClients: SupabaseClient[] = [];
  private config: SupabasePoolConfig;
  private waitingQueue: Array<(client: SupabaseClient) => void> = [];

  constructor(config: SupabasePoolConfig) {
    this.config = config;
    this.initializePool();
  }

  private initializePool() {
    for (let i = 0; i < this.config.maxConnections; i++) {
      const client = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'x-connection-id': `pool-${i}`
            }
          }
        }
      );
      this.clients.push(client);
      this.availableClients.push(client);
    }
  }

  async getClient(): Promise<SupabaseClient> {
    // If there's an available client, return it immediately
    if (this.availableClients.length > 0) {
      return this.availableClients.pop()!;
    }

    // Otherwise, wait for one to become available
    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
      
      // Timeout after configured time
      setTimeout(() => {
        const index = this.waitingQueue.indexOf(resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
          // Create a temporary client if timeout
          const tempClient = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          resolve(tempClient);
        }
      }, this.config.connectionTimeout);
    });
  }

  releaseClient(client: SupabaseClient) {
    // Check if there's someone waiting for a client
    if (this.waitingQueue.length > 0) {
      const resolve = this.waitingQueue.shift();
      resolve?.(client);
    } else {
      // Return to available pool if it's one of our pooled clients
      if (this.clients.includes(client)) {
        this.availableClients.push(client);
      }
    }
  }

  async executeWithRetry<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      const client = await this.getClient();
      
      try {
        const result = await operation(client);
        this.releaseClient(client);
        return result;
      } catch (error: any) {
        lastError = error;
        this.releaseClient(client);
        
        // Don't retry on client errors (4xx)
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Wait before retrying
        if (attempt < this.config.retryAttempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }
    
    throw lastError;
  }
}

// Create connection pool
const pool = new SupabaseConnectionPool({
  maxConnections: 10,
  connectionTimeout: 5000, // 5 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second initial delay
});

// Export the main client for backward compatibility
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Export pool for optimized operations
export const supabasePool = pool;

// Helper function for optimized queries with caching
const queryCache = new Map<string, { data: any; timestamp: number }>();
const QUERY_CACHE_TTL = 60 * 1000; // 1 minute

export async function cachedQuery<T>(
  key: string,
  queryFn: (client: SupabaseClient) => Promise<T>,
  ttl: number = QUERY_CACHE_TTL
): Promise<T> {
  const cached = queryCache.get(key);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < ttl) {
    return cached.data as T;
  }
  
  const result = await pool.executeWithRetry(queryFn);
  queryCache.set(key, { data: result, timestamp: now });
  
  // Clean up old cache entries
  if (queryCache.size > 100) {
    for (const [k, v] of queryCache.entries()) {
      if (now - v.timestamp > ttl * 2) {
        queryCache.delete(k);
      }
    }
  }
  
  return result;
}
