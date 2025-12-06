export class HttpError extends Error {
	statusCode: number;
	details?: unknown;

	constructor(statusCode: number, message: string, details?: unknown) {
		super(message);
		this.name = "HttpError";
		this.statusCode = statusCode;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class NotFoundError extends HttpError {
	constructor(message: string = "Không tìm thấy tài nguyên") {
		super(404, message);
		this.name = "NotFoundError";
	}
}

export class ValidationError extends HttpError {
	constructor(message: string = "Dữ liệu không hợp lệ") {
		super(400, message);
		this.name = "ValidationError";
	}
}

export class DatabaseError extends HttpError {
	constructor(message: string = "Lỗi cơ sở dữ liệu") {
		super(500, message);
		this.name = "DatabaseError";
	}
}