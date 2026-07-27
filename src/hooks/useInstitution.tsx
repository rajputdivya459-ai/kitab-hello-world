// Deprecated: system is now school-only. Kept as a no-op shim for any lingering imports.
import { ReactNode } from 'react';

type InstType = string;

export function InstitutionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useInstitution() {
  return { institutionType: 'school' as InstType, setInstitutionType: (_: InstType) => {} };
}
