export const PROJECT_ROLES = ['ADMIN', 'MEMBER'] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const ACTIVITY_ACTIONS = [
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_DELETED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'MEMBER_ROLE_CHANGED',
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_DELETED',
  'TASK_ASSIGNED',
  'TASK_STATUS_CHANGED',
  'COMMENT_ADDED',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ENTITY_TYPES = ['PROJECT', 'TASK', 'COMMENT', 'MEMBER'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const PASSWORD_MIN_LENGTH = 8;
export const TASK_TITLE_MAX_LENGTH = 200;
export const PROJECT_NAME_MAX_LENGTH = 100;

export const JWT_ACCESS_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '7d';
