import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParentCtx } from '@/contexts/ParentContext';
import { Card } from '@/components/ui/card';
import { Bus, MapPin, Phone, IndianRupee } from 'lucide-react';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { EmptyState } from '@/components/portal/EmptyState';

export default function ParentTransport() {
  const { selected, selectedId } = useParentCtx();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      const { data: a } = await supabase.from('student_transport').select('*').eq('student_id', selectedId).maybeSingle();
      setAssignment(a);
      if (a) {
        const { data: r } = await supabase.from('transport_routes').select('*').eq('id', a.route_id).maybeSingle();
        setRoute(r);
        const { data: v } = await supabase.from('transport_vehicles').select('*').eq('route_id', a.route_id).maybeSingle();
        setVehicle(v);
        if (v) {
          const { data: d } = await supabase.from('transport_drivers').select('*').eq('vehicle_id', v.id).maybeSingle();
          setDriver(d);
        }
      }
      setLoading(false);
    })();
  }, [selectedId]);

  if (loading) return <PortalSkeleton />;
  if (!assignment) return <EmptyState icon={Bus} title="No transport assigned" description={`${selected?.name ?? 'Your child'} is not enrolled in school transport.`} />;

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10"><Bus className="h-5 w-5 text-primary" /></div>
          <div><p className="font-semibold">{route?.route_name}</p><p className="text-xs text-muted-foreground">Route {route?.route_number}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{assignment.pickup_point}</span></div>
          <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-muted-foreground" /><span>₹{Number(assignment.transport_fee).toLocaleString()}/mo</span></div>
        </div>
      </Card>

      {vehicle && (
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Vehicle</p>
          <p className="font-medium">{vehicle.vehicle_number} <span className="text-xs text-muted-foreground capitalize">· {vehicle.vehicle_type}</span></p>
        </Card>
      )}

      {driver && (
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Driver</p>
          <div className="flex justify-between items-center">
            <p className="font-medium">{driver.name}</p>
            {driver.phone && <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 text-primary text-sm"><Phone className="h-4 w-4" />{driver.phone}</a>}
          </div>
        </Card>
      )}

      {route?.pickup_points && (
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-2">All Stops</p>
          <ul className="space-y-2">
            {(route.pickup_points as any[]).map((p, i) => (
              <li key={i} className={`flex justify-between text-sm ${p.name === assignment.pickup_point ? 'font-semibold text-primary' : ''}`}>
                <span>📍 {p.name}</span><span className="text-muted-foreground">{p.time}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
