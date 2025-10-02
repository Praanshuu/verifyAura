import { Request, Response, NextFunction } from 'express';
export declare const requireAuthOptimized: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdminOptimized: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthOptimized: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=clerkAuthOptimized.d.ts.map