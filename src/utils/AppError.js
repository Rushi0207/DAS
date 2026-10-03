
class AppError extends Error {
  
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

module.exports = AppError;