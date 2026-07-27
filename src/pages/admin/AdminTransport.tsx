import { useEffect, useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { notifyTransportAssigned } from '@/lib/notify';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Bus, Users, MapPin } from 'lucide-react';
import { toast } from 'sonner';

type Route = { id: string; route_name: string; route_number: string; pickup_points: any; monthly_fee: number; is_active: boolean };
type Vehicle = { id: string; vehicle_number: string; vehicle_type: string; capacity: number; route_id: string | null; is_active: boolean };
type Driver = { id: string; name: string; phone: string | null; license_number: string | null; vehicle_id: string | null; is_active: boolean };
type Assignment = { id: string; student_id: string; route_id: string; pickup_point: string | null; transport_fee: number; is_active: boolean };
type Student = { id: string; name: string; admission_number: string | null };

export default function AdminTransport() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');

  const refresh = async () => {
    const [r, v, d, a, s] = await Promise.all([
      supabase.from('transport_routes').select('*').order('route_number'),
      supabase.from('transport_vehicles').select('*').order('vehicle_number'),
      supabase.from('transport_drivers').select('*').order('name'),
      supabase.from('student_transport').select('*'),
      supabase.from('students').select('id,name,admission_number').order('name'),
    ]);
    setRoutes((r.data ?? []) as any);
    setVehicles((v.data ?? []) as any);
    setDrivers((d.data ?? []) as any);
    setAssignments((a.data ?? []) as any);
    setStudents((s.data ?? []) as any);
  };
  useEffect(() => { refresh(); }, []);

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));
  const routeMap = Object.fromEntries(routes.map((r) => [r.id, r]));
  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  // Stats
  const totalUsing = assignments.length;
  const routeCounts = routes.map((r) => ({ name: r.route_name, count: assignments.filter((a) => a.route_id === r.id).length }));
  const totalFeeCollection = assignments.reduce((sum, a) => sum + Number(a.transport_fee), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Students Using Transport</p><p className="text-2xl font-bold">{totalUsing}</p></div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3"><div className="p-2 bg-accent/30 rounded-lg"><Bus className="h-5 w-5 text-accent-foreground" /></div>
              <div><p className="text-xs text-muted-foreground">Active Routes</p><p className="text-2xl font-bold">{routes.filter(r => r.is_active).length}</p></div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 rounded-lg"><MapPin className="h-5 w-5 text-emerald-700" /></div>
              <div><p className="text-xs text-muted-foreground">Monthly Fee Total</p><p className="text-2xl font-bold">₹{totalFeeCollection.toLocaleString()}</p></div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="routes">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          {/* ROUTES */}
          <TabsContent value="routes" className="mt-4">
            <RoutesTab routes={routes} refresh={refresh} />
            <p className="text-xs text-muted-foreground mt-4">Route counts: {routeCounts.map(r => `${r.name} (${r.count})`).join(' · ') || '—'}</p>
          </TabsContent>

          <TabsContent value="vehicles" className="mt-4">
            <VehiclesTab vehicles={vehicles} routes={routes} refresh={refresh} />
          </TabsContent>

          <TabsContent value="drivers" className="mt-4">
            <DriversTab drivers={drivers} vehicles={vehicles} refresh={refresh} />
          </TabsContent>

          <TabsContent value="assignments" className="mt-4">
            <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
              <Input placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
              <AssignmentDialog students={students} routes={routes} assignments={assignments} refresh={refresh} />
            </div>
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr><th className="text-left p-3">Student</th><th className="text-left p-3">Route</th><th className="text-left p-3">Pickup</th><th className="text-right p-3">Fee</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody>
                    {assignments.filter(a => {
                      const s = studentMap[a.student_id];
                      return !search || s?.name.toLowerCase().includes(search.toLowerCase()) || s?.admission_number?.toLowerCase().includes(search.toLowerCase());
                    }).map(a => {
                      const s = studentMap[a.student_id];
                      const r = routeMap[a.route_id];
                      return (
                        <tr key={a.id} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{s?.name ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">{s?.admission_number}</div>
                          </td>
                          <td className="p-3">{r?.route_name ?? '—'} <span className="text-xs text-muted-foreground">({r?.route_number})</span></td>
                          <td className="p-3">{a.pickup_point ?? '—'}</td>
                          <td className="p-3 text-right">₹{Number(a.transport_fee).toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="icon" onClick={async () => {
                              if (!confirm('Remove transport assignment?')) return;
                              await supabase.from('student_transport').delete().eq('id', a.id);
                              toast.success('Removed'); refresh();
                            }}><Trash2 className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      );
                    })}
                    {assignments.length === 0 && <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No assignments yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function RoutesTab({ routes, refresh }: { routes: Route[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [form, setForm] = useState({ route_name: '', route_number: '', monthly_fee: 0, pickup_points: '' });

  const startEdit = (r: Route | null) => {
    setEditing(r);
    setForm(r ? {
      route_name: r.route_name, route_number: r.route_number, monthly_fee: r.monthly_fee,
      pickup_points: (r.pickup_points as any[]).map(p => `${p.name}|${p.time ?? ''}`).join('\n'),
    } : { route_name: '', route_number: '', monthly_fee: 0, pickup_points: '' });
    setOpen(true);
  };

  const save = async () => {
    const pickup_points = form.pickup_points.split('\n').filter(Boolean).map(line => {
      const [name, time] = line.split('|');
      return { name: name.trim(), time: (time ?? '').trim() };
    });
    const payload = { route_name: form.route_name, route_number: form.route_number, monthly_fee: Number(form.monthly_fee), pickup_points };
    const { error } = editing ? await supabase.from('transport_routes').update(payload).eq('id', editing.id) : await supabase.from('transport_routes').insert(payload as any);
    if (error) return toast.error(error.message);
    toast.success('Saved'); setOpen(false); refresh();
  };

  return (
    <>
      <div className="flex justify-end mb-3"><Button onClick={() => startEdit(null)}><Plus className="h-4 w-4 mr-2" />New Route</Button></div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {routes.map(r => (
          <Card key={r.id} className="p-4">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="font-bold">{r.route_name}</p>
                <p className="text-xs text-muted-foreground">{r.route_number} · ₹{Number(r.monthly_fee).toLocaleString()}/mo</p>
              </div>
              <Badge variant={r.is_active ? 'default' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <ul className="mt-3 space-y-1 text-xs">
              {(r.pickup_points as any[]).map((p, i) => (
                <li key={i} className="flex justify-between"><span>📍 {p.name}</span><span className="text-muted-foreground">{p.time}</span></li>
              ))}
            </ul>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => startEdit(r)}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                if (!confirm('Delete this route?')) return;
                const { error } = await supabase.from('transport_routes').delete().eq('id', r.id);
                if (error) toast.error(error.message); else { toast.success('Deleted'); refresh(); }
              }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </Card>
        ))}
        {routes.length === 0 && <Card className="p-6 text-center text-muted-foreground md:col-span-3">No routes yet</Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'New'} Route</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Route Name</Label><Input value={form.route_name} onChange={e => setForm({ ...form, route_name: e.target.value })} /></div>
            <div><Label>Route Number</Label><Input value={form.route_number} onChange={e => setForm({ ...form, route_number: e.target.value })} /></div>
            <div><Label>Monthly Fee (₹)</Label><Input type="number" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: Number(e.target.value) })} /></div>
            <div><Label>Pickup Points (one per line: <code>Name|HH:MM</code>)</Label>
              <textarea className="w-full border rounded p-2 text-sm min-h-[100px]" value={form.pickup_points} onChange={e => setForm({ ...form, pickup_points: e.target.value })} placeholder="Main Stand|07:15" />
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function VehiclesTab({ vehicles, routes, refresh }: { vehicles: Vehicle[]; routes: Route[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ vehicle_number: '', vehicle_type: 'bus', capacity: 0, route_id: '' });
  const routeMap = Object.fromEntries(routes.map(r => [r.id, r]));

  const startEdit = (v: Vehicle | null) => {
    setEditing(v);
    setForm(v ? { vehicle_number: v.vehicle_number, vehicle_type: v.vehicle_type, capacity: v.capacity, route_id: v.route_id ?? '' }
              : { vehicle_number: '', vehicle_type: 'bus', capacity: 0, route_id: '' });
    setOpen(true);
  };

  const save = async () => {
    const payload = { ...form, capacity: Number(form.capacity), route_id: form.route_id || null };
    const { error } = editing ? await supabase.from('transport_vehicles').update(payload).eq('id', editing.id) : await supabase.from('transport_vehicles').insert(payload as any);
    if (error) return toast.error(error.message);
    toast.success('Saved'); setOpen(false); refresh();
  };

  return (
    <>
      <div className="flex justify-end mb-3"><Button onClick={() => startEdit(null)}><Plus className="h-4 w-4 mr-2" />New Vehicle</Button></div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="text-left p-3">Number</th><th className="text-left p-3">Type</th><th className="text-right p-3">Capacity</th><th className="text-left p-3">Route</th><th className="p-3"></th></tr></thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} className="border-t">
                  <td className="p-3 font-mono">{v.vehicle_number}</td>
                  <td className="p-3 capitalize">{v.vehicle_type}</td>
                  <td className="p-3 text-right">{v.capacity}</td>
                  <td className="p-3">{v.route_id ? routeMap[v.route_id]?.route_name : '—'}</td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(v)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('transport_vehicles').delete().eq('id', v.id); refresh(); }}><Trash2 className="h-3 w-3" /></Button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No vehicles yet</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'New'} Vehicle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Vehicle Number</Label><Input value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></div>
            <div><Label>Type</Label>
              <Select value={form.vehicle_type} onValueChange={v => setForm({ ...form, vehicle_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="bus">Bus</SelectItem><SelectItem value="mini-bus">Mini Bus</SelectItem><SelectItem value="van">Van</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
            <div><Label>Route</Label>
              <Select value={form.route_id} onValueChange={v => setForm({ ...form, route_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DriversTab({ drivers, vehicles, refresh }: { drivers: Driver[]; vehicles: Vehicle[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', license_number: '', vehicle_id: '' });
  const vMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const startEdit = (d: Driver | null) => {
    setEditing(d);
    setForm(d ? { name: d.name, phone: d.phone ?? '', license_number: d.license_number ?? '', vehicle_id: d.vehicle_id ?? '' }
              : { name: '', phone: '', license_number: '', vehicle_id: '' });
    setOpen(true);
  };
  const save = async () => {
    const payload = { ...form, vehicle_id: form.vehicle_id || null };
    const { error } = editing ? await supabase.from('transport_drivers').update(payload).eq('id', editing.id) : await supabase.from('transport_drivers').insert(payload as any);
    if (error) return toast.error(error.message);
    toast.success('Saved'); setOpen(false); refresh();
  };

  return (
    <>
      <div className="flex justify-end mb-3"><Button onClick={() => startEdit(null)}><Plus className="h-4 w-4 mr-2" />New Driver</Button></div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Phone</th><th className="text-left p-3">License</th><th className="text-left p-3">Vehicle</th><th className="p-3"></th></tr></thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id} className="border-t">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3">{d.phone ?? '—'}</td>
                  <td className="p-3 font-mono text-xs">{d.license_number ?? '—'}</td>
                  <td className="p-3">{d.vehicle_id ? vMap[d.vehicle_id]?.vehicle_number : '—'}</td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(d)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('transport_drivers').delete().eq('id', d.id); refresh(); }}><Trash2 className="h-3 w-3" /></Button>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No drivers yet</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'New'} Driver</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>License Number</Label><Input value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} /></div>
            <div><Label>Assigned Vehicle</Label>
              <Select value={form.vehicle_id} onValueChange={v => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AssignmentDialog({ students, routes, assignments, refresh }: { students: Student[]; routes: Route[]; assignments: Assignment[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', route_id: '', pickup_point: '', transport_fee: 0 });
  const selectedRoute = routes.find(r => r.id === form.route_id);
  const assignedIds = new Set(assignments.map(a => a.student_id));

  const save = async () => {
    if (!form.student_id || !form.route_id) return toast.error('Select student & route');
    const { error } = await supabase.from('student_transport').insert(form as any);
    if (error) return toast.error(error.message);
    toast.success('Assigned');
    const routeName = routes.find(r => r.id === form.route_id)?.route_name ?? 'route';
    void notifyTransportAssigned(form.student_id, routeName).catch(() => {});
    setOpen(false); setForm({ student_id: '', route_id: '', pickup_point: '', transport_fee: 0 }); refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Assign Student</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign Transport</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Student</Label>
            <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pick student" /></SelectTrigger>
              <SelectContent>{students.filter(s => !assignedIds.has(s.id)).map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admission_number})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Route</Label>
            <Select value={form.route_id} onValueChange={v => {
              const r = routes.find(x => x.id === v);
              setForm({ ...form, route_id: v, transport_fee: r?.monthly_fee ?? 0 });
            }}>
              <SelectTrigger><SelectValue placeholder="Pick route" /></SelectTrigger>
              <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name} (₹{r.monthly_fee})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedRoute && (
            <div><Label>Pickup Point</Label>
              <Select value={form.pickup_point} onValueChange={v => setForm({ ...form, pickup_point: v })}>
                <SelectTrigger><SelectValue placeholder="Pick point" /></SelectTrigger>
                <SelectContent>{(selectedRoute.pickup_points as any[]).map((p, i) => <SelectItem key={i} value={p.name}>{p.name} · {p.time}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Transport Fee (₹/mo)</Label><Input type="number" value={form.transport_fee} onChange={e => setForm({ ...form, transport_fee: Number(e.target.value) })} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Assign</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
