//backend/src/middleware/auth.ts

import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export const requireAdmin = ClerkExpressRequireAuth();
