'use client';

import { LogOut } from 'lucide-react';
import { MenuListItem } from '@/components/ui/menu-list-item';
import { useAuth } from '@/lib/auth/use-auth';

/**
 * LogoutMenuItem — wrapper client-side para que el MenuListItem maneje
 * el signOut. El page perfil/page.tsx es Server Component, no puede pasar
 * onClick directo, así que lo encapsulamos acá.
 */
export function LogoutMenuItem() {
  const { signOut } = useAuth();
  return (
    <MenuListItem
      icon={LogOut}
      label="Cerrar sesión"
      onClick={signOut}
      destructive
    />
  );
}
