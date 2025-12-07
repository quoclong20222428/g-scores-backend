import { Request, Response, NextFunction } from "express";
import ScoresService from "../services/Scores.service";

export class ScoresController {
  private service: ScoresService;

  constructor(service?: ScoresService) {
    this.service = service || new ScoresService();
  }

  searchScores = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { sbd } = req.params;
      const result = await this.service.searchBySBD(sbd);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { skip, take } = req.query;
      const options = {
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      };
      const result = await this.service.getAll(options);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  searchByConditions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const conditions = req.query;
      const result = await this.service.searchByConditions(conditions);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default ScoresController;