
import { Search, CheckCircle, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const HeroSection = () => {
  const [certificateId, setCertificateId] = useState("");
  
  const handleVerify = () => {
    if (certificateId.trim()) {
      console.log("Verifying certificate:", certificateId);
      // Navigation logic will be added later
    }
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 via-transparent to-brand-navy/5"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-brand-green/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-brand-navy/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-brand-green to-brand-navy bg-clip-text text-transparent">
              Verify Certificates
            </span>
            <br />
            <span className="text-foreground">with Confidence</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Instantly validate the authenticity of certificates issued by trusted institutions. 
            Experience digital verification powered by cutting-edge technology.
          </p>
          
          {/* Verification Input */}
          <div className="max-w-md mx-auto mb-16">
            <div className="glassmorphic dark:glassmorphic-dark rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter Certificate ID or Email"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="w-full h-12 pl-4 pr-12 rounded-xl border-0 bg-background/50 backdrop-blur-sm focus:bg-background/80 transition-all duration-300"
                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <Button
                  onClick={handleVerify}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-brand-green to-brand-navy hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Verify Now
                </Button>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-3 group">
              <div className="p-4 rounded-2xl bg-brand-green/10 group-hover:bg-brand-green/20 transition-colors duration-300">
                <CheckCircle className="h-8 w-8 text-brand-green" />
              </div>
              <h3 className="font-semibold text-lg">Instant Verification</h3>
              <p className="text-sm text-muted-foreground text-center">Real-time certificate validation in seconds</p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 group">
              <div className="p-4 rounded-2xl bg-brand-navy/10 group-hover:bg-brand-navy/20 transition-colors duration-300">
                <Globe className="h-8 w-8 text-brand-navy" />
              </div>
              <h3 className="font-semibold text-lg">Global Access</h3>
              <p className="text-sm text-muted-foreground text-center">Verify certificates from anywhere, anytime</p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 group">
              <div className="p-4 rounded-2xl bg-brand-orange/10 group-hover:bg-brand-orange/20 transition-colors duration-300">
                <Zap className="h-8 w-8 text-brand-orange" />
              </div>
              <h3 className="font-semibold text-lg">Secure & Fast</h3>
              <p className="text-sm text-muted-foreground text-center">Enterprise-grade security with lightning speed</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
