
import { Shield } from "lucide-react";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
interface HeaderProps {
  showAdminButton?: boolean;
}

export const Header = ({ showAdminButton = true }: HeaderProps) => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-brand-green to-brand-navy bg-clip-text text-transparent">
            <img src={"/Technohub_logo.png"} alt="Technohub Logo" className=" w-20 h-20" />
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          {isSignedIn && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center space-x-2 hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-300"
              onClick={() => navigate("/admin")}
            >
              <span>Admin Dashboard</span>
            </Button>
          )}
          <SignedOut>
            {showAdminButton && (
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="hidden sm:flex items-center space-x-2 rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-300"
                >
                  <span className="inline-block align-middle"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 17l-4 4m0 0l-4-4m4 4V3" /></svg></span>
                  <span>Admin Login</span>
                </button>
              </SignInButton>
            )}
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};
