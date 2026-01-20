'use client';

import { usePathname } from 'next/navigation';

export default function LayoutWrapper({
  children,
  navigation,
  sidebar,
}: {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  if (isAuthPage) {
    // Auth pages - completely standalone, no layout structure
    return <div className="min-h-screen">{children}</div>;
  }

  // Main app pages - with parallel routes and three-column layout
  const hasNavigation = navigation !== null && navigation !== undefined;
  const hasSidebar = sidebar !== null && sidebar !== undefined;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      {/* Container with max-width to center on large screens */}
      <div className="w-full max-w-[1260px] flex">
        {/* Left Navigation - Parallel Route (~250px) - Sticky */}
        {/* Always render navigation slot, let Navigation component handle visibility */}
        {hasNavigation && (
          <div className="w-0 lg:w-[250px] flex-shrink-0">
            <div className="sticky top-0 h-screen">
              {navigation}
            </div>
          </div>
        )}

        {/* Middle Feed - Default Route (~600px) - Main scrollable area */}
        <div className="flex-1 w-full lg:w-[600px] lg:flex-shrink-0 pb-24 md:pb-0">
          {children}
        </div>

        {/* Right Sidebar - Parallel Route (~400px) - Sticky */}
        {hasSidebar && (
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            <div className="sticky top-0 h-screen">
              {sidebar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
