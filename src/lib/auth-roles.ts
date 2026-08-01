import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/market';

export const OWNER_EMAIL = 'muminrtx@gmail.com';

export function getUserRole(
  email?: string | null,
  dbAdmins: string[] = []
): UserRole {
  if (!email) return 'user';
  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
    return 'owner';
  }

  const isAdmin = dbAdmins.some((e) => e.trim().toLowerCase() === cleanEmail);
  if (isAdmin) {
    return 'admin';
  }

  return 'user';
}

export async function fetchDbAdmins(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('app_admins')
      .select('email');

    if (error) {
      console.log('Error fetching admins from DB:', error.message);
      return [];
    }

    return (data || []).map((row) => row.email);
  } catch (err) {
    console.log('Error in fetchDbAdmins:', err);
    return [];
  }
}

export async function addDbAdmin(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase
      .from('app_admins')
      .insert({ email: cleanEmail, role: 'admin' });

    if (error) {
      console.log('Error adding admin:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Error in addDbAdmin:', err);
    return false;
  }
}

export async function removeDbAdmin(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase
      .from('app_admins')
      .delete()
      .eq('email', cleanEmail);

    if (error) {
      console.log('Error removing admin:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Error in removeDbAdmin:', err);
    return false;
  }
}
