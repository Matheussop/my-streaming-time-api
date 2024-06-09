import { Router } from 'express';
import { getStreamingTypes, getStreamingTypeById, createStreamingType, updateStreamingType, deleteStreamingType, updateCategoriesOfStreamingType } from '../controllers/streamingTypesControllers';


const streamingTypesRoutes: Router = Router();

streamingTypesRoutes.get('/', getStreamingTypes);
streamingTypesRoutes.get('/:id', getStreamingTypeById);
streamingTypesRoutes.post('/', createStreamingType);
streamingTypesRoutes.put('/:id', updateStreamingType);
streamingTypesRoutes.delete('/:id', deleteStreamingType);
streamingTypesRoutes.put('/:id', updateCategoriesOfStreamingType);

export default streamingTypesRoutes;
