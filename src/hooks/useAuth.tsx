import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clearInvalidLocalSession = async (error: unknown) => {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '';

      if (code === 'refresh_token_not_found' || message.toLowerCase().includes('invalid refresh token')) {
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setUser(null);
        return true;
      }

      return false;
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error && await clearInvalidLocalSession(error)) {
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(async (error) => {
      if (!(await clearInvalidLocalSession(error))) {
        console.error('[AuthProvider] Failed to restore session', error);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}