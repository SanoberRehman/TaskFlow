import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Users,
  LayoutDashboard,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Kanban Boards',
    description: 'Visualize your workflow with drag-and-drop task boards. Move tasks between stages effortlessly.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members, assign roles, and work together in real-time on shared projects.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Fine-grained permissions with Admin and Member roles to keep your projects secure.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analytics',
    description: 'Track progress with visual charts, overdue alerts, and task completion metrics.',
  },
  {
    icon: Zap,
    title: 'Keyboard Shortcuts',
    description: 'Power user friendly with shortcuts for quick navigation and task creation.',
  },
  {
    icon: CheckCircle2,
    title: 'Activity Feed',
    description: 'Stay updated with a detailed activity log of all project changes and comments.',
  },
];

export function LandingPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <svg className="h-5 w-5 text-white" viewBox="0 0 100 100" fill="none">
                <path d="M25 50 L40 65 L75 30" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent" />
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Project management
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {' '}done right
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              TaskFlow helps teams organize, track, and manage their work with intuitive Kanban boards,
              real-time collaboration, and powerful dashboards. Built for teams that ship.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" asChild className="gap-2">
                <Link to="/signup">
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 rounded-xl border bg-card p-2 shadow-2xl sm:mt-24">
            <div className="rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 p-4">
              <div className="flex gap-2 pb-4">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {['Todo', 'In Progress', 'In Review', 'Done'].map((status, i) => (
                  <div key={status} className="rounded-lg bg-slate-800/50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">{status}</span>
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">{3 - i}</span>
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: 3 - i }).map((_, j) => (
                        <div key={j} className="rounded-md bg-slate-700/50 p-3">
                          <div className="h-2 w-3/4 rounded bg-slate-600" />
                          <div className="mt-2 h-2 w-1/2 rounded bg-slate-600/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t py-24 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to ship faster
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for modern development teams.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/50 py-24 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to streamline your workflow?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of teams already using TaskFlow to ship better products.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild className="gap-2">
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-purple-600">
              <svg className="h-4 w-4 text-white" viewBox="0 0 100 100" fill="none">
                <path d="M25 50 L40 65 L75 30" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold">TaskFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for the nomination submission. Modern project management.
          </p>
        </div>
      </footer>
    </div>
  );
}
