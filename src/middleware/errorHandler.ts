import { Request, Response, NextFunction } from "express";
import { HttpError } from "./httpError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // Xử lý custom HttpError
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Xử lý lỗi chung
  res.status(500).json({
    success: false,
    message: "Đã xảy ra lỗi từ phía server",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} không tồn tại`,
  });
};
