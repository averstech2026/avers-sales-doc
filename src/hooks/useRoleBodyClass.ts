import { useEffect } from 'react';
import type { AppUser } from '../services/auth';

export function useRoleBodyClass(user: AppUser | null): void {
  useEffect(() => {
    document.body.classList.remove('role-user', 'role-superadmin');

    if (user) {
      document.body.classList.add(
        user.role === 'superadmin' ? 'role-superadmin' : 'role-user'
      );
    }

    return () => {
      document.body.classList.remove('role-user', 'role-superadmin');
    };
  }, [user]);
}
