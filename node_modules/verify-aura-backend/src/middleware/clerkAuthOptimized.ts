// backend/src/middleware/clerkAuthOptimized.ts
import { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';

// Cache user data for 5 minutes to reduce API calls
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up stale cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

async function getCachedUser(userId: string) {
  const cached = userCache.get(userId);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  
  try {
    const user = await clerkClient.users.getUser(userId);
    userCache.set(userId, { user, timestamp: now });
    return user;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    // If cached data exists but expired, return it anyway as fallback
    if (cached) {
      return cached.user;
    }
    throw error;
  }
}

export const requireAuthOptimized = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, sessionId } = getAuth(req);
    
    if (!userId || !sessionId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - No valid session found',
        code: 'NO_SESSION'
      });
      return;
    }

    // Add basic auth info without fetching user details
    (req as any).auth = {
      userId,
      sessionId
    };
    
    // Fetch user details asynchronously if needed
    process.nextTick(async () => {
      try {
        const user = await getCachedUser(userId);
        if (user) {
          (req as any).auth.email = user?.emailAddresses?.[0]?.emailAddress || '';
          (req as any).auth.firstName = user?.firstName || undefined;
          (req as any).auth.lastName = user?.lastName || undefined;
        }
      } catch (error) {
        // Log but don't block the request
        console.warn(`Failed to enrich auth data for user ${userId}:`, error);
      }
    });
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed - Invalid or expired token',
      code: 'AUTH_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const requireAdminOptimized = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Admin access required',
        code: 'NO_SESSION'
      });
      return;
    }

    // Strict RBAC via Clerk user publicMetadata
    const user = await getCachedUser(userId);
    const role = (user.publicMetadata as any)?.role;

    if (role !== 'admin') {
      console.warn(`Forbidden access attempt by user: ${userId} (Role: ${role})`);
      res.status(403).json({
        success: false, 
        message: 'Admin privileges required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    (req as any).auth = {
      userId,
      email: user?.emailAddresses?.[0]?.emailAddress || '',
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
      role,
    };

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      success: false, 
      message: 'Authorization check failed',
      code: 'AUTH_CHECK_FAILED',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

export const optionalAuthOptimized = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      next();
      return;
    }
    
    (req as any).auth = { userId };
    
    // Enrich auth data asynchronously
    process.nextTick(async () => {
      try {
        const user = await getCachedUser(userId);
        if (user) {
          (req as any).auth.email = user?.emailAddresses?.[0]?.emailAddress || '';
          (req as any).auth.firstName = user?.firstName || undefined;
          (req as any).auth.lastName = user?.lastName || undefined;
        }
      } catch (error) {
        console.warn('Optional auth enrichment failed:', error);
      }
    });
    
    next();
  } catch (error) {
    console.warn('Optional auth failed:', error);
    next();
  }
};
