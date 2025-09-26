import { useState, useEffect } from 'react';

type UserRole = 'admin' | 'employee';

export function useRoleToggle() {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    // Get role from localStorage or default to admin
    const savedRole = localStorage.getItem('currentRole');
    return (savedRole as UserRole) || 'admin';
  });

  useEffect(() => {
    // Save role to localStorage whenever it changes
    localStorage.setItem('currentRole', currentRole);
  }, [currentRole]);

  const toggleRole = () => {
    setCurrentRole(prevRole => prevRole === 'admin' ? 'employee' : 'admin');
  };

  const isAdmin = currentRole === 'admin';
  const isEmployee = currentRole === 'employee';

  return {
    currentRole,
    toggleRole,
    isAdmin,
    isEmployee,
  };
}