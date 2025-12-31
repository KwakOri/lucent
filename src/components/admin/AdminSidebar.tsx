'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserGroupIcon,
  FolderIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: '대시보드', href: '/admin', icon: HomeIcon },
  { name: '아티스트 관리', href: '/admin/artists', icon: UserGroupIcon },
  { name: '프로젝트 관리', href: '/admin/projects', icon: FolderIcon },
  { name: '상품 관리', href: '/admin/products', icon: ShoppingBagIcon },
  { name: '주문 관리', href: '/admin/orders', icon: ShoppingCartIcon },
  { name: '로그 조회', href: '/admin/logs', icon: DocumentTextIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      {/* Sidebar Container */}
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Lucent Admin
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href));

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                          ${isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }
                        `}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Spacer */}
            <li className="mt-auto">
              <Link
                href="/"
                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              >
                사이트로 돌아가기
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
