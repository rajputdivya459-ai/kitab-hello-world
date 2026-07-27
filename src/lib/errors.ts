import { toast } from '@/hooks/use-toast';

/** Maps a Supabase / generic error to a user-friendly message. */
export function toFriendlyError(e: unknown): string {
  if (!e) return 'Something went wrong.';
  const err = e as any;
  const code = err?.code || err?.status;
  const msg = (err?.message || '').toLowerCase();

  if (code === '23505' || msg.includes('duplicate')) return 'This record already exists.';
  if (code === '23503') return 'Cannot complete: linked records exist.';
  if (code === '23502') return 'A required field is missing.';
  if (code === '42501' || msg.includes('permission')) return "You don't have permission to do that.";
  if (code === 'PGRST301' || msg.includes('jwt')) return 'Your session expired. Please sign in again.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Check your connection.';
  if (msg.includes('timeout')) return 'The request timed out. Please try again.';
  return err?.message || 'Something went wrong.';
}

/** Toasts a friendly version of any error and returns the message. */
export function handleError(e: unknown, title = 'Error'): string {
  const description = toFriendlyError(e);
  toast({ title, description, variant: 'destructive' });
  return description;
}
