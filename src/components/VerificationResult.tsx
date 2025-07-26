
import { CertificateCard } from "@/components/CertificateCard";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Certificate {
  id: string;
  recipientName: string;
  courseName: string;
  issueDate: string;
  status: "valid" | "expired" | "revoked";
  issuer: string;
  credentialId: string;
}

interface VerificationResultProps {
  certificate?: Certificate;
  isValid: boolean;
}

export const VerificationResult = ({ certificate, isValid }: VerificationResultProps) => {
  if (!isValid || !certificate) {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Certificate Not Found</strong>
            <br />
            No valid certificate found for the provided ID or email. Please check your input and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleView = () => {
    console.log("Viewing certificate details:", certificate.id);
    // Modal/drawer logic will be added later
  };

  const handleDownload = () => {
    console.log("Downloading certificate:", certificate.id);
    // Download logic will be added later
  };

  return (
    <div className="max-w-md mx-auto">
      <CertificateCard
        certificate={certificate}
        onView={handleView}
        onDownload={handleDownload}
      />
    </div>
  );
};
