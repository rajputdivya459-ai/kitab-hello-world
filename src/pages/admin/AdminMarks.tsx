import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarksWorkspace } from '@/components/marks/MarksWorkspace';
import { MarksSheetList } from '@/components/marks/MarksSheetList';
import { MarksStatCards, statItems } from '@/components/marks/MarksStatCards';
import { useRole } from '@/hooks/useRole';
import { getCurrentUser } from '@/auth/mockAuth';
import * as api from '@/lib/marks/api';

export default function AdminMarks() {
  const { role } = useRole();
  const user = getCurrentUser();
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState('review');
  const [openId, setOpenId] = useState<string | undefined>();

  const sheets = useMemo(() => api.listSheets(), [tick]);
  const stats = useMemo(() => api.statsFor(sheets), [sheets]);
  const refresh = () => setTick(t => t + 1);

  const teacherId = role === 'teacher' ? user?.profileId : undefined;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-semibold">Marks Entry & Evaluation</h1>
        <p className="text-sm text-muted-foreground">
          Enter, moderate, approve and publish subject marks for published examinations.
        </p>
      </header>

      <MarksStatCards items={statItems(role, stats)} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="review">Review & Moderation</TabsTrigger>
          <TabsTrigger value="entry">Marks Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-3">
          <MarksSheetList
            sheets={sheets} role={role}
            onOpen={id => { setOpenId(id); setTab('entry'); }}
            onChanged={refresh}
          />
        </TabsContent>

        <TabsContent value="entry" className="mt-3">
          <MarksWorkspace
            key={openId ?? 'new'}
            role={role} userId={user?.id ?? 'u_admin'} userName={user?.name ?? 'Admin'}
            teacherId={teacherId} sheetId={openId} onChanged={refresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
