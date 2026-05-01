import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatRelativeDate, getInitials, getPriorityColor, isOverdue } from '@/lib/utils';
import type { Dashboard } from '@taskflow/shared';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#22c55e'];

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<Dashboard>('/dashboard'),
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FolderKanban className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">No data available</h2>
        <p className="mt-2 text-muted-foreground">Start by creating a project.</p>
        <Button className="mt-4" asChild>
          <Link to="/projects">Go to Projects</Link>
        </Button>
      </div>
    );
  }

  const chartData = [
    { name: 'Todo', value: data.tasksByStatus.todo },
    { name: 'In Progress', value: data.tasksByStatus.inProgress },
    { name: 'In Review', value: data.tasksByStatus.inReview },
    { name: 'Done', value: data.tasksByStatus.done },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Open Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.myOpenTasks.length}</div>
            <p className="text-xs text-muted-foreground">Assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.myOverdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completedThisWeek}</div>
            <p className="text-xs text-muted-foreground">Great progress!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.projectCount}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Distribution across all your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="flex items-center gap-8">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {chartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">
                        {entry.name}: <strong>{entry.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No tasks yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingDeadlines.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.project.name}</p>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.dueDate && new Date(task.dueDate).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects" className="gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.myOpenTasks.length > 0 ? (
              <div className="space-y-3">
                {data.myOpenTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    to={`/projects/${task.projectId}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        {task.dueDate && isOverdue(task.dueDate) && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{task.project.name}</p>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks assigned to you</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across projects</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {data.recentActivity.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.actor.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.actor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.actor.name}</span>{' '}
                        <span className="text-muted-foreground">
                          {formatAction(activity.action)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    PROJECT_CREATED: 'created a project',
    PROJECT_UPDATED: 'updated a project',
    MEMBER_ADDED: 'added a team member',
    MEMBER_REMOVED: 'removed a team member',
    MEMBER_ROLE_CHANGED: 'changed a member role',
    TASK_CREATED: 'created a task',
    TASK_UPDATED: 'updated a task',
    TASK_DELETED: 'deleted a task',
    TASK_ASSIGNED: 'assigned a task',
    TASK_STATUS_CHANGED: 'changed task status',
    COMMENT_ADDED: 'commented on a task',
  };
  return map[action] || action.toLowerCase().replace(/_/g, ' ');
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
