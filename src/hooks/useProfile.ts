import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  education: any[];
  experience: any[];
  skills: any[];
  languages: any[];
  plan: string;
  plan_status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserUsage {
  scans_used: number;
  month_start: string;
}

export interface ProfileHookReturn {
  profile: UserProfile | null;
  usage: UserUsage | null;
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useProfile = (): ProfileHookReturn => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setUsage(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Transform Json types to proper arrays
      const transformedProfile: UserProfile = {
        ...profileData,
        education: Array.isArray(profileData.education) ? profileData.education : [],
        experience: Array.isArray(profileData.experience) ? profileData.experience : [],
        skills: Array.isArray(profileData.skills) ? profileData.skills : [],
        languages: Array.isArray(profileData.languages) ? profileData.languages : [],
      };
      
      setProfile(transformedProfile);

      // Fetch current month usage
      const currentDate = new Date();
      const monthStart = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      const { data: usageData, error: usageError } = await supabase
        .from('usage_scans')
        .select('scans_count, month_start')
        .eq('user_id', user.id)
        .eq('month_start', monthStart)
        .maybeSingle();

      if (usageError && usageError.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
        throw usageError;
      }

      setUsage({
        scans_used: usageData?.scans_count || 0,
        month_start: monthStart
      });

    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error('No user or profile available');
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transform Json types to proper arrays
      const transformedProfile: UserProfile = {
        ...data,
        education: Array.isArray(data.education) ? data.education : [],
        experience: Array.isArray(data.experience) ? data.experience : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
      };
      
      setProfile(transformedProfile);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      throw new Error(err.message || 'Failed to update profile');
    }
  };

  // Determine if user is premium
  const isPremium = Boolean(
    profile && 
    (profile.plan === 'pro' || profile.plan === 'premium') &&
    profile.plan_status === 'active'
  );

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    usage,
    isPremium,
    isLoading,
    error,
    refreshProfile: fetchProfile,
    updateProfile
  };
};
