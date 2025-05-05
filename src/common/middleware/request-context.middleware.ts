import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface RequestContext {
  requestId: string;
  startTime: number;
  country: string;
}

declare module 'express' {
  interface Request {
    requestContext?: RequestContext;
    log?: any; 
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const startTime = Date.now();

    req.requestContext = {
      requestId,
      startTime,
      country: (req.headers['x-country-code'] as string) || 'unknown',
    };

    req.log = req.log || console; // fallback pour dev sans nestjs-pino

    req.log.debug({
      msg: 'Requête entrante',
      requestId,
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
      country: req.requestContext.country,
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      req.log.debug({
        msg: 'Requête terminée',
        requestId,
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  }
}
