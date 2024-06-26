import { inject, injectable } from 'inversify';
import { StatusCodes } from 'http-status-codes';
import { NextFunction, Request, Response } from 'express';
import { ExceptionFilter } from './exception-filter.interface.js';
import { Logger } from '../../logger/index.js';
import { Component } from '../../../types/index.js';
import { HttpError } from '../errors/http-error.js';
import { createErrorObject } from '../../../helpers/createErrorObject.js';
import { ValidationError } from '../errors/validation-error.js';

@injectable()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(@inject(Component.Logger) private readonly logger: Logger) {
    this.logger.info('Register AppExceptionFilter');
  }

  private handleHttpError(
    error: HttpError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    this.logger.error(
      error,
      `[${error.httpStatusCode}]: ${error.message} ${error.detail}`
    );
    res.status(error.httpStatusCode).json(createErrorObject(error.message, error.detail));
  }

  private handleValidationError(
    error: ValidationError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    this.logger.error(
      error,
      `[${error.httpStatusCode}]: ${error.message} ${error.details}`
    );
    res.status(error.httpStatusCode).json(createErrorObject(error.message, error.details?.map((e) => ({property: e.property, message: Object.values(e.constraints || {})[0]}))));
  }

  private handleOtherError(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    this.logger.error(error, error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(createErrorObject(error.message, [error]));
  }

  public catch(
    error: Error | HttpError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (error instanceof HttpError) {
      return this.handleHttpError(error, req, res, next);
    }

    if (error instanceof ValidationError) {
      return this.handleValidationError(error, req, res, next);
    }

    this.handleOtherError(error, req, res, next);
  }
}
