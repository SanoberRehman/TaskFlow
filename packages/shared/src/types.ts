import type { z } from 'zod';
import type {
  signupSchema,
  loginSchema,
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  createCommentSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './schemas.js';
import type { ProjectRole, TaskStatus, TaskPriority, ActivityAction, EntityType } from './constants.js';

// Infer types from Zod schemas
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// API Response Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithDetails extends Project {
  owner: User;
  members: ProjectMember[];
  taskCounts: TaskCounts;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
}

export interface TaskCounts {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  createdById: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithDetails extends Task {
  assignee: User | null;
  createdBy: User;
  project: Pick<Project, 'id' | 'name'>;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: User;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  actorId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: User;
}

export interface Dashboard {
  myOpenTasks: TaskWithDetails[];
  myOverdueTasks: TaskWithDetails[];
  tasksByStatus: TaskCounts;
  recentActivity: ActivityLog[];
  upcomingDeadlines: TaskWithDetails[];
  projectCount: number;
  completedThisWeek: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface ApiSuccess<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
