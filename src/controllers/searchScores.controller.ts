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
}

export default ScoresController;