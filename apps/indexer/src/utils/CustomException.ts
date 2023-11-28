import {
  BadRequestException,
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';


/**
 * Custom http exception that returns:
 * 1) statusCode: HTTP status code
 * 2) error
 * 3) message: debugMessage, error message, or any uncaught error message
 * 4) errorCode: custom error code
 * 5) errorMessage: custom FE-friendly error message
 */
export class CustomException extends HttpException {
  constructor(error: any, action: string) {
    super(
      HttpException.createBody({
        statusCode: error.status ?? (error.code || HttpStatus.INTERNAL_SERVER_ERROR),
        error: error.response?.error || 'Internal server error',
        message: `${action} was unsuccessful: ${
          error.response?.debugMessage || error.response?.errorMessage || error.message
        }`,
        errorCode: error.response?.errorCode,
        errorMessage: error.response?.errorMessage,
      }),
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      { cause: error },
    );
  }
}
