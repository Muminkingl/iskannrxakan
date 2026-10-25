import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/market';

export type AccountState = {
  role: UserRole;
  isDeleted: boolean;
  activationCode: string | null;
  isVip: boolean;
  vipExpiresAt: string | null;
  pendingPayment: boolean;
  storePremiumActive: boolean;
};

function parseRole(value: unknown): UserRole {
  return value === 'owner' || value === 'admin' ? value : 'user';
}

/**
 * Fetch only the signed-in user's account state through the security-definer
 * RPC. This replaces the old startup fan-out and never returns the admin list.
 */
export async function fetchAccountState(): Promise<AccountState | null> {
  const { data, error } = await supabase.rpc('get_my_account_state');
  if (error || !data || typeof data !== 'object') {
    return null;
  }

  const state = data as Record<string, unknown>;
  return {
    role: parseRole(state.role),
    isDeleted: state.is_deleted === true,
    activationCode: typeof state.activation_code === 'string' ? state.activation_code : null,
    isVip: state.is_vip === true,
    vipExpiresAt: typeof state.vip_expires_at === 'string' ? state.vip_expires_at : null,
    pendingPayment: state.pending_payment === true,
    storePremiumActive: state.store_premium_active === true,
  };
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
