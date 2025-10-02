
import { Search, CheckCircle, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface VerificationResult {
  valid: boolean;
  participant?: {
    name: string;
    email: string;
    event_name: string;
    event_code: string;
    certificate_id: string;
    created_at: string;
  };
}

export const HeroSection = () => {
  const [certificateId, setCertificateId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  
  const handleVerify = async () => {
    if (!certificateId.trim()) return;
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const result = await apiFetch<VerificationResult>('/api/certificates/verify', {
        method: 'POST',
        body: JSON.stringify({ certificateId: certificateId.trim() }),
      });
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({ valid: false });
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
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
                  disabled={isVerifying}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-brand-green to-brand-navy hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                >
                  {isVerifying ? "Verifying..." : "Verify Now"}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Verification Result */}
          {verificationResult && (
            <div className="max-w-md mx-auto mb-8">
              <div className={`glassmorphic dark:glassmorphic-dark rounded-2xl p-6 shadow-lg border-2 ${
                verificationResult.valid 
                  ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800' 
                  : 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800'
              }`}>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    verificationResult.valid 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : 'bg-red-100 dark:bg-red-900'
                  }`}>
                    {verificationResult.valid ? (
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Search className="h-6 w-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    verificationResult.valid 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {verificationResult.valid ? 'Certificate Valid' : 'Certificate Not Found'}
                  </h3>
                  {verificationResult.participant && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Name:</strong> {verificationResult.participant.name}</p>
                      <p><strong>Event:</strong> {verificationResult.participant.event_name}</p>
                      <p><strong>Issued:</strong> {new Date(verificationResult.participant.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
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
