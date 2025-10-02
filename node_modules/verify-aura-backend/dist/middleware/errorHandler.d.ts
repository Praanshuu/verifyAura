import { NextFunction, Request, Response } from 'express';
export declare function notFoundHandler(req: Request, res: Response): void;
export declare function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void;
export declare function rateLimitErrorHandler(err: any, _req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=errorHandler.d.ts.map