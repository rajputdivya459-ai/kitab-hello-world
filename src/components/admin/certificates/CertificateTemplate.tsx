import { forwardRef } from 'react';

export type CertType = 'bonafide' | 'leaving' | 'character';

export interface CertificateData {
  type: CertType;
  certificate_number: string;
  issued_on: string;
  student_name: string;
  father_name?: string;
  mother_name?: string;
  admission_number?: string | null;
  class?: string | null;
  section?: string | null;
  date_of_birth?: string | null;
  admission_date?: string | null;
  reason?: string;
  conduct?: string;
  leaving_date?: string;
}

interface Props {
  cert: CertificateData;
  schoolName: string;
  schoolAddress: string;
  schoolLogo?: string;
  principalName?: string;
}

const TITLES: Record<CertType, string> = {
  bonafide: 'BONAFIDE CERTIFICATE',
  leaving: 'SCHOOL LEAVING CERTIFICATE',
  character: 'CHARACTER CERTIFICATE',
};

export const CertificateTemplate = forwardRef<HTMLDivElement, Props>(
  ({ cert, schoolName, schoolAddress, schoolLogo, principalName = 'Principal' }, ref) => {
    const dateStr = new Date(cert.issued_on).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const body = () => {
      const name = <strong>{cert.student_name}</strong>;
      switch (cert.type) {
        case 'bonafide':
          return (
            <p className="leading-loose">
              This is to certify that {name}
              {cert.father_name ? <> son/daughter of <strong>{cert.father_name}</strong></> : null}
              {cert.admission_number ? <>, bearing Admission No. <strong>{cert.admission_number}</strong>,</> : null}
              {' '}is a bonafide student of this institution, currently studying in
              {' '}<strong>{cert.class ?? '—'}{cert.section ? ` - ${cert.section}` : ''}</strong>
              {' '}during the academic year {new Date().getFullYear()}.
              {cert.reason ? <> This certificate is issued for the purpose of <strong>{cert.reason}</strong>.</> : null}
            </p>
          );
        case 'leaving':
          return (
            <p className="leading-loose">
              This is to certify that {name}
              {cert.father_name ? <>, son/daughter of <strong>{cert.father_name}</strong></> : null}
              {cert.date_of_birth ? <>, born on <strong>{new Date(cert.date_of_birth).toLocaleDateString('en-IN')}</strong></> : null}
              , was a student of this institution
              {cert.admission_date ? <> from <strong>{new Date(cert.admission_date).toLocaleDateString('en-IN')}</strong></> : null}
              {cert.leaving_date ? <> until <strong>{new Date(cert.leaving_date).toLocaleDateString('en-IN')}</strong></> : null}.
              The student was studying in class <strong>{cert.class ?? '—'}{cert.section ? ` - ${cert.section}` : ''}</strong>
              {' '}at the time of leaving.
              {cert.reason ? <> Reason for leaving: <strong>{cert.reason}</strong>.</> : null}
            </p>
          );
        case 'character':
          return (
            <p className="leading-loose">
              This is to certify that {name}
              {cert.father_name ? <>, son/daughter of <strong>{cert.father_name}</strong></> : null}
              , was a student of this institution in class <strong>{cert.class ?? '—'}{cert.section ? ` - ${cert.section}` : ''}</strong>.
              {' '}During the period of association with this school, his/her character and conduct were found to be
              {' '}<strong>{cert.conduct ?? 'Good'}</strong>. We wish him/her every success in future endeavours.
            </p>
          );
      }
    };

    return (
      <div
        ref={ref}
        className="bg-white border-[6px] border-double border-primary p-10 mx-auto"
        style={{ width: 800, minHeight: 1100, fontFamily: 'Georgia, serif', color: '#111' }}
      >
        <header className="flex items-center gap-4 border-b-2 border-primary pb-4">
          {schoolLogo && <img src={schoolLogo} alt="logo" className="h-20 w-20 object-contain" crossOrigin="anonymous" />}
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-primary tracking-wide">{schoolName}</h1>
            <p className="text-sm text-muted-foreground mt-1">{schoolAddress}</p>
          </div>
        </header>

        <div className="text-center mt-8">
          <h2 className="text-2xl font-bold tracking-[0.3em] inline-block border-b-2 border-foreground pb-1">
            {TITLES[cert.type]}
          </h2>
        </div>

        <div className="flex justify-between text-sm mt-6 mb-8">
          <span><strong>Ref No.:</strong> {cert.certificate_number}</span>
          <span><strong>Date:</strong> {dateStr}</span>
        </div>

        <div className="text-justify text-base px-4">{body()}</div>

        <div className="mt-20 flex justify-between items-end px-4">
          <div className="text-center">
            <div className="w-40 border-t border-foreground pt-1 text-sm">Office Seal</div>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-foreground pt-1 text-sm font-semibold">{principalName}</div>
            <div className="text-xs text-muted-foreground">Principal</div>
          </div>
        </div>
      </div>
    );
  },
);
CertificateTemplate.displayName = 'CertificateTemplate';
