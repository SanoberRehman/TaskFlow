import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandStore } from '@/stores/command-store';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { open: openCommand, setOpen: setCommandOpen } = useCommandStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(!openCommand);
        return;
      }

      if (isInput) return;

      if (e.key === '/') {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }

      if (e.key === 'c') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('taskflow:create-task'));
        return;
      }

      if (e.key === 'g') {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === 'p') {
            e2.preventDefault();
            navigate('/projects');
          } else if (e2.key === 'd') {
            e2.preventDefault();
            navigate('/dashboard');
          } else if (e2.key === 'h') {
            e2.preventDefault();
            navigate('/');
          }
          window.removeEventListener('keydown', handleSecondKey);
        };
        window.addEventListener('keydown', handleSecondKey, { once: true });
        setTimeout(() => window.removeEventListener('keydown', handleSecondKey), 500);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, openCommand, setCommandOpen]);
}
