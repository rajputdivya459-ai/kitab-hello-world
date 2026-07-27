import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export interface PortalNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  loginPath: string;
  navItems: PortalNavItem[];
  accent?: 'parent' | 'student' | 'teacher';
}

export function PortalLayout({ title, subtitle, children, loginPath, navItems, accent = 'parent' }: Props) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => { await signOut(); navigate(loginPath); };

  const headerBg =
    accent === 'student' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
    : accent === 'teacher' ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white'
    : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky mobile-first header */}
      <header className={cn('sticky top-0 z-30 shadow-sm', headerBg)}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white/15 backdrop-blur-sm p-2 rounded-xl shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-base leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs opacity-80 truncate">{subtitle}</p>}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={handleSignOut}
            className="text-white hover:bg-white/15 hover:text-white h-9 px-3">
            <LogOut className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1.5 text-xs">Exit</span>
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-4">{children}</main>

      {/* Bottom tab nav (always visible, touch-friendly) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t shadow-lg">
        <div className="max-w-2xl mx-auto grid" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0,1fr))` }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end
              className={({ isActive }) => cn(
                'flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}>
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isActive && (
                      accent === 'student' ? 'bg-indigo-100 text-indigo-700'
                      : accent === 'teacher' ? 'bg-teal-100 text-teal-700'
                      : 'bg-primary/10 text-primary'
                    )
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
