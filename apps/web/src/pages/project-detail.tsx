import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  MoreVertical,
  Trash2,
  UserPlus,
  Users,
  Settings,
  Loader2,
  Calendar,
  GripVertical,
} from 'lucide-react';
import { z } from 'zod';
import {
  createTaskSchema,
  inviteMemberSchema,
  type CreateTaskInput,
  type InviteMemberInput,
  type TaskWithDetails,
  type ProjectWithDetails,
  type ActivityLog,
} from '@taskflow/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api, ApiError } from '@/lib/api';
import { cn, formatDate, formatRelativeDate, getInitials, getPriorityColor, isOverdue } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;

const createTaskFormSchema = createTaskSchema.extend({
  dueDate: z.preprocess(
    (val) => {
      if (!val || val === '') return null;
      return new Date(val as string).toISOString();
    },
    z.string().datetime().nullable().optional()
  ),
});
const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const handler = () => setCreateTaskOpen(true);
    window.addEventListener('taskflow:create-task', handler);
    return () => window.removeEventListener('taskflow:create-task', handler);
  }, []);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<ProjectWithDetails>(`/projects/${id}`),
    enabled: !!id,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get<TaskWithDetails[]>(`/tasks/project/${id}?limit=100`),
    enabled: !!id,
  });

  const { data: activity } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => api.get<ActivityLog[]>(`/projects/${id}/activity`),
    enabled: !!id,
  });
  const myMembership = project?.members.find((m) => m.user.id === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskInput) => api.post(`/tasks/project/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setCreateTaskOpen(false);
      toast.success('Task created');
    },
    onError: (error: Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.patch(`/tasks/${taskId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['activity', id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Task deleted');
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (data: InviteMemberInput) => api.post(`/projects/${id}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setInviteMemberOpen(false);
      toast.success('Member invited');
    },
    onError: (error: Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to invite member');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/projects/${id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Member removed');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      navigate('/projects');
      toast.success('Project deleted');
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus && STATUSES.includes(newStatus as typeof STATUSES[number])) {
      updateTaskMutation.mutate({ taskId, status: newStatus });
    }
  };

  if (projectLoading || tasksLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setInviteMemberOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this project?')) {
                      deleteProjectMutation.mutate();
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members ({project.members.length})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {STATUSES.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  label={STATUS_LABELS[status]}
                  tasks={tasks.filter((t) => t.status === status)}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onDelete={(taskId) => deleteTaskMutation.mutate(taskId)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask && <TaskCard task={activeTask} isDragging />}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              {isAdmin && (
                <Button size="sm" onClick={() => setInviteMemberOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user.avatarUrl || undefined} />
                        <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      {isAdmin && member.user.id !== project.ownerId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Remove ${member.user.name} from the project?`)) {
                              removeMemberMutation.mutate(member.user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {activity && activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={log.actor.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(log.actor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{log.actor.name}</span>{' '}
                          {formatAction(log.action, log.metadata as Record<string, unknown>)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onSubmit={(data) => createTaskMutation.mutate(data)}
        isLoading={createTaskMutation.isPending}
        members={project.members}
      />

      <InviteMemberDialog
        open={inviteMemberOpen}
        onOpenChange={setInviteMemberOpen}
        onSubmit={(data) => inviteMemberMutation.mutate(data)}
        isLoading={inviteMemberMutation.isPending}
      />
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  tasks,
  isAdmin,
  currentUserId,
  onDelete,
}: {
  status: string;
  label: string;
  tasks: TaskWithDetails[];
  isAdmin: boolean;
  currentUserId?: string;
  onDelete: (taskId: string) => void;
}) {
  const { setNodeRef } = useSortable({ id: status, data: { type: 'column' } });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-lg border bg-muted/50 p-3"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{label}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              canDelete={isAdmin || task.createdById === currentUserId}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({
  task,
  canDelete,
  onDelete,
}: {
  task: TaskWithDetails;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        isDragging={isDragging}
        dragHandleProps={listeners}
        canDelete={canDelete}
        onDelete={onDelete}
      />
    </div>
  );
}

function TaskCard({
  task,
  isDragging,
  dragHandleProps,
  canDelete,
  onDelete,
}: {
  task: TaskWithDetails;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={cn(
        'cursor-grab bg-card transition-shadow hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 cursor-grab text-muted-foreground" {...dragHandleProps}>
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight">{task.title}</p>
              {canDelete && onDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('text-xs', getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>
              {task.dueDate && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    isOverdue(task.dueDate) ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>
            {task.assignee && (
              <div className="mt-2 flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignee.avatarUrl || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  members,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTaskInput) => void;
  isLoading: boolean;
  members: ProjectWithDetails['members'];
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: { priority: 'MEDIUM', status: 'TODO' },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new task to this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Task title" {...register('title')} disabled={isLoading} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Optional description" {...register('description')} disabled={isLoading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select defaultValue="MEDIUM" onValueChange={(v) => setValue('priority', v as CreateTaskInput['priority'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" {...register('dueDate')} disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select onValueChange={(v) => setValue('assigneeId', v || null)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>{m.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InviteMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InviteMemberInput) => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { role: 'MEMBER' },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>Add a team member to this project by their email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="member@example.com" {...register('email')} disabled={isLoading} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue="MEMBER" onValueChange={(v) => setValue('role', v as 'ADMIN' | 'MEMBER')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invite Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatAction(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case 'PROJECT_CREATED': return 'created this project';
    case 'PROJECT_UPDATED': return 'updated project settings';
    case 'MEMBER_ADDED': return `invited ${metadata.email || 'a member'}`;
    case 'MEMBER_REMOVED': return `removed ${metadata.userName || 'a member'}`;
    case 'MEMBER_ROLE_CHANGED': return `changed role to ${metadata.role}`;
    case 'TASK_CREATED': return `created task "${metadata.title}"`;
    case 'TASK_UPDATED': return `updated task "${metadata.taskTitle}"`;
    case 'TASK_DELETED': return `deleted task "${metadata.taskTitle}"`;
    case 'TASK_ASSIGNED': return `assigned task "${metadata.taskTitle}"`;
    case 'TASK_STATUS_CHANGED': return `moved "${metadata.taskTitle}" to ${STATUS_LABELS[metadata.newStatus as string] || metadata.newStatus}`;
    case 'COMMENT_ADDED': return `commented on "${metadata.taskTitle}"`;
    default: return action.toLowerCase().replace(/_/g, ' ');
  }
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-96" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-muted/50 p-3">
            <Skeleton className="h-5 w-24" />
            <div className="mt-3 space-y-2">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
