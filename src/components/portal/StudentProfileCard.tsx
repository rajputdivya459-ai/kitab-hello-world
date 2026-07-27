import { User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  name: string;
  course?: string | null;
  admissionNumber?: string | null;
  className?: string | null;
  section?: string | null;
  imageUrl?: string | null;
  variant?: 'parent' | 'student';
}

export function StudentProfileCard({ name, course, admissionNumber, className, section, imageUrl, variant = 'parent' }: Props) {
  const ring = variant === 'student' ? 'ring-indigo-200 bg-indigo-50' : 'ring-primary/20 bg-primary/5';
  return (
    <Card className="p-5 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className={`h-16 w-16 rounded-full ring-2 ${ring} flex items-center justify-center overflow-hidden shrink-0`}>
          {imageUrl
            ? <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            : <User className="h-7 w-7 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold leading-tight truncate">{name}</h2>
          {course && <p className="text-sm text-muted-foreground truncate">{course}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {admissionNumber && <Badge variant="secondary" className="font-normal">#{admissionNumber}</Badge>}
            {className && <Badge variant="outline" className="font-normal">Class {className}</Badge>}
            {section && <Badge variant="outline" className="font-normal">Sec {section}</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );
}
