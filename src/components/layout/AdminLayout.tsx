import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Default to true (shrunken / collapsed sidebar as requested)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('wrms_sidebar_collapsed');
      if (stored === 'expanded') {
        return false;
      }
      return true; // Shrunk by default!
    } catch {
      return true;
    }
  });

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wrms_sidebar_collapsed', next ? 'collapsed' : 'expanded');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-heading">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div
        className={`transition-[padding] duration-300 ease-in-out ${
          collapsed ? 'lg:pl-[88px]' : 'lg:pl-[284px]'
        }`}
      >
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
