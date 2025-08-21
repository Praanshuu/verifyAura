//backend/src/middleware/clerkAuth.ts

import { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Fetch user to attach basic info
    const user = await clerkClient.users.getUser(userId);
    (req as any).auth = {
      userId,
      email: user?.emailAddresses?.[0]?.emailAddress || '',
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      next();
      return;
    }
    const user = await clerkClient.users.getUser(userId);
    (req as any).auth = {
      userId,
      email: user?.emailAddresses?.[0]?.emailAddress || '',
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
    };
    next();
  } catch (error) {
    console.warn('Optional auth failed:', error);
    next();
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return; // Remove return value
    }
    
    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata as any)?.role;
    
    if (role !== 'admin') {
      console.warn(`Forbidden access attempt by user: ${userId} (Role: ${role})`);
      res.status(403).json({ // Remove return value
        success: false, 
        message: 'Admin privileges required' 
      });
      return; // Add explicit void return
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
    res.status(500).json({ // Remove return value
      success: false, 
      message: 'Authorization check failed',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};