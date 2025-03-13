import { Router } from 'express';
import { StreamingTypeRepository } from '../repositories/streamingTypeRepository';
import { GenreRepository } from '../repositories/genreRepository';
import { StreamingTypeController } from '../controllers/streamingTypeController';
import { StreamingTypeService } from '../services/streamingTypeService';
import { paginationSchema } from '../validators';
import { validate } from '../middleware/validationMiddleware';
import { validateObjectId } from '../middleware/objectIdValidationMiddleware';
import { streamingTypeAddGenreSchema, streamingTypeByNameParamSchema, streamingTypeCreateSchema, streamingTypeUpdateSchema } from '../validators/streamingTypeSchema';
const router = Router();
const repository = new StreamingTypeRepository();
const genreRepository = new GenreRepository();
const service = new StreamingTypeService(repository, genreRepository);
const controller = new StreamingTypeController(service);
/**
 * @swagger
 * tags:
 *   name: StreamingTypes
 *   description: Streaming types management
 */

/**
 * @swagger
 * /streamingTypes:
 *   get:
 *     summary: Retrieve a list of streaming types
 *     tags: [StreamingTypes]
 *     responses:
 *       200:
 *         description: A list of streaming types
 */
router.get('/', validate(paginationSchema), controller.getStreamingTypes);

/**
 * @swagger
 * /streamingTypes/change-cover:
 *   post:
 *     summary: Change the cover of the genres
 *     tags: [StreamingTypes]
 *     responses:
 *       200:
 *         description: Cover changed successfully
 *       401:
 *         description: Invalid TMDB_Bearer_Token
 *       500:
 *         description: Error changing cover
 */
router.get('/change-cover', controller.changeCover);

/**
 * @swagger
 * /streamingTypes/{id}:
 *   get:
 *     summary: Retrieve a streaming type by ID
 *     tags: [StreamingTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A streaming type object
 *       404:
 *         description: Streaming type not found
 */
router.get('/:id', validateObjectId('params'),controller.getStreamingTypeById);

/**
 * @swagger
 * /streamingTypes/name/{name}:
 *   get:
 *     summary: Retrieve a streaming type by name
 *     tags: [StreamingTypes]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A streaming type object
 *       404:
 *         description: Streaming type not found
 */
router.get('/name/:name', validate(streamingTypeByNameParamSchema, 'params'), controller.getStreamingTypeByName);

/**
 * @swagger
 * /streamingTypes:
 *   post:
 *     summary: Create a new streaming type
 *     tags: [StreamingTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               categories:
 *                 type: string
 *     responses:
 *       201:
 *         description: Streaming type created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(streamingTypeCreateSchema), controller.createStreamingType);

/**
 * @swagger
 * /streamingTypes/{id}:
 *   put:
 *     summary: Update a streaming type by ID
 *     tags: [StreamingTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               categories:
 *                 type: string
 *     responses:
 *       200:
 *         description: Streaming type updated successfully
 *       404:
 *         description: Streaming type not found
 */
router.put('/:id', 
  validateObjectId('params'),
  validate(streamingTypeUpdateSchema), 
  controller.updateStreamingType);

/**
 * @swagger
 * /streamingTypes/add-genre/{id}:
 *   put:
 *     summary: Add a genre to a streaming type by ID
 *     tags: [StreamingTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               categories:
 *                 type: string
 *     responses:
 *       200:
 *         description: Streaming type updated successfully
 *       404:
 *         description: Streaming type not found
 */
router.put('/add-genre/:id', 
  validateObjectId('params'),
  validate(streamingTypeAddGenreSchema), 
  controller.addGenreToStreamingType);

/**
 * @swagger
 * /streamingTypes/delete-genre/{id}:
 *   delete:
 *     summary: Delete a genre from a streaming type by name
 *     tags: [StreamingTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Streaming type deleted successfully
 *       404:
 *         description: Streaming type not found
 */
router.delete('/delete-genre/:id', 
  validateObjectId('params'),
  controller.deleteGenreFromStreamingTypeByName);

/**
 * @swagger
 * /streamingTypes/{id}:
 *   delete:
 *     summary: Delete a streaming type by ID
 *     tags: [StreamingTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Streaming type deleted successfully
 *       404:
 *         description: Streaming type not found
 */
router.delete('/:id', 
  validateObjectId('params'),
  controller.deleteStreamingType);

export default router;
