import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const userSelect = { id: true, email: true, name: true, avatarUrl: true, createdAt: true };

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const projectIds = await prisma.projectMember
      .findMany({
        where: { userId },
        select: { projectId: true },
      })
      .then((memberships) => memberships.map((m) => m.projectId));

    const [
      myOpenTasks,
      myOverdueTasks,
      tasksByStatus,
      recentActivity,
      upcomingDeadlines,
      completedThisWeek,
    ] = await Promise.all([
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
        },
        include: {
          assignee: { select: userSelect },
          createdBy: { select: userSelect },
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 10,
      }),

      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
        include: {
          assignee: { select: userSelect },
          createdBy: { select: userSelect },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      prisma.task
        .groupBy({
          by: ['status'],
          where: { projectId: { in: projectIds } },
          _count: true,
        })
        .then((results) => ({
          total: results.reduce((sum, r) => sum + r._count, 0),
          todo: results.find((r) => r.status === 'TODO')?._count ?? 0,
          inProgress: results.find((r) => r.status === 'IN_PROGRESS')?._count ?? 0,
          inReview: results.find((r) => r.status === 'IN_REVIEW')?._count ?? 0,
          done: results.find((r) => r.status === 'DONE')?._count ?? 0,
        })),

      prisma.activityLog.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          actor: { select: userSelect },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          status: { not: 'DONE' },
          dueDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        include: {
          assignee: { select: userSelect },
          createdBy: { select: userSelect },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          completedAt: { gte: startOfWeek },
        },
      }),
    ]);

    res.json({
      data: {
        myOpenTasks,
        myOverdueTasks,
        tasksByStatus,
        recentActivity,
        upcomingDeadlines,
        projectCount: projectIds.length,
        completedThisWeek,
      },
    });
  } catch (error) {
    next(error);
  }
}
