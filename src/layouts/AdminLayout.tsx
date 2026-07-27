import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { LogOut, Menu, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useSession } from '@/auth/SessionProvider';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { roleHome } from '@/lib/roleRoutes';
import { menuForRole } from '@/config/roleMenus';

interface AdminLayoutProps { children: ReactNode }

const WORKSPACE_LABEL: Record<string, { title: string; subtitle: string }> = {
  admin:      { title: 'Admin Panel',       subtitle: 'MGCM, Ashta' },
  principal:  { title: "Principal's Desk",  subtitle: 'Executive Workspace' },
  accountant: { title: 'Accounts Desk',     subtitle: 'Finance Workspace' },
  staff:      { title: 'Staff Workspace',   subtitle: 'Front-Desk Operations' },
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user: supaUser, isAdmin, isLoading, signOut } = useAuth();
  const { user: mockUser, role: mockRole, signOut: mockSignOut } = useSession();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = mockUser ?? supaUser;
  const activeRole = mockRole ?? role;

  const groups = menuForRole(activeRole);
  const allItems = groups.flatMap(g => g.items);
  const activeGroupId = groups.find(g => g.items.some(i => i.href === location.pathname))?.id;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('admin_open_groups') : null;
    if (stored) try { return JSON.parse(stored); } catch {}
    return { main: true, website: true, school: true, communication: true, admin: true, academic: true, ops: true, finance: true };
  });

  useEffect(() => {
    if (activeGroupId && !openGroups[activeGroupId]) {
      setOpenGroups(p => ({ ...p, [activeGroupId]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId]);

  useEffect(() => {
    localStorage.setItem('admin_open_groups', JSON.stringify(openGroups));
  }, [openGroups]);

  useEffect(() => {
    if (!isLoading && !supaUser && !mockUser) navigate('/login');
  }, [supaUser, mockUser, isLoading, navigate]);

  if ((isLoading || roleLoading) && !mockUser) return <PageLoader />;
  if (!user) return null;
  if (activeRole && !['admin', 'principal', 'accountant', 'staff'].includes(activeRole)) {
    return <Navigate to={roleHome(activeRole)} replace />;
  }
  if (!mockUser && !isAdmin) return <Navigate to="/admin" replace />;

  const brand = WORKSPACE_LABEL[activeRole ?? 'admin'] ?? WORKSPACE_LABEL.admin;

  const handleSignOut = async () => {
    if (mockUser) mockSignOut();
    else await signOut();
    navigate('/login');
  };

  const toggleGroup = (id: string) => setOpenGroups(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-primary transform transition-transform duration-300 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-primary-foreground/20">
            <Link to={roleHome(activeRole)} className="flex items-center gap-3">
              <div className="bg-accent p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-display font-bold text-primary-foreground">{brand.title}</h2>
                <p className="text-xs text-primary-foreground/60">{brand.subtitle}</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            {groups.map(group => {
              const isOpen = !!openGroups[group.id];
              const hasActive = group.items.some(i => i.href === location.pathname);
              return (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                      hasActive ? 'text-primary-foreground' : 'text-primary-foreground/60 hover:text-primary-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <group.icon className="h-3.5 w-3.5" />
                      {group.label}
                    </span>
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  {isOpen && (
                    <div className="mt-1 space-y-0.5">
                      {group.items.map(item => (
                        <Link
                          key={`${group.id}-${item.href}-${item.label}`}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 ml-2 rounded-md text-sm font-medium transition-colors',
                            location.pathname === item.href
                              ? 'bg-accent text-accent-foreground shadow-sm'
                              : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-primary-foreground/20">
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-primary-foreground truncate">{user.email}</p>
              <p className="text-xs text-primary-foreground/60 capitalize">{activeRole ?? 'User'}</p>
            </div>
            <Button
              variant="outline"
              className="w-full bg-accent text-accent-foreground shadow-gold hover:bg-yellow-200"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-primary/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background border-b border-border px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-secondary" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground">
            {allItems.find(item => item.href === location.pathname)?.label || brand.title}
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
