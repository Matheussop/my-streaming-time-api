import { Request, Response } from 'express';
import StreamingTypes from '../models/streamingTypesModel';

export const getStreamingTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const streamingTypes = await StreamingTypes.find();
    res.status(200).json(streamingTypes);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getStreamingTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const streamingType = await StreamingTypes.findById(req.params.id);
    if (!streamingType) {
      res.status(404).json({ message: 'Streaming Type not found' });
      return;
    }
    res.status(200).json(streamingType);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createStreamingType = async (req: Request, res: Response): Promise<void> => {
  const streamingType = new StreamingTypes({
    name: req.body.name,
    categories: req.body.categories,
  });

  try {
    const newStreamingType = await streamingType.save();
    res.status(201).json(newStreamingType);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateStreamingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const streamingType = await StreamingTypes.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!streamingType) {
      res.status(404).json({ message: 'Streaming Type not found' });
      return;
    }
    res.status(200).json(streamingType);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteStreamingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const streamingType = await StreamingTypes.findByIdAndDelete(req.params.id);
    if (!streamingType) {
      res.status(404).json({ message: 'Streaming Type not found' });
      return;
    }
    res.status(200).json({ message: 'Streaming Type deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCategoriesOfStreamingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const oldStreamingType = await StreamingTypes.findById(req.params.id)
    if (!oldStreamingType) {
      res.status(404).json({ message: 'Streaming Type not found' });
      return;
    }
    const newStreamingType = oldStreamingType?.categories.concat(req.body.newCategory);
    
    const streamingType = await StreamingTypes.findByIdAndUpdate(oldStreamingType._id, newStreamingType, { new: true });
    if (!streamingType) {
      res.status(404).json({ message: 'Streaming Type not found' });
      return;
    }
    res.status(200).json(streamingType);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

