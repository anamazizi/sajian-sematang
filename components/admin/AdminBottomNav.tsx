'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';

export default function AdminBottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff';

  // Define navigation items
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      href: '/kawalan',
      roles: ['admin', 'staff'],
      description: 'Utama'
    },
    {
      id: 'orders',
      label: 'Pesanan',
      icon: '📦',
      href: '/kawalan/orders',
      roles: ['admin', 'staff'],
      description: 'Urus pesanan'
    },
    {
      id: 'products',
      label: 'Produk',
      icon: '🍽️',
      href: '/kawalan/products',
      roles: ['admin', 'staff'],
      description: 'Semua produk'
    },
    {
      id: 'payouts',
      label: 'Peniaga',
      icon: '💰',
      href: '/kawalan/payouts',
      roles: ['admin'], // Staff tidak boleh akses payout
      description: 'Urus bayaran'
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    return item.roles.includes(profile?.role || '');
  });

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center shadow-lg">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/kawalan' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center p-2 min-w-[70px] transition-all duration-200"
            >
              {/* Icon */}
              <div className={`text-2xl mb-1 transition-all duration-200 ${
                isActive ? 'scale-110' : 'scale-100'
              }`}>
                {item.icon}
              </div>
              
              {/* Label */}
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isActive 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
              )}
              
              {/* Role badge for admin-only items */}
              {item.roles.length === 1 && item.roles[0] === 'admin' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom padding for content (prevents content from being hidden behind nav) */}
      <div className="h-16"></div>
    </>
  );
}