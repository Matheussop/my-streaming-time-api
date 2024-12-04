import { Request, Response } from "express";
import UserStreamingHistory from "../models/userStreamingHistoryModel";

export const getUserStreamingHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userHistory = await UserStreamingHistory.findOne({ userId });

    if (!userHistory) {
      return res.status(404).json({ error: "User history not found" });
    }

    res.json(userHistory);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while retrieving user history" });
  }
};

// Adicionar um streaming ao histórico de um usuário
export const addStreamingToHistory = async (req: Request, res: Response) => {
  try {
    const { userId, streamingId, title, durationInMinutes } = req.body;

    let userHistory = await UserStreamingHistory.findOne({ userId });

    if (!userHistory) {
      userHistory = new UserStreamingHistory({
        userId,
        watchHistory: [],
      });
    }

    userHistory.watchHistory.push({ streamingId, title, durationInMinutes });

    await userHistory.save();

    res.status(201).json(userHistory);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while adding streaming to history" });
  }
};

export const calculateTotalWatchTime = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userHistory = await UserStreamingHistory.findOne({ userId });

    if (!userHistory) {
      return res.status(404).json({ error: "User history not found" });
    }

    // Apenas retorna o campo já calculado pelo hook
    res.json({ totalWatchTimeInMinutes: userHistory.totalWatchTimeInMinutes });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while calculating total watch time" });
  }
};

