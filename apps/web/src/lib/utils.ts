import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes === 0) return 'just now';
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function getDaysUntilDue(dueDate: string | null) {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'URGENT':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    case 'HIGH':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    case 'LOW':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'DONE':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'IN_REVIEW':
      return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    case 'IN_PROGRESS':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    case 'TODO':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  }
}
