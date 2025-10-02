import { SupabaseClient } from '@supabase/supabase-js';
interface SupabasePoolConfig {
    maxConnections: number;
    connectionTimeout: number;
    retryAttempts: number;
    retryDelay: number;
}
declare class SupabaseConnectionPool {
    private clients;
    private availableClients;
    private config;
    private waitingQueue;
    constructor(config: SupabasePoolConfig);
    private initializePool;
    getClient(): Promise<SupabaseClient>;
    releaseClient(client: SupabaseClient): void;
    executeWithRetry<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T>;
}
export declare const supabase: SupabaseClient<any, "public", "public", any, any>;
export declare const supabasePool: SupabaseConnectionPool;
export declare function cachedQuery<T>(key: string, queryFn: (client: SupabaseClient) => Promise<T>, ttl?: number): Promise<T>;
export {};
//# sourceMappingURL=supabaseOptimized.d.ts.map