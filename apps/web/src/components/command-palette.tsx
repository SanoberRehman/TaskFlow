import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  User,
  LogOut,
  Moon,
  Sun,
  Search,
} from 'lucide-react';
import { useCommandStore } from '@/stores/command-store';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { api } from '@/lib/api';
import type { Project } from '@taskflow/shared';

export function CommandPalette() {
  const navigate = useNavigate();
  const { open, setOpen } = useCommandStore();
  const { logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects'),
    enabled: isAuthenticated && open,
  });

  useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!isAuthenticated) return null;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
    >
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-lg border bg-popover shadow-2xl">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation" className="text-xs text-muted-foreground px-2 py-1.5">
            <Command.Item
              onSelect={() => runCommand(() => navigate('/dashboard'))}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
              <span className="ml-auto text-xs text-muted-foreground">g d</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/projects'))}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent"
            >
              <FolderKanban className="h-4 w-4" />
              Projects
              <span className="ml-auto text-xs text-muted-foreground">g p</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/profile'))}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent"
            >
              <User className="h-4 w-4" />
              Profile
            </Command.Item>
          </Command.Group>

          {projects && projects.length > 0 && (
            <Command.Group heading="Projects" className="text-xs text-muted-foreground px-2 py-1.5">
              {projects.map((project) => (
                <Command.Item
                  key={project.id}
                  onSelect={() => runCommand(() => navigate(`/projects/${project.id}`))}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent"
                >
                  <FolderKanban className="h-4 w-4" />
                  {project.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Actions" className="text-xs text-muted-foreground px-2 py-1.5">
            <Command.Item
              onSelect={() => {
                runCommand(() => window.dispatchEvent(new CustomEvent('taskflow:create-task')));
              }}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent"
            >
              <Plus className="h-4 w-4" />
              Create Task
              <span className="ml-auto text-xs text-muted-foreground">c</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Settings" className="text-xs text-muted-foreground px-2 py-1.5">
            <Command.Item
              onSelect={() =>
                runCommand(() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'))
              }
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Toggle Theme ({theme})
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => logout())}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive aria-selected:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Command.Item>
          </Command.Group>
        </Command.List>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          <kbd className="rounded bg-muted px-1.5 py-0.5">↑↓</kbd> navigate{' '}
          <kbd className="rounded bg-muted px-1.5 py-0.5">↵</kbd> select{' '}
          <kbd className="rounded bg-muted px-1.5 py-0.5">esc</kbd> close
        </div>
      </div>
    </Command.Dialog>
  );
}
