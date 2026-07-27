import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoticesFeed } from '@/components/portal/NoticesFeed';
import { HomeworkFeed } from '@/components/portal/HomeworkFeed';
import { AnnouncementsFeed } from '@/components/portal/AnnouncementsFeed';

export default function StudentNotices() {
  return (
    <Tabs defaultValue="homework" className="w-full">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="homework">Homework</TabsTrigger>
        <TabsTrigger value="notices">Notices</TabsTrigger>
        <TabsTrigger value="announcements">Updates</TabsTrigger>
      </TabsList>
      <TabsContent value="homework" className="mt-4"><HomeworkFeed /></TabsContent>
      <TabsContent value="notices" className="mt-4"><NoticesFeed /></TabsContent>
      <TabsContent value="announcements" className="mt-4"><AnnouncementsFeed /></TabsContent>
    </Tabs>
  );
}
