import { Router } from 'express';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  createCommentSchema,
  projectIdParamSchema,
  taskIdParamSchema,
} from '@taskflow/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireProjectMember } from '../middleware/rbac';
import * as taskController from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/project/:projectId',
  validate({ params: projectIdParamSchema, query: taskQuerySchema }),
  requireProjectMember(),
  taskController.listTasks
);

router.post(
  '/project/:projectId',
  validate({ params: projectIdParamSchema, body: createTaskSchema }),
  requireProjectMember(),
  taskController.createTask
);

router.get('/:id', validate({ params: taskIdParamSchema }), taskController.getTask);
router.patch('/:id', validate({ params: taskIdParamSchema, body: updateTaskSchema }), taskController.updateTask);
router.delete('/:id', validate({ params: taskIdParamSchema }), taskController.deleteTask);

router.get('/:id/comments', validate({ params: taskIdParamSchema }), taskController.getComments);
router.post('/:id/comments', validate({ params: taskIdParamSchema, body: createCommentSchema }), taskController.createComment);

export default router;
