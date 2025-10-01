import { supabase } from '@/integrations/supabase/client';

export interface SessionValidationResult {
  isValid: boolean;
  session: any;
  error?: string;
}

/**
 * Validates and refreshes the current session if needed
 * Returns a valid session or throws an error
 */
export async function validateAndRefreshSession(): Promise<SessionValidationResult> {
  try {
    // First, try to get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return { 
        isValid: false, 
        session: null, 
        error: 'Session konnte nicht abgerufen werden.' 
      };
    }

    let currentSession = sessionData.session;

    if (!currentSession) {
      return { 
        isValid: false, 
        session: null, 
        error: 'Keine aktive Sitzung gefunden.' 
      };
    }

    // Check if session is about to expire (within 2 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = currentSession.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;

    console.log('Session validation:', {
      expiresAt: new Date(expiresAt * 1000),
      timeUntilExpiry,
      needsRefresh: timeUntilExpiry < 120
    });

    // If session expires soon or is expired, try to refresh
    if (timeUntilExpiry < 120) { // 2 minutes buffer
      console.log('Session expires soon or is expired, attempting refresh...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('Session refresh failed:', refreshError);
        return { 
          isValid: false, 
          session: null, 
          error: 'Sitzung konnte nicht erneuert werden. Bitte melden Sie sich erneut an.' 
        };
      }
      
      currentSession = refreshData.session;
      console.log('Session successfully refreshed');
    }

    return {
      isValid: true,
      session: currentSession
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return { 
      isValid: false, 
      session: null, 
      error: 'Unerwarteter Fehler bei der Sitzungsüberprüfung.' 
    };
  }
}

/**
 * Simple wrapper for database operations that ensures valid session
 */
export async function withValidSession<T>(
  operation: () => Promise<T>,
  onSessionError?: (error: string) => void
): Promise<T> {
  const validation = await validateAndRefreshSession();
  
  if (!validation.isValid) {
    const error = validation.error || 'Session validation failed';
    if (onSessionError) {
      onSessionError(error);
    } else {
      throw new Error(error);
    }
    throw new Error(error);
  }
  
  return await operation();
}
