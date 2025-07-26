
import { Download, ExternalLink, Calendar, Award, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Certificate {
  id: string;
  recipientName: string;
  courseName: string;
  issueDate: string;
  status: "valid" | "expired" | "revoked";
  issuer: string;
  credentialId: string;
}

interface CertificateCardProps {
  certificate: Certificate;
  onView: () => void;
  onDownload: () => void;
}

export const CertificateCard = ({ certificate, onView, onDownload }: CertificateCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-brand-green/10 text-brand-green border-brand-green/20";
      case "expired":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "revoked":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <Calendar className="h-4 w-4" />;
      case "revoked":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  return (
    <div className="glassmorphic dark:glassmorphic-dark rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-brand-green to-brand-navy">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">{certificate.courseName}</h3>
            <p className="text-sm text-muted-foreground">{certificate.issuer}</p>
          </div>
        </div>
        
        <Badge className={`${getStatusColor(certificate.status)} font-medium`}>
          {getStatusIcon(certificate.status)}
          <span className="ml-1 capitalize">{certificate.status}</span>
        </Badge>
      </div>

      {/* Content */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Recipient:</span>
          <span className="font-medium text-foreground">{certificate.recipientName}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Issued on:</span>
          <span className="font-medium text-foreground">{certificate.issueDate}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Award className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">ID:</span>
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{certificate.credentialId}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onView}
          variant="outline"
          className="flex-1 rounded-xl hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-300"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </Button>
        
        <Button
          onClick={onDownload}
          className="flex-1 rounded-xl bg-gradient-to-r from-brand-green to-brand-navy hover:shadow-lg transition-all duration-300"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};
