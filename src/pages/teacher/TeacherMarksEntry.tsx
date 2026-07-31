import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarksWorkspace } from '@/components/marks/MarksWorkspace';
import { MarksSheetList } from '@/components/marks/MarksSheetList';
import { MarksStatCards, statItems } from '@/components/marks/MarksStatCards';
import { getCurrentUser } from '@/auth/mockAuth';
import * as api from '@/lib/marks/api';

export default function TeacherMarksEntry() {
  const user = getCurrentUser();
  const teacherId = user?.profileId ?? 't_1';
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState('entry');
  const [openId, setOpenId] = useState<string | undefined>();

  const sheets = useMemo(() => api.listSheets().filter(s => s.teacherId === teacherId), [tick, teacherId]);
  const stats = useMemo(() => api.statsFor(sheets), [sheets]);

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Marks Entry</h2>
      <MarksStatCards items={statItems('teacher', stats)} className="grid-cols-2 lg:grid-cols-4" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="entry" className="flex-1">Enter Marks</TabsTrigger>
          <TabsTrigger value="mine" className="flex-1">My Sheets</TabsTrigger>
        </TabsList>
        <TabsContent value="entry" className="mt-3">
          <MarksWorkspace
            key={openId ?? 'new'}
            role="teacher" userId={user?.id ?? 'u_teacher'} userName={user?.name ?? 'Teacher'}
            teacherId={teacherId} sheetId={openId} onChanged={() => setTick(t => t + 1)}
          />
        </TabsContent>
        <TabsContent value="mine" className="mt-3">
          <MarksSheetList
            sheets={sheets} role="teacher"
            onOpen={id => { setOpenId(id); setTab('entry'); }}
            onChanged={() => setTick(t => t + 1)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
