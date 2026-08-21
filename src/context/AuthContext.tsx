import { createContext, useContext, useState, type ReactNode } from 'react';
import { signIn, signOut as amplifySignOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import type { User, UserRole } from '../types';

// FEATURE FLAG: Set to true once the AWS Cognito User Pool is configured in aws-exports.ts
const USE_AWS_COGNITO = false;

interface AuthContextValue {
  user: User | null;
  login: (phone: string, role: UserRole, password?: string) => Promise<void>;
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
    if (USE_AWS_COGNITO) {
      try {
        // Authenticate via AWS Cognito
        const { isSignedIn } = await signIn({ username: phone, password: password || '123456' });
        if (isSignedIn) {
          const authUser = await getCurrentUser();
          const session = await fetchAuthSession();
          
          // Decode standard JWT claims from Cognito (e.g. sub, phone_number, custom:role)
          const tokens = session.tokens;
          const u: User = {
            id: authUser.userId,
            name: tokens?.idToken?.payload['name']?.toString() || 'AWS User',
            phone: phone,
            role: (tokens?.idToken?.payload['custom:role']?.toString() as UserRole) || role,
          };
          
          setUser(u);
          sessionStorage.setItem('permit_user', JSON.stringify(u));
        }
      } catch (error) {
        console.error('AWS Cognito Sign-in failed', error);
        throw error;
      }
    } else {
      // Mock Login
      const found = Object.values(DEMO_USERS).find(u => u.phone === phone);
      const u: User = found ?? {
        id: `new_${Date.now()}`,
        name: role === 'customer' ? 'New Customer' : role === 'staff' ? 'New Staff' : 'New User',
        phone,
        role,
      };
      setUser(u);
      sessionStorage.setItem('permit_user', JSON.stringify(u));
    }
  };

  const logout = async () => {
    if (USE_AWS_COGNITO) {
      try {
        await amplifySignOut();
      } catch (error) {
        console.error('AWS Cognito Sign-out failed', error);
      }
    }
    setUser(null);
    sessionStorage.removeItem('permit_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
