// Custom hooks for authentication
// Sajian Sematang v2.0

'use client';

import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { User, UserRole } from '../../types/database';
import { hasPermission, Permission, canAccessRoute, getDefaultRedirectPath } from './permissions';

interface AuthState {
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Main auth hook - provides current user and profile
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
        return;
      }

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();

      setState({
        user: user,
        profile: profile,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }

  return state;
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { profile } = useAuth();
  
  if (!profile) return false;
  
  return hasPermission(profile.role as UserRole, permission);
}

/**
 * Hook to check if user can access a route
 */
export function useCanAccessRoute(route: string): boolean {
  const { profile } = useAuth();
  
  if (!profile) return false;
  
  return canAccessRoute(profile.role as UserRole, route);
}

/**
 * Hook to get user role
 */
export function useUserRole(): UserRole | null {
  const { profile } = useAuth();
  return profile?.role as UserRole || null;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null;
}

/**
 * Hook to check if profile is complete
 */
export function useIsProfileComplete(): boolean {
  const { profile } = useAuth();
  
  if (!profile) return false;
  
  // Check required fields
  const hasName = !!profile.name;
  const hasEmail = !!profile.email;
  const hasPhone = !!profile.phone_number;
  
  // Seller needs address
  if (profile.role === 'seller') {
    return hasName && hasEmail && hasPhone && !!profile.address;
  }
  
  // Admin and staff need phone
  if (profile.role === 'admin' || profile.role === 'staff') {
    return hasName && hasEmail && hasPhone;
  }
  
  // Customer only needs basic info
  return hasName && hasEmail;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
  
  // Redirect to home
  window.location.href = '/';
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get redirect path after login based on role
 */
export function getRedirectAfterLogin(role: UserRole): string {
  return getDefaultRedirectPath(role);
}

/**
 * Check if user needs to complete profile
 */
export async function checkProfileCompletion(userId: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return false;

  const hasName = !!profile.name;
  const hasEmail = !!profile.email;
  const hasPhone = !!profile.phone_number;

  if (profile.role === 'seller') {
    return hasName && hasEmail && hasPhone && !!profile.address;
  }

  if (profile.role === 'admin' || profile.role === 'staff') {
    return hasName && hasEmail && hasPhone;
  }

  return hasName && hasEmail;
}
