 import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
 import { User, Session } from '@supabase/supabase-js';
 import { supabase } from '@/integrations/supabase/client';
 import { withTimeout } from '@/lib/utils';
 
 interface AuthContextType {
   user: User | null;
   session: Session | null;
   isAdmin: boolean;
   isLoading: boolean;
   signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
   signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
   signOut: () => Promise<void>;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [isAdmin, setIsAdmin] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
 
   const checkAdminRole = async (userId: string) => {
     try {
       const { data, error } = await supabase
         .from('user_roles')
         .select('role')
         .eq('user_id', userId)
         .eq('role', 'admin')
         .maybeSingle();
 
       if (error) {
         console.error('Error checking admin role:', error);
         return false;
       }
       return !!data;
     } catch (err) {
       console.error('Error checking admin role:', err);
       return false;
     }
   };
 
   useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (session?.user) {
          checkAdminRole(session.user.id).then(setIsAdmin).catch(() => setIsAdmin(false));
        } else {
          setIsAdmin(false);
        }
      }
    );
 
     withTimeout(supabase.auth.getSession(), 8000, 'Auth timeout').then(({ data: { session } }) => {
       setSession(session);
       setUser(session?.user ?? null);
       setIsLoading(false);
       if (session?.user) {
         withTimeout(checkAdminRole(session.user.id), 5000).then(setIsAdmin).catch(() => setIsAdmin(false));
       }
     }).catch(() => {
       setSession(null);
       setUser(null);
       setIsAdmin(false);
       setIsLoading(false);
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   const signIn = async (email: string, password: string) => {
     const { error } = await supabase.auth.signInWithPassword({ email, password });
     return { error: error as Error | null };
   };
 
   const signUp = async (email: string, password: string, fullName: string) => {
     const { error } = await supabase.auth.signUp({
       email,
       password,
       options: {
         data: { full_name: fullName },
         emailRedirectTo: window.location.origin,
       },
     });
     return { error: error as Error | null };
   };
 
   const signOut = async () => {
     await supabase.auth.signOut();
   };
 
   return (
     <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signIn, signUp, signOut }}>
       {children}
     </AuthContext.Provider>
   );
 }
 
 export function useAuth() {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
 }