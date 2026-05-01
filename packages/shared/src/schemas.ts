import { z } from 'zod';
import {
  PROJECT_ROLES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PASSWORD_MIN_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from './constants';

// Auth Schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  avatarUrl: z.string().url('Invalid URL').nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Project Schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(PROJECT_NAME_MAX_LENGTH, 'Project name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(PROJECT_NAME_MAX_LENGTH, 'Project name too long').optional(),
  description: z.string().max(2000, 'Description too long').nullable().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(PROJECT_ROLES).default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(PROJECT_ROLES),
});

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(TASK_TITLE_MAX_LENGTH, 'Title too long'),
  description: z.string().max(10000, 'Description too long').optional(),
  status: z.enum(TASK_STATUSES).default('TODO'),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  assigneeId: z.string().uuid('Invalid assignee ID').nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(TASK_TITLE_MAX_LENGTH, 'Title too long').optional(),
  description: z.string().max(10000, 'Description too long').nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const taskQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  search: z.string().optional(),
  dueBefore: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Comment Schemas
export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment too long'),
});

// ID Params
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
});

export const projectAndUserIdParamSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export const taskIdParamSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
});
