"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarCollapseButtonProps {
  collapsed: boolean;
  onClick: () => void;
  className?: string;
}

export function SidebarCollapseButton({
  collapsed,
  onClick,
  className,
}: SidebarCollapseButtonProps) {
  return (
    <div className="relative sidebar-collapse-button hidden md:block">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          className
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
