
import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { LoadingState } from "@/components/LoadingState";
import { VerificationResult } from "@/components/VerificationResult";
import { Footer } from "@/components/Footer";

// Mock data for demonstration
const mockCertificate = {
  id: "cert-001",
  recipientName: "Sarah Johnson",
  courseName: "Advanced Web Development Certification",
  issueDate: "March 15, 2024",
  status: "valid" as const,
  issuer: "TechEdu Institute",
  credentialId: "TI-2024-AWD-001"
};

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    certificate?: typeof mockCertificate;
  }>({ isValid: false });

  // This will be triggered from HeroSection - for now it's just a demo
  const handleVerification = (certificateId: string) => {
    setIsLoading(true);
    setShowResult(false);
    
    // Simulate API call
    setTimeout(() => {
      // Mock verification logic
      const isValid = certificateId.toLowerCase().includes("cert") || certificateId.includes("@");
      
      setVerificationResult({
        isValid,
        certificate: isValid ? mockCertificate : undefined
      });
      
      setIsLoading(false);
      setShowResult(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        
        {/* Results Section */}
        {(isLoading || showResult) && (
          <section className="py-12 border-t bg-muted/10">
            <div className="container mx-auto px-4 lg:px-8">
              {isLoading && <LoadingState />}
              
              {showResult && (
                <VerificationResult
                  certificate={verificationResult.certificate}
                  isValid={verificationResult.isValid}
                />
              )}
            </div>
          </section>
        )}
        
        {/* About Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Trusted Digital Verification
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our platform ensures the highest standards of digital trust through automated verification, 
                blockchain-secured records, and instant validation processes that protect both institutions and recipients.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-brand-green">99.9%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-brand-navy">50K+</div>
                  <div className="text-sm text-muted-foreground">Verified Certificates</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-brand-orange">24/7</div>
                  <div className="text-sm text-muted-foreground">System Availability</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
