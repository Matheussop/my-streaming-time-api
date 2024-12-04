import { Router } from "express";
import {
  getUserStreamingHistory,
  addStreamingToHistory,
  calculateTotalWatchTime,
} from "../controllers/userStreamingHistoryController";

const userStreamingHistoryRoutes:Router = Router();

userStreamingHistoryRoutes.get("/:userId", getUserStreamingHistory);

userStreamingHistoryRoutes.post("/", addStreamingToHistory);

userStreamingHistoryRoutes.get("/:userId/total-watch-time", calculateTotalWatchTime);

export default userStreamingHistoryRoutes;
