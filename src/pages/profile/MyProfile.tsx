import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Save, KeyRound } from 'lucide-react';
import { useSession } from '@/auth/SessionProvider';
import { getCollection, setCollection } from '@/mock/db';
import type { MockUser } from '@/mock/users';
import { toast } from 'sonner';

interface Props {
  /** Optional wrapper for role-specific portals (e.g. teacher shell). */
  wrap?: (children: React.ReactNode) => React.ReactNode;
}

export default function MyProfile({ wrap }: Props) {
  const { user, refresh } = useSession();
  const initial = useMemo(() => user, [user?.id]);
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [mobile, setMobile] = useState(initial?.mobile ?? '');
  const [photo, setPhoto] = useState(initial?.photo ?? '');
  const [prefs, setPrefs] = useState({
    emailNotifs: initial?.prefs?.emailNotifs ?? true,
    smsNotifs:   initial?.prefs?.smsNotifs   ?? false,
    pushNotifs:  initial?.prefs?.pushNotifs  ?? true,
  });
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  if (!user) return null;

  const updateUser = (patch: Partial<MockUser>) => {
    const users = getCollection<MockUser>('users');
    setCollection('users', users.map(u => u.id === user.id ? { ...u, ...patch } : u));
    window.dispatchEvent(new Event('erp:session'));
    refresh();
  };

  const save = () => {
    updateUser({ name, email, mobile, photo, prefs });
    toast.success('Profile updated');
  };

  const changePassword = () => {
    if (pwd.current !== user.password) return toast.error('Current password is incorrect');
    if (pwd.next.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwd.next !== pwd.confirm) return toast.error('Passwords do not match');
    updateUser({ password: pwd.next });
    setPwd({ current: '', next: '', confirm: '' });
    toast.success('Password changed');
  };

  const body = (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">My Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your account details and preferences.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <UserCircle className="h-10 w-10 text-primary" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="capitalize">{user.role}</Badge>
              <span className="text-xs text-muted-foreground">@{user.username}</span>
            </div>
            {user.lastLogin && (
              <p className="text-xs text-muted-foreground mt-1">Last login: {new Date(user.lastLogin).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mobile</Label>
            <Input value={mobile} onChange={e => setMobile(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Photo URL</Label>
            <Input value={photo} onChange={e => setPhoto(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label>Linked Profile</Label>
            <Input value={user.profileType ? `${user.profileType}: ${user.profileId ?? '—'}` : '—'} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Input value={user.role} disabled className="capitalize" />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={save}><Save className="h-4 w-4 mr-2" />Save Changes</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {([
            ['emailNotifs', 'Email notifications'],
            ['smsNotifs',   'SMS alerts'],
            ['pushNotifs',  'Push notifications'],
          ] as const).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{label}</span>
              <Switch checked={prefs[k]} onCheckedChange={v => setPrefs(p => ({ ...p, [k]: v }))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={save}><Save className="h-4 w-4 mr-2" />Save Preferences</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><KeyRound className="h-4 w-4" />Change Password</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Current</Label>
            <Input type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>New</Label>
            <Input type="password" value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm</Label>
            <Input type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-end">
          <Button variant="outline" onClick={changePassword}>Update Password</Button>
        </div>
      </Card>
    </div>
  );

  return <>{wrap ? wrap(body) : body}</>;
}
