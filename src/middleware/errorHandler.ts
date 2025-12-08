import { Request, Response, NextFunction } from "express";
import { HttpError } from "./httpError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // Handle custom HttpError
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Handle general errors
  res.status(500).json({
    success: false,
    message: "An error occurred on the server",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
