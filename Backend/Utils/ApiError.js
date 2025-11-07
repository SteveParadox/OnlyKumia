
export default class ApiError extends Error {
    constructor(name, httpCode, description, isOperational) {
        super(description);

        this.name = name;
        this.httpCode = httpCode;
        this.description = description;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, ApiError);
    }
}

