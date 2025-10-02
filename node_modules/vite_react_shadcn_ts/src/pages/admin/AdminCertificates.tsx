import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Award, 
  Plus, 
  Search, 
  Download, 
  Eye,
  Filter,
  Calendar,
  User,
  FileText,
  CheckCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminCertificates = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const certificates = [
    {
      id: "CERT-2024-001",
      recipientName: "Sarah Johnson",
      recipientEmail: "sarah.johnson@email.com",
      eventName: "Web Development Bootcamp",
      issueDate: "2024-03-15",
      status: "Issued",
      template: "Professional",
      verificationCount: 3
    },
    {
      id: "CERT-2024-002",
      recipientName: "Mike Chen",
      recipientEmail: "mike.chen@email.com",
      eventName: "Data Science Workshop",
      issueDate: "2024-02-28",
      status: "Issued",
      template: "Standard",
      verificationCount: 1
    },
    {
      id: "CERT-2024-003",
      recipientName: "Emily Rodriguez",
      recipientEmail: "emily.rodriguez@email.com",
      eventName: "Web Development Bootcamp",
      issueDate: "2024-03-14",
      status: "Issued",
      template: "Professional",
      verificationCount: 5
    },
    {
      id: "CERT-2024-004",
      recipientName: "David Wilson",
      recipientEmail: "david.wilson@email.com",
      eventName: "UI/UX Design Masterclass",
      issueDate: "2024-03-10",
      status: "Draft",
      template: "Premium",
      verificationCount: 0
    },
    {
      id: "CERT-2024-005",
      recipientName: "Lisa Anderson",
      recipientEmail: "lisa.anderson@email.com",
      eventName: "Digital Marketing Course",
      issueDate: "2024-03-12",
      status: "Issued",
      template: "Standard",
      verificationCount: 2
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      Issued: "bg-brand-green/10 text-brand-green",
      Draft: "bg-orange-500/10 text-orange-600",
      Revoked: "bg-red-500/10 text-red-600"
    };
    return variants[status as keyof typeof variants] || "bg-gray-500/10 text-gray-600";
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 h-full">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Certificates Management</h1>
                  <p className="text-sm text-muted-foreground">Issue and manage digital certificates</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Bulk Export
                </Button>
                <Button className="rounded-xl bg-gradient-to-r from-brand-green to-brand-navy">
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Certificate
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-brand-green/10">
                      <Award className="h-5 w-5 text-brand-green" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {certificates.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Certificates</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {certificates.filter(c => c.status === "Issued").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Issued</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-orange-500/10">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {certificates.filter(c => c.status === "Draft").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-purple-500/10">
                      <Eye className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {certificates.reduce((acc, c) => acc + c.verificationCount, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Verifications</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by certificate ID, recipient, or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Button variant="outline" className="rounded-xl">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Certificates Table */}
            <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Certificates</CardTitle>
                <CardDescription>
                  Manage issued certificates and track verifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verifications</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((certificate) => (
                      <TableRow key={certificate.id}>
                        <TableCell className="font-mono text-sm">
                          {certificate.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{certificate.recipientName}</div>
                            <div className="text-sm text-muted-foreground">
                              {certificate.recipientEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{certificate.eventName}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{certificate.template}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(certificate.status)}>
                            {certificate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span>{certificate.verificationCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminCertificates;