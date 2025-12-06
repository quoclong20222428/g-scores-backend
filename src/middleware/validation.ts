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
      message: "Số báo danh không được để trống",
    });
  }

  // Validate format số báo danh (8 chữ số)
  const sbdRegex = /^\d{8}$/;
  if (!sbdRegex.test(sbd)) {
    return res.status(400).json({
      success: false,
      message: "Số báo danh không hợp lệ. Số báo danh phải có 8 chữ số",
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
      message: "Tham số page phải là số",
    });
  }

  if (limit && isNaN(Number(limit))) {
    return res.status(400).json({
      success: false,
      message: "Tham số limit phải là số",
    });
  }

  next();
};
