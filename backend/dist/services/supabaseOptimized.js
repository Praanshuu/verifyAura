"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabasePool = exports.supabase = void 0;
exports.cachedQuery = cachedQuery;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class SupabaseConnectionPool {
    constructor(config) {
        this.clients = [];
        this.availableClients = [];
        this.waitingQueue = [];
        this.config = config;
        this.initializePool();
    }
    initializePool() {
        for (let i = 0; i < this.config.maxConnections; i++) {
            const client = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
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
            });
            this.clients.push(client);
            this.availableClients.push(client);
        }
    }
    async getClient() {
        if (this.availableClients.length > 0) {
            return this.availableClients.pop();
        }
        return new Promise((resolve) => {
            this.waitingQueue.push(resolve);
            setTimeout(() => {
                const index = this.waitingQueue.indexOf(resolve);
                if (index !== -1) {
                    this.waitingQueue.splice(index, 1);
                    const tempClient = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
                    resolve(tempClient);
                }
            }, this.config.connectionTimeout);
        });
    }
    releaseClient(client) {
        if (this.waitingQueue.length > 0) {
            const resolve = this.waitingQueue.shift();
            resolve?.(client);
        }
        else {
            if (this.clients.includes(client)) {
                this.availableClients.push(client);
            }
        }
    }
    async executeWithRetry(operation) {
        let lastError;
        for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
            const client = await this.getClient();
            try {
                const result = await operation(client);
                this.releaseClient(client);
                return result;
            }
            catch (error) {
                lastError = error;
                this.releaseClient(client);
                if (error.status && error.status >= 400 && error.status < 500) {
                    throw error;
                }
                if (attempt < this.config.retryAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt)));
                }
            }
        }
        throw lastError;
    }
}
const pool = new SupabaseConnectionPool({
    maxConnections: 10,
    connectionTimeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000
});
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
});
exports.supabasePool = pool;
const queryCache = new Map();
const QUERY_CACHE_TTL = 60 * 1000;
async function cachedQuery(key, queryFn, ttl = QUERY_CACHE_TTL) {
    const cached = queryCache.get(key);
    const now = Date.now();
    if (cached && now - cached.timestamp < ttl) {
        return cached.data;
    }
    const result = await pool.executeWithRetry(queryFn);
    queryCache.set(key, { data: result, timestamp: now });
    if (queryCache.size > 100) {
        for (const [k, v] of queryCache.entries()) {
            if (now - v.timestamp > ttl * 2) {
                queryCache.delete(k);
            }
        }
    }
    return result;
}
//# sourceMappingURL=supabaseOptimized.js.map