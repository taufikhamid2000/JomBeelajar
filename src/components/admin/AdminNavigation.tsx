import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  School,
  Settings,
  BarChart3,
  LogOut,
  MenuIcon,
  ChevronLeft,
  MessageSquare,
} from 'lucide-react';
import { initializeTheme } from '@/lib/theme';

interface AdminNavigationProps {
  onCloseMobile?: () => void;
}

export default function AdminNavigation({
  onCloseMobile,
}: AdminNavigationProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Apply theme changes and check for mobile view
  useEffect(() => {
    // Initialize theme
    initializeTheme();

    // Check if we're on mobile
    const checkMobile = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      // Auto-collapse sidebar on small screens
      if (mobileView) {
        setIsCollapsed(true);
      }
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle navigation item click on mobile to close the sidebar
  const handleNavClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };
  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: <LayoutDashboard className={isCollapsed ? '' : 'mr-3'} size={18} />,
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: <Users className={isCollapsed ? '' : 'mr-3'} size={18} />,
    },
    {
      name: 'Content',
      path: '/admin/content',
      icon: <BookOpen className={isCollapsed ? '' : 'mr-3'} size={18} />,
    },
    {
      name: 'Comments',
      path: '/admin/comments',
      icon: <MessageSquare className={isCollapsed ? '' : 'mr-3'} size={18} />,
      badge: 'new',
    },
    {
      name: 'Quizzes',
      path: '/admin/quizzes',
      icon: <BookOpen className={isCollapsed ? '' : 'mr-3'} size={18} />,
      subitems: [
        {
          name: 'Pending Verification',
          path: '/admin/quizzes/pending',
          badge: 'new',
        },
        {
          name: 'All Quizzes',
          path: '/admin/quizzes/all',
        },
      ],
    },
    {
      name: 'Achievements',
      path: '/admin/achievements',
      icon: <Award className={isCollapsed ? '' : 'mr-3'} size={18} />,
    },
    {
      name: 'Schools',
      path: '/admin/schools',
      icon: <School className={isCollapsed ? '' : 'mr-3'} size={18} />,
    },
    {
      name: 'Analytics',
      path: '/admin/analytics',
      icon: <BarChart3 className={isCollapsed ? '' : 'mr-3'} size={18} />,
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: <Settings className={isCollapsed ? '' : 'mr-3'} size={18} />,
    },
    {
      name: 'Logs',
      path: '/admin/logs',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={isCollapsed ? '' : 'mr-3'}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
          <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path>
          <line x1="9" y1="9" x2="10" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="15" y2="17"></line>
        </svg>
      ),
    },
    {
      name: 'Migrations',
      path: '/admin/migrations',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={isCollapsed ? '' : 'mr-3'}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18"></path>
          <rect x="3" y="8" width="18" height="8" rx="1"></rect>
          <path d="M2 12h20"></path>
        </svg>
      ),
    },
  ];

  // Function to check if a nav item is active
  const isActive = (path: string): boolean => {
    if (!pathname) return false;
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 min-h-screen bg-gray-900 dark:bg-gray-800 text-white p-4 ${isMobile ? 'shadow-lg' : ''}`}
    >
      <div className="mb-8 flex items-center justify-between">
        {!isCollapsed && <h2 className="text-xl font-bold">JomBeelajar Admin</h2>}

        {/* Sidebar toggle button */}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? (
            <MenuIcon size={18} className="text-white" />
          ) : (
            <ChevronLeft size={18} className="text-white" />
          )}
        </button>
      </div>

      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              {' '}
              <Link
                href={item.path}
                onClick={handleNavClick}
                className={`flex items-center py-2 px-4 rounded transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-700 text-white dark:bg-blue-600'
                    : 'hover:bg-gray-800 dark:hover:bg-gray-700'
                } ${isMobile ? 'active:bg-blue-800' : ''} ${isCollapsed ? 'justify-center' : ''}`}
              >
                <div className={isCollapsed ? 'mx-auto relative' : ''}>
                  {item.icon}
                  {isCollapsed && item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-8">
        {' '}
        <Link
          href="/dashboard"
          onClick={handleNavClick}
          className={`flex items-center py-2 px-4 rounded hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className={isCollapsed ? 'mx-auto' : ''}>
            <LogOut className={isCollapsed ? '' : 'mr-3'} size={18} />
          </div>
          {!isCollapsed && <span className="text-sm">Exit Admin</span>}
        </Link>
      </div>
    </div>
  );
}
