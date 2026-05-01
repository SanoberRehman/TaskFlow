import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../lib/errors';
import { ProjectRole, ProjectMember, Project } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      projectMember?: ProjectMember & { project: Project };
      project?: Project;
    }
  }
}

export function requireProjectRole(allowedRoles: ProjectRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const projectId = req.params.projectId || req.params.id;
      if (!projectId) {
        throw new ForbiddenError('Project ID is required');
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
        include: {
          project: true,
        },
      });

      if (!membership) {
        const projectExists = await prisma.project.findUnique({
          where: { id: projectId },
        });
        if (!projectExists) {
          throw new NotFoundError('Project');
        }
        throw new ForbiddenError('You are not a member of this project');
      }

      if (!allowedRoles.includes(membership.role)) {
        throw new ForbiddenError(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      req.projectMember = membership;
      req.project = membership.project;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireProjectMember() {
  return requireProjectRole(['ADMIN', 'MEMBER']);
}

export function requireProjectAdmin() {
  return requireProjectRole(['ADMIN']);
}
