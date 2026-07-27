import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { roleHome } from '@/lib/roleRoutes';

export default function ParentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || roleLoading) return;
    if (role === 'parent') navigate('/parent/dashboard', { replace: true });
    else if (role) navigate(roleHome(role), { replace: true });
  }, [user, role, roleLoading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    // Redirect handled by role effect.
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-3">
            <Users className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">Parent Portal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sign in to view your child's progress</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="parent@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? 'Signing in…' : (<>Sign In <LogIn className="ml-2 h-4 w-4" /></>)}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-5">
          Demo: <strong>parent1@demo.com</strong> / parent123
        </p>
      </div>
    </div>
  );
}
