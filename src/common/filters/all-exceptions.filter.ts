import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Une erreur interne est survenue';

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request['requestContext']?.requestId,
    };

    // Log détaillé de l'erreur
    this.logger.error({
      msg: 'Erreur lors du traitement de la requête',
      error:
        exception instanceof Error
          ? {
              message: exception.message,
              name: exception.name,
              stack: exception.stack,
            }
          : exception,
      ...errorResponse,
    });

    response.status(status).json(errorResponse);
  }
}
