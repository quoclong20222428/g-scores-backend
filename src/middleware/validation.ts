import { Request, Response, NextFunction } from "express";

export const validateSbd = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sbd } = req.params;

  if (!sbd) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  // Validate format - student ID must be 8 digits
  const sbdRegex = /^\d{8}$/;
  if (!sbdRegex.test(sbd)) {
    return res.status(400).json({
      success: false,
      message: "Invalid student ID. Student ID must be 8 digits",
    });
  }

  next();
};

export const validateSearchQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page, limit } = req.query;

  if (page && isNaN(Number(page))) {
    return res.status(400).json({
      success: false,
      message: "Page parameter must be a number",
    });
  }

  if (limit && isNaN(Number(limit))) {
    return res.status(400).json({
      success: false,
      message: "Limit parameter must be a number",
    });
  }

  next();
};
