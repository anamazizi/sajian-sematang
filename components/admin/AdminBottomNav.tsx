'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/kawalan', label: 'Dashboard', icon: '🏠' },
    { href: '/kawalan/orders', label: 'Pesanan', icon: '📦' },
    { href: '/kawalan/products', label: 'Produk', icon: '🍽️' },
    { href: '/kawalan/payouts', label: 'Peniaga', icon: '💰' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 ${
                isActive 
                  ? 'text-green-600 font-semibold' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}