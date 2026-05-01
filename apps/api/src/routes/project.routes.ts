import { Router } from 'express';
import {
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  idParamSchema,
  projectAndUserIdParamSchema,
} from '@taskflow/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireProjectMember, requireProjectAdmin } from '../middleware/rbac';
import * as projectController from '../controllers/project.controller';

const router = Router();

router.use(authenticate);

router.get('/', projectController.listProjects);
router.post('/', validate({ body: createProjectSchema }), projectController.createProject);

router.get('/:id', validate({ params: idParamSchema }), requireProjectMember(), projectController.getProject);
router.patch('/:id', validate({ params: idParamSchema, body: updateProjectSchema }), requireProjectAdmin(), projectController.updateProject);
router.delete('/:id', validate({ params: idParamSchema }), requireProjectAdmin(), projectController.deleteProject);

router.post('/:id/members', validate({ params: idParamSchema, body: inviteMemberSchema }), requireProjectAdmin(), projectController.inviteMember);
router.patch('/:id/members/:userId', validate({ params: projectAndUserIdParamSchema, body: updateMemberRoleSchema }), requireProjectAdmin(), projectController.updateMemberRole);
router.delete('/:id/members/:userId', validate({ params: projectAndUserIdParamSchema }), requireProjectAdmin(), projectController.removeMember);

router.get('/:id/activity', validate({ params: idParamSchema }), requireProjectMember(), projectController.getActivity);

export default router;
