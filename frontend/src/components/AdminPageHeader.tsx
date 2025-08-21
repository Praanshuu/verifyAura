// components/layout/PageHeader.tsx

import { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  rightContent?: ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  backLink,
  rightContent,
}: PageHeaderProps) => {
  return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 h-full">
        {/* LEFT: Sidebar + Title Block */}
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="h-10 w-10" />
          {backLink && (
            <Link
              to={backLink}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* RIGHT: Page-specific actions */}
        <div className="flex items-center space-x-3">{rightContent}</div>
      </div>
    </header>
  );
};
