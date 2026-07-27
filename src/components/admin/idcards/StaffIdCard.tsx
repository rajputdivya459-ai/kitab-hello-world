import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Briefcase } from 'lucide-react';

export interface StaffIdCardData {
  full_name: string;
  staff_code: string;
  role: string | null;
  phone: string | null;
  photo_url: string | null;
}

interface Props {
  staff: StaffIdCardData;
  schoolName: string;
  schoolAddress: string;
  schoolLogo?: string;
}

export const StaffIdCard = forwardRef<HTMLDivElement, Props>(({ staff, schoolName, schoolAddress, schoolLogo }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl overflow-hidden border shadow-lg"
      style={{ width: 340, minHeight: 540, fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="bg-accent text-accent-foreground px-4 py-3 flex items-center gap-3">
        {schoolLogo ? (
          <img src={schoolLogo} alt="logo" className="h-10 w-10 rounded bg-white object-contain p-1" crossOrigin="anonymous" />
        ) : (
          <div className="h-10 w-10 rounded bg-white/30 flex items-center justify-center"><Briefcase className="h-5 w-5" /></div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{schoolName}</p>
          <p className="text-[10px] opacity-80 truncate">{schoolAddress}</p>
        </div>
      </div>
      <div className="px-4 py-3 text-center bg-primary/5 border-b">
        <p className="text-xs font-semibold tracking-widest text-primary">STAFF IDENTITY CARD</p>
      </div>
      <div className="p-4 flex flex-col items-center text-center">
        <div className="h-28 w-28 rounded-lg overflow-hidden bg-muted border-2 border-accent mb-3">
          {staff.photo_url ? (
            <img src={staff.photo_url} alt={staff.full_name} className="h-full w-full object-cover" crossOrigin="anonymous" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
              {staff.full_name?.charAt(0) ?? '?'}
            </div>
          )}
        </div>
        <p className="font-bold text-base text-foreground">{staff.full_name}</p>
        <p className="text-xs text-muted-foreground capitalize">{staff.role ?? '—'}</p>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4 w-full text-[11px]">
          <dt className="text-muted-foreground text-left">Staff ID</dt>
          <dd className="font-medium text-right">{staff.staff_code}</dd>
          <dt className="text-muted-foreground text-left">Phone</dt>
          <dd className="font-medium text-right">{staff.phone ?? '—'}</dd>
        </dl>

        <div className="mt-3 flex justify-center">
          <QRCodeSVG value={staff.staff_code} size={64} />
        </div>
      </div>
      <div className="px-4 py-2 bg-accent text-accent-foreground text-[9px] text-center">
        Property of {schoolName}
      </div>
    </div>
  );
});
StaffIdCard.displayName = 'StaffIdCard';
