import { PrismaClient, TaskStatus, TaskPriority, ActivityAction, EntityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Demo1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash,
      name: 'Alex Admin',
      avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=admin',
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: 'member1@demo.com' },
    update: {},
    create: {
      email: 'member1@demo.com',
      passwordHash,
      name: 'Morgan Member',
      avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=member1',
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'member2@demo.com' },
    update: {},
    create: {
      email: 'member2@demo.com',
      passwordHash,
      name: 'Jordan Developer',
      avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=member2',
    },
  });

  console.log('Created demo users');

  const project1 = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'TaskFlow Development',
      description: 'Building the next-generation project management platform with modern technologies.',
      ownerId: admin.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Marketing Website',
      description: 'Company marketing site redesign with focus on conversion optimization.',
      ownerId: admin.id,
    },
  });

  console.log('Created demo projects');

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: admin.id } },
    update: {},
    create: { projectId: project1.id, userId: admin.id, role: 'ADMIN' },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: member1.id } },
    update: {},
    create: { projectId: project1.id, userId: member1.id, role: 'MEMBER' },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: member2.id } },
    update: {},
    create: { projectId: project1.id, userId: member2.id, role: 'MEMBER' },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: admin.id } },
    update: {},
    create: { projectId: project2.id, userId: admin.id, role: 'ADMIN' },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: member1.id } },
    update: {},
    create: { projectId: project2.id, userId: member1.id, role: 'ADMIN' },
  });

  console.log('Created project memberships');

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Check if tasks already exist (idempotent check)
  const existingTasks = await prisma.task.count({ where: { projectId: project1.id } });

  if (existingTasks === 0) {
    const tasks = [
      { title: 'Set up Prisma schema', description: 'Define database models with relations', status: 'DONE' as TaskStatus, priority: 'HIGH' as TaskPriority, projectId: project1.id, assigneeId: admin.id, createdById: admin.id, dueDate: twoDaysAgo, completedAt: yesterday },
      { title: 'Implement JWT authentication', description: 'Access + refresh token flow with bcrypt', status: 'DONE' as TaskStatus, priority: 'URGENT' as TaskPriority, projectId: project1.id, assigneeId: admin.id, createdById: admin.id, dueDate: yesterday, completedAt: now },
      { title: 'Build RBAC middleware', description: 'Role-based access control for project members', status: 'IN_REVIEW' as TaskStatus, priority: 'HIGH' as TaskPriority, projectId: project1.id, assigneeId: member1.id, createdById: admin.id, dueDate: threeDaysFromNow },
      { title: 'Create REST API endpoints', description: 'CRUD for projects, tasks, comments', status: 'IN_PROGRESS' as TaskStatus, priority: 'HIGH' as TaskPriority, projectId: project1.id, assigneeId: member2.id, createdById: admin.id, dueDate: fiveDaysFromNow },
      { title: 'Set up React + Vite frontend', description: 'TypeScript, TailwindCSS, shadcn/ui', status: 'IN_PROGRESS' as TaskStatus, priority: 'MEDIUM' as TaskPriority, projectId: project1.id, assigneeId: member1.id, createdById: admin.id, dueDate: fiveDaysFromNow },
      { title: 'Implement Kanban board', description: 'Drag-and-drop with @dnd-kit', status: 'TODO' as TaskStatus, priority: 'HIGH' as TaskPriority, projectId: project1.id, assigneeId: member2.id, createdById: admin.id, dueDate: weekFromNow },
      { title: 'Add dark mode toggle', description: 'Persist preference in localStorage', status: 'TODO' as TaskStatus, priority: 'LOW' as TaskPriority, projectId: project1.id, assigneeId: null, createdById: member1.id, dueDate: null },
      { title: 'Write API documentation', description: 'Swagger/OpenAPI spec', status: 'TODO' as TaskStatus, priority: 'MEDIUM' as TaskPriority, projectId: project1.id, assigneeId: member1.id, createdById: admin.id, dueDate: weekFromNow },
      { title: 'Deploy to Railway', description: 'Configure services and environment variables', status: 'TODO' as TaskStatus, priority: 'URGENT' as TaskPriority, projectId: project1.id, assigneeId: admin.id, createdById: admin.id, dueDate: fiveDaysFromNow },
      { title: 'Fix login page styling', description: 'Button alignment issue on mobile', status: 'IN_PROGRESS' as TaskStatus, priority: 'LOW' as TaskPriority, projectId: project1.id, assigneeId: member2.id, createdById: member2.id, dueDate: threeDaysFromNow },
      { title: 'OVERDUE: Database backup script', description: 'Automated daily backups to S3', status: 'TODO' as TaskStatus, priority: 'URGENT' as TaskPriority, projectId: project1.id, assigneeId: admin.id, createdById: admin.id, dueDate: twoDaysAgo },
      { title: 'Redesign homepage hero', description: 'New gradient and CTA buttons', status: 'DONE' as TaskStatus, priority: 'HIGH' as TaskPriority, projectId: project2.id, assigneeId: member1.id, createdById: admin.id, dueDate: yesterday, completedAt: twoDaysAgo },
      { title: 'Add testimonials section', description: 'Carousel with customer quotes', status: 'IN_PROGRESS' as TaskStatus, priority: 'MEDIUM' as TaskPriority, projectId: project2.id, assigneeId: member1.id, createdById: admin.id, dueDate: fiveDaysFromNow },
      { title: 'Optimize images', description: 'WebP conversion and lazy loading', status: 'TODO' as TaskStatus, priority: 'LOW' as TaskPriority, projectId: project2.id, assigneeId: null, createdById: member1.id, dueDate: weekFromNow },
      { title: 'OVERDUE: SEO audit', description: 'Meta tags, sitemap, robots.txt', status: 'IN_REVIEW' as TaskStatus, priority: 'HIGH' as TaskPriority, projectId: project2.id, assigneeId: admin.id, createdById: admin.id, dueDate: twoDaysAgo },
      { title: 'A/B test pricing page', description: 'Two variants with different layouts', status: 'TODO' as TaskStatus, priority: 'MEDIUM' as TaskPriority, projectId: project2.id, assigneeId: member1.id, createdById: admin.id, dueDate: weekFromNow },
    ];

    for (const task of tasks) {
      await prisma.task.create({ data: task });
    }
    console.log('Created demo tasks');

    const createdTasks = await prisma.task.findMany({ where: { projectId: project1.id }, take: 5 });

    const comments = [
      { taskId: createdTasks[2]?.id, authorId: admin.id, body: 'Looking good! Just need to add tests for edge cases.' },
      { taskId: createdTasks[2]?.id, authorId: member1.id, body: 'Added unit tests for all role combinations. Ready for final review.' },
      { taskId: createdTasks[3]?.id, authorId: member2.id, body: 'Started on the projects endpoints. Tasks coming next.' },
      { taskId: createdTasks[4]?.id, authorId: member1.id, body: 'shadcn/ui components are set up. Working on routing now.' },
      { taskId: createdTasks[4]?.id, authorId: admin.id, body: 'Great progress! Make sure to use TanStack Query for data fetching.' },
    ];

    for (const comment of comments) {
      if (comment.taskId) {
        await prisma.comment.create({ data: comment });
      }
    }
    console.log('Created demo comments');

    const activities: Array<{
      projectId: string;
      actorId: string;
      action: ActivityAction;
      entityType: EntityType;
      entityId: string;
      metadata: Record<string, unknown>;
    }> = [
      { projectId: project1.id, actorId: admin.id, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project1.id, metadata: { name: project1.name } },
      { projectId: project1.id, actorId: admin.id, action: 'MEMBER_ADDED', entityType: 'MEMBER', entityId: member1.id, metadata: { email: member1.email, role: 'MEMBER' } },
      { projectId: project1.id, actorId: admin.id, action: 'MEMBER_ADDED', entityType: 'MEMBER', entityId: member2.id, metadata: { email: member2.email, role: 'MEMBER' } },
      { projectId: project1.id, actorId: admin.id, action: 'TASK_CREATED', entityType: 'TASK', entityId: createdTasks[0]?.id ?? '', metadata: { title: 'Set up Prisma schema' } },
      { projectId: project1.id, actorId: admin.id, action: 'TASK_STATUS_CHANGED', entityType: 'TASK', entityId: createdTasks[0]?.id ?? '', metadata: { previousStatus: 'TODO', newStatus: 'DONE' } },
      { projectId: project1.id, actorId: member1.id, action: 'TASK_STATUS_CHANGED', entityType: 'TASK', entityId: createdTasks[2]?.id ?? '', metadata: { previousStatus: 'IN_PROGRESS', newStatus: 'IN_REVIEW' } },
      { projectId: project1.id, actorId: admin.id, action: 'COMMENT_ADDED', entityType: 'COMMENT', entityId: createdTasks[2]?.id ?? '', metadata: { taskTitle: 'Build RBAC middleware' } },
      { projectId: project2.id, actorId: admin.id, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project2.id, metadata: { name: project2.name } },
      { projectId: project2.id, actorId: admin.id, action: 'MEMBER_ROLE_CHANGED', entityType: 'MEMBER', entityId: member1.id, metadata: { previousRole: 'MEMBER', role: 'ADMIN' } },
    ];

    for (const activity of activities) {
      if (activity.entityId) {
        await prisma.activityLog.create({ data: activity });
      }
    }
    console.log('Created activity logs');
  } else {
    console.log('Seed data already exists, skipping tasks/comments/activities');
  }
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
