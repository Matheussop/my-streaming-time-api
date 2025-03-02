import { Router } from 'express';
import { StreamingTypeRepository } from '../repositories/streamingTypeRepository';
import { StreamingTypeController } from '../controllers/streamingTypeController';
import { validateRequest } from '../util/validate';
import { StreamingTypeService } from '../services/streamingTypeService';

const router = Router();
const repository = new StreamingTypeRepository();
const service = new StreamingTypeService(repository);
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
router.get('/', controller.getStreamingTypes);

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
router.get('/:id', controller.getStreamingTypeById);

/**
 * @swagger
 * /streamingTypes/category/{category}:
 *   get:
 *     summary: Retrieve a streaming type by category name
 *     tags: [StreamingTypes]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A streaming type object
 *       404:
 *         description: Streaming type not found
 */
router.get('/name/:name', controller.getStreamingTypeByName);

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
router.post('/', (req, res, next) => validateRequest(req, res, next, ['name']), controller.createStreamingType);

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
router.put('/:id', (req, res, next) => validateRequest(req, res, next, ['categories']), controller.updateStreamingType);

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
router.delete('/:id', controller.deleteStreamingType);

export default router;
