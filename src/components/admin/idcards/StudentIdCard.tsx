import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GraduationCap } from 'lucide-react';

export interface StudentIdCardData {
  name: string;
  admission_number: string | null;
  className?: string | null;
  section?: string | null;
  parent_phone?: string | null;
  blood_group?: string | null;
  photo?: string | null;
}

interface Props {
  student: StudentIdCardData;
  schoolName: string;
  schoolAddress: string;
  schoolLogo?: string;
}

export const StudentIdCard = forwardRef<HTMLDivElement, Props>(({ student, schoolName, schoolAddress, schoolLogo }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl overflow-hidden border shadow-lg"
      style={{ width: 340, minHeight: 540, fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        {schoolLogo ? (
          <img src={schoolLogo} alt="logo" className="h-10 w-10 rounded bg-white object-contain p-1" crossOrigin="anonymous" />
        ) : (
          <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center"><GraduationCap className="h-5 w-5" /></div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{schoolName}</p>
          <p className="text-[10px] opacity-80 truncate">{schoolAddress}</p>
        </div>
      </div>
      <div className="px-4 py-3 text-center bg-accent/10 border-b">
        <p className="text-xs font-semibold tracking-widest text-primary">STUDENT IDENTITY CARD</p>
      </div>
      <div className="p-4 flex flex-col items-center text-center">
        <div className="h-28 w-28 rounded-lg overflow-hidden bg-muted border-2 border-primary mb-3">
          {student.photo ? (
            <img src={student.photo} alt={student.name} className="h-full w-full object-cover" crossOrigin="anonymous" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
              {student.name?.charAt(0) ?? '?'}
            </div>
          )}
        </div>
        <p className="font-bold text-base text-foreground">{student.name}</p>
        <p className="text-xs text-muted-foreground">{student.admission_number ?? '—'}</p>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4 w-full text-[11px]">
          <dt className="text-muted-foreground text-left">Class</dt>
          <dd className="font-medium text-right">{student.className ?? '—'}</dd>
          <dt className="text-muted-foreground text-left">Section</dt>
          <dd className="font-medium text-right">{student.section ?? '—'}</dd>
          <dt className="text-muted-foreground text-left">Parent</dt>
          <dd className="font-medium text-right">{student.parent_phone ?? '—'}</dd>
        </dl>

        <div className="mt-3 flex justify-center">
          <QRCodeSVG value={student.admission_number || student.name} size={64} />
        </div>
      </div>
      <div className="px-4 py-2 bg-primary text-primary-foreground text-[9px] text-center">
        If found, please return to {schoolName}
      </div>
    </div>
  );
});
StudentIdCard.displayName = 'StudentIdCard';
