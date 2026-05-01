import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import type { CreateTaskInput, UpdateTaskInput, TaskQueryInput, CreateCommentInput } from '@taskflow/shared';

const userSelect = { id: true, email: true, name: true, avatarUrl: true, createdAt: true };

async function checkTaskAccess(taskId: string, userId: string, requireWrite = false) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task) {
    throw new NotFoundError('Task');
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: task.projectId, userId },
    },
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this project');
  }

  if (requireWrite) {
    const isAdmin = membership.role === 'ADMIN';
    const isCreator = task.createdById === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isAdmin && !isCreator && !isAssignee) {
      throw new ForbiddenError('You can only edit tasks you created or are assigned to');
    }
  }

  return { task, membership };
}

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const { status, assigneeId, priority, search, dueBefore, page, limit } = req.query as unknown as TaskQueryInput;

    const where: Prisma.TaskWhereInput = {
      projectId,
      ...(status && { status }),
      ...(assigneeId && { assigneeId }),
      ...(priority && { priority }),
      ...(dueBefore && { dueDate: { lte: new Date(dueBefore) } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: userSelect },
          createdBy: { select: userSelect },
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const body = req.body as CreateTaskInput;

    if (body.assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: body.assigneeId },
        },
      });
      if (!assigneeMember) {
        throw new ForbiddenError('Assignee must be a member of this project');
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          projectId,
          title: body.title,
          description: body.description,
          status: body.status || 'TODO',
          priority: body.priority || 'MEDIUM',
          assigneeId: body.assigneeId,
          createdById: req.user!.id,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
        include: {
          assignee: { select: userSelect },
          createdBy: { select: userSelect },
          project: { select: { id: true, name: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: req.user!.id,
          action: 'TASK_CREATED',
          entityType: 'TASK',
          entityId: newTask.id,
          metadata: { title: body.title, status: newTask.status, priority: newTask.priority },
        },
      });

      if (body.assigneeId && body.assigneeId !== req.user!.id) {
        await tx.activityLog.create({
          data: {
            projectId,
            actorId: req.user!.id,
            action: 'TASK_ASSIGNED',
            entityType: 'TASK',
            entityId: newTask.id,
            metadata: { taskTitle: body.title, assigneeId: body.assigneeId },
          },
        });
      }

      return newTask;
    });

    res.status(201).json({ data: task });
  } catch (error) {
    next(error);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
        project: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: task.projectId, userId: req.user!.id },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this project');
    }

    res.json({ data: task });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = req.body as UpdateTaskInput;

    const { task: existingTask, membership } = await checkTaskAccess(id, req.user!.id, false);

    const isAdmin = membership.role === 'ADMIN';
    const isCreator = existingTask.createdById === req.user!.id;
    const isAssignee = existingTask.assigneeId === req.user!.id;

    const onlyStatusChange = Object.keys(body).length === 1 && body.status !== undefined;
    if (!isAdmin && !isCreator) {
      if (isAssignee && !onlyStatusChange) {
        throw new ForbiddenError('As assignee, you can only update the task status');
      }
      if (!isAssignee) {
        throw new ForbiddenError('You can only edit tasks you created or are assigned to');
      }
    }

    if (body.assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: existingTask.projectId, userId: body.assigneeId },
        },
      });
      if (!assigneeMember) {
        throw new ForbiddenError('Assignee must be a member of this project');
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.priority !== undefined && { priority: body.priority }),
          ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
          ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
          ...(body.status === 'DONE' && !existingTask.completedAt && { completedAt: new Date() }),
          ...(body.status && body.status !== 'DONE' && existingTask.completedAt && { completedAt: null }),
        },
        include: {
          assignee: { select: userSelect },
          createdBy: { select: userSelect },
          project: { select: { id: true, name: true } },
        },
      });

      if (body.status && body.status !== existingTask.status) {
        await tx.activityLog.create({
          data: {
            projectId: existingTask.projectId,
            actorId: req.user!.id,
            action: 'TASK_STATUS_CHANGED',
            entityType: 'TASK',
            entityId: id,
            metadata: { taskTitle: updatedTask.title, previousStatus: existingTask.status, newStatus: body.status },
          },
        });
      } else {
        await tx.activityLog.create({
          data: {
            projectId: existingTask.projectId,
            actorId: req.user!.id,
            action: 'TASK_UPDATED',
            entityType: 'TASK',
            entityId: id,
            metadata: { taskTitle: updatedTask.title, changes: body },
          },
        });
      }

      if (body.assigneeId && body.assigneeId !== existingTask.assigneeId) {
        await tx.activityLog.create({
          data: {
            projectId: existingTask.projectId,
            actorId: req.user!.id,
            action: 'TASK_ASSIGNED',
            entityType: 'TASK',
            entityId: id,
            metadata: { taskTitle: updatedTask.title, assigneeId: body.assigneeId },
          },
        });
      }

      return updatedTask;
    });

    res.json({ data: task });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { task, membership } = await checkTaskAccess(id, req.user!.id, false);

    const isAdmin = membership.role === 'ADMIN';
    const isCreator = task.createdById === req.user!.id;

    if (!isAdmin && !isCreator) {
      throw new ForbiddenError('Only admins or the task creator can delete this task');
    }

    await prisma.$transaction(async (tx) => {
      await tx.activityLog.create({
        data: {
          projectId: task.projectId,
          actorId: req.user!.id,
          action: 'TASK_DELETED',
          entityType: 'TASK',
          entityId: id,
          metadata: { taskTitle: task.title },
        },
      });

      await tx.task.delete({ where: { id } });
    });

    res.json({ data: { message: 'Task deleted successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await checkTaskAccess(id, req.user!.id, false);

    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      include: { author: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: comments });
  } catch (error) {
    next(error);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { body } = req.body as CreateCommentInput;

    const { task } = await checkTaskAccess(id, req.user!.id, false);

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          taskId: id,
          authorId: req.user!.id,
          body,
        },
        include: { author: { select: userSelect } },
      });

      await tx.activityLog.create({
        data: {
          projectId: task.projectId,
          actorId: req.user!.id,
          action: 'COMMENT_ADDED',
          entityType: 'COMMENT',
          entityId: newComment.id,
          metadata: { taskId: id, taskTitle: task.title },
        },
      });

      return newComment;
    });

    res.status(201).json({ data: comment });
  } catch (error) {
    next(error);
  }
}
