
import { Shield, Mail, Twitter, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-brand-green to-brand-navy">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-brand-green to-brand-navy bg-clip-text text-transparent">
                VerifyAura
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering digital trust through secure certificate verification. 
              Built for institutions that value transparency and authenticity.
            </p>
          </div>
          
          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Get in Touch</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@verifyaura.com</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Questions about verification? We're here to help.
              </p>
            </div>
          </div>
          
          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Connect</h3>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-brand-green/10">
                <Twitter className="h-4 w-4 text-muted-foreground hover:text-brand-green transition-colors" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-brand-green/10">
                <Github className="h-4 w-4 text-muted-foreground hover:text-brand-green transition-colors" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-brand-green/10">
                <Linkedin className="h-4 w-4 text-muted-foreground hover:text-brand-green transition-colors" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 VerifyAura. All rights reserved. Built with precision and care.</p>
        </div>
      </div>
    </footer>
  );
};
