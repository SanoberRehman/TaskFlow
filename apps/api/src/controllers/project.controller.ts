import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../lib/errors';
import type { CreateProjectInput, UpdateProjectInput, InviteMemberInput, UpdateMemberRoleInput } from '@taskflow/shared';

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user!.id },
      include: {
        project: {
          include: {
            owner: {
              select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
            },
            members: {
              include: {
                user: {
                  select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
                },
              },
            },
            _count: {
              select: { tasks: true },
            },
          },
        },
      },
      orderBy: { project: { updatedAt: 'desc' } },
    });

    const projects = await Promise.all(
      memberships.map(async (membership) => {
        const taskCounts = await prisma.task.groupBy({
          by: ['status'],
          where: { projectId: membership.projectId },
          _count: true,
        });

        const counts = {
          total: membership.project._count.tasks,
          todo: taskCounts.find((t) => t.status === 'TODO')?._count ?? 0,
          inProgress: taskCounts.find((t) => t.status === 'IN_PROGRESS')?._count ?? 0,
          inReview: taskCounts.find((t) => t.status === 'IN_REVIEW')?._count ?? 0,
          done: taskCounts.find((t) => t.status === 'DONE')?._count ?? 0,
        };

        return {
          ...membership.project,
          myRole: membership.role,
          taskCounts: counts,
        };
      })
    );

    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description } = req.body as CreateProjectInput;

    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name,
          description,
          ownerId: req.user!.id,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: req.user!.id,
          role: 'ADMIN',
        },
      });

      await tx.activityLog.create({
        data: {
          projectId: newProject.id,
          actorId: req.user!.id,
          action: 'PROJECT_CREATED',
          entityType: 'PROJECT',
          entityId: newProject.id,
          metadata: { name },
        },
      });

      return newProject;
    });

    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        owner: {
          select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      data: {
        ...fullProject,
        taskCounts: { total: 0, todo: 0, inProgress: 0, inReview: 0, done: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: id },
      _count: true,
    });

    const total = taskCounts.reduce((sum, t) => sum + t._count, 0);

    res.json({
      data: {
        ...project,
        taskCounts: {
          total,
          todo: taskCounts.find((t) => t.status === 'TODO')?._count ?? 0,
          inProgress: taskCounts.find((t) => t.status === 'IN_PROGRESS')?._count ?? 0,
          inReview: taskCounts.find((t) => t.status === 'IN_REVIEW')?._count ?? 0,
          done: taskCounts.find((t) => t.status === 'DONE')?._count ?? 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, description } = req.body as UpdateProjectInput;

    const project = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
        },
        include: {
          owner: {
            select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
              },
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          projectId: id,
          actorId: req.user!.id,
          action: 'PROJECT_UPDATED',
          entityType: 'PROJECT',
          entityId: id,
          metadata: { name, description },
        },
      });

      return updated;
    });

    res.json({ data: project });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.project.delete({ where: { id } });

    res.json({ data: { message: 'Project deleted successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { email, role } = req.body as InviteMemberInput;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundError('User with this email');
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId: user.id },
      },
    });
    if (existingMember) {
      throw new ConflictError('User is already a member of this project');
    }

    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.projectMember.create({
        data: {
          projectId: id,
          userId: user.id,
          role,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          projectId: id,
          actorId: req.user!.id,
          action: 'MEMBER_ADDED',
          entityType: 'MEMBER',
          entityId: newMember.id,
          metadata: { email, role, userId: user.id, userName: user.name },
        },
      });

      return newMember;
    });

    res.status(201).json({ data: member });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, userId } = req.params;
    const { role } = req.body as UpdateMemberRoleInput;

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId },
      },
    });

    if (!membership) {
      throw new NotFoundError('Project member');
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (project?.ownerId === userId && role !== 'ADMIN') {
      throw new BadRequestError('Cannot demote the project owner');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.update({
        where: { id: membership.id },
        data: { role },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          projectId: id,
          actorId: req.user!.id,
          action: 'MEMBER_ROLE_CHANGED',
          entityType: 'MEMBER',
          entityId: membership.id,
          metadata: { userId, role, previousRole: membership.role },
        },
      });

      return member;
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, userId } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (project?.ownerId === userId) {
      throw new ForbiddenError('Cannot remove the project owner');
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('Project member');
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({
        where: { id: membership.id },
      });

      await tx.activityLog.create({
        data: {
          projectId: id,
          actorId: req.user!.id,
          action: 'MEMBER_REMOVED',
          entityType: 'MEMBER',
          entityId: membership.id,
          metadata: { userId, userName: membership.user.name },
        },
      });
    });

    res.json({ data: { message: 'Member removed successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function getActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const activity = await prisma.activityLog.findMany({
      where: { projectId: id },
      include: {
        actor: {
          select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ data: activity });
  } catch (error) {
    next(error);
  }
}
