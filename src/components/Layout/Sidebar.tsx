
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Brain,
  BarChart3,
  Database,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/prediction', icon: Brain, label: 'Prediction' },
    { path: '/training', icon: Database, label: 'Training' },
    { path: '/models', icon: BarChart3, label: 'Models' },
  ];

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground fixed md:sticky top-0 z-30 h-screen transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="text-sidebar-primary rounded-md p-1">
              <Brain size={24} className="h-6 w-6" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg whitespace-nowrap">
                Med Risk AI
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent rounded p-1"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>

        <div className={cn("flex items-center p-4 mb-2 border-b border-sidebar-border", collapsed ? "justify-center" : "")}>
          <div className="text-sidebar-primary">
            <UserCircle size={collapsed ? 24 : 32} />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="font-medium">Dr. John Smith</p>
              <p className="text-xs text-sidebar-foreground/80">Administrator</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                    isActive(item.path)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={18} className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <ul className="space-y-1">
            <li>
              <Link
                to="/settings"
                className="flex items-center rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                title={collapsed ? "Settings" : undefined}
              >
                <Settings className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                {!collapsed && <span>Settings</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/logout"
                className="flex items-center rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                title={collapsed ? "Logout" : undefined}
              >
                <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                {!collapsed && <span>Logout</span>}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
