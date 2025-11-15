export default class ApiError extends Error {
  constructor(name, httpCode, description, isOperational = true, details = null) {
    super(description);

    // Identify custom error
    this.name = name || "API_ERROR";
    this.httpCode = httpCode || 500;
    this.description = description || "An unexpected error occurred";
    this.isOperational = isOperational;

    // Optional metadata
    if (details) this.details = details;

    // Clean stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      httpCode: this.httpCode,
      description: this.description,
      ...(this.details && { details: this.details })
    };
  }
}
