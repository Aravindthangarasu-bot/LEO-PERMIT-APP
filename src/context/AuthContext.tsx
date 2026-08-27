import { createContext, useContext, useState, type ReactNode } from 'react';
// Removed AWS Auth import
import type { User, UserRole } from '../types';

import { supabase } from '../supabaseClient';
import { USE_SUPABASE } from './AppStoreContext';

// FEATURE FLAG: Toggle between Mock Data (false) and Supabase (true)

interface AuthContextValue {
  user: User | null;
  login: (phone: string, role: UserRole, password?: string) => Promise<void>;
  registerCustomer: (details: Pick<User, 'name' | 'phone' | 'email' | 'address' | 'pincode' | 'city' | 'taluk' | 'district'>) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Demo users map (simulates a backend for local dev)
const DEMO_USERS: Record<string, User> = {
  '9999900000': { id: 'c1', name: 'Ravi Kumar',           phone: '9999900000', role: 'customer'  },
  '9999900001': { id: 'c2', name: 'Priya Sharma',         phone: '9999900001', role: 'customer'  },
  '8888800000': { id: 'p1', name: 'Arjun Constructions',  phone: '8888800000', role: 'provider'  },
  '8888800001': { id: 'p2', name: 'BuildRight Engineers', phone: '8888800001', role: 'provider'  },
  '8888800002': { id: 'p3', name: 'QuickApprove Solutions',phone: '8888800002', role: 'provider' },
  '8888800003': { id: 'p4', name: 'Kerala Plan Experts',  phone: '8888800003', role: 'provider'  },
  '8777700001': { id: 's1', name: 'Rajan Menon',          phone: '8777700001', role: 'staff',    providerId: 'p1' },
  '8777700002': { id: 's2', name: 'Meena Nair',           phone: '8777700002', role: 'staff',    providerId: 'p1' },
  '8777700003': { id: 's3', name: 'Suresh Babu',          phone: '8777700003', role: 'staff',    providerId: 'p1' },
  '8777700004': { id: 's4', name: 'Divya Thomas',         phone: '8777700004', role: 'staff',    providerId: 'p1' },
  '7777700000': { id: 'a1', name: 'Super Admin',          phone: '7777700000', role: 'admin'     },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('permit_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (phone: string, role: UserRole, password?: string) => {
    if (USE_SUPABASE) {
      try {
        let authUser: User | null = null;
        
        if (role === 'customer' || role === 'admin') {
          const { data, error } = await supabase.from('users').select('*').or(`phone.eq.${phone},phone.eq.91${phone}`).single();
          if (!error && data) {
            authUser = { id: data.id, name: data.name, phone: data.phone, role: data.role as UserRole };
          }
        } 
        else if (role === 'provider') {
          const { data, error } = await supabase.from('service_providers').select('*').or(`phone.eq.${phone},phone.eq.91${phone}`).single();
          if (!error && data) {
            authUser = { id: data.id, name: data.owner_name, phone: data.phone, role: 'provider' };
          }
        }
        else if (role === 'staff' || role === 'manager' || role === 'associate') {
          const { data, error } = await supabase.from('staff_members').select('*').or(`phone.eq.${phone},phone.eq.91${phone}`).single();
          if (!error && data) {
            authUser = { id: data.id, name: data.name, phone: data.phone, role: 'staff', providerId: data.provider_id };
          }
        }

        // Fallback to DEMO_USERS map if not in DB
        if (!authUser && DEMO_USERS[phone]) {
          authUser = DEMO_USERS[phone];
        }

        if (authUser) {
          setUser(authUser);
          sessionStorage.setItem('permit_user', JSON.stringify(authUser));
          return;
        } else {
          throw new Error('User not found. Please check your mobile number.');
        }
      } catch (error) {
        console.error('Sign-in error:', error);
        if (DEMO_USERS[phone]) {
          const authUser = DEMO_USERS[phone];
          setUser(authUser);
          sessionStorage.setItem('permit_user', JSON.stringify(authUser));
          return;
        }
        throw error;
      }
    } else {
      const demo = DEMO_USERS[phone];
      if (demo) {
        setUser(demo);
        sessionStorage.setItem('permit_user', JSON.stringify(demo));
      } else {
        throw new Error('User not found');
      }
    }
  };

  const registerCustomer = async (details: Pick<User, 'name' | 'phone' | 'email' | 'address' | 'pincode' | 'city' | 'taluk' | 'district'>) => {
    const { data, error } = await supabase.from('users').insert({
      name: details.name,
      phone: details.phone,
      email: details.email,
      address: details.address,
      pincode: details.pincode,
      city: details.city,
      taluk: details.taluk,
      district: details.district,
      role: 'customer',
    }).select('id, name, phone, role, email, address, pincode, city, taluk, district').single();

    if (error) {
      throw new Error(error.code === '23505' ? 'An account already exists with this phone number.' : 'Unable to create your account. Please try again.');
    }

    const authUser: User = { ...data, role: 'customer' };
    setUser(authUser);
    sessionStorage.setItem('permit_user', JSON.stringify(authUser));
  };

  const logout = async () => {
    if (USE_SUPABASE) {
      try {
        // Clear Supabase session if using real Auth
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Sign-out failed', error);
      }
    }
    setUser(null);
    sessionStorage.removeItem('permit_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, registerCustomer, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
