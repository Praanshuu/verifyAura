
import { Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  showAdminButton?: boolean;
}

export const Header = ({ showAdminButton = true }: HeaderProps) => {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-brand-green to-brand-navy">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-green to-brand-navy bg-clip-text text-transparent">
            VerifyAura
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          {showAdminButton && (
            <Button 
              variant="outline" 
              size="sm"
              className="hidden sm:flex items-center space-x-2 hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-300"
            >
              <User className="h-4 w-4" />
              <span>Admin Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
