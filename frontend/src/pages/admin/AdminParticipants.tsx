import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllParticipants, ParticipantWithEvent } from "@/features/participants/api";
import { LoadingState } from "@/components/LoadingState";
import { Link } from "react-router-dom";
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone,
  Calendar,
  Award,
  Filter,
  Download,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/DataTable";

const AdminParticipants = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [participants, setParticipants] = useState<ParticipantWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllParticipants();
      setParticipants(data.participants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch participants');
    } finally {
      setLoading(false);
    }
  };

  // Fetch participants on component mount
  useEffect(() => {
    fetchParticipants();
  }, []);

  const getStatusBadge = (revoked: boolean) => {
    return revoked 
      ? "bg-red-500/10 text-red-600"
      : "bg-brand-green/10 text-brand-green";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <h1 className="text-xl font-bold text-foreground">Participants Management</h1>
                  <p className="text-sm text-muted-foreground">Manage learners and their progress</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl"
                  onClick={fetchParticipants}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button className="rounded-xl bg-gradient-to-r from-brand-green to-brand-navy" asChild>
                  <Link to="/admin/events">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Participant
                  </Link>
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
                      <Users className="h-5 w-5 text-brand-green" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {participants.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {participants.filter(p => !p.revoked).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Certificates</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-orange-500/10">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {participants.filter(p => !p.revoked).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Learners</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-red-500/10">
                      <Users className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {participants.filter(p => p.revoked).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Revoked Certificates</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search participants..."
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

            {/* Participants Table */}
            {loading ? (
              <LoadingState />
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchParticipants} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Participants List</CardTitle>
                </CardHeader>
                <CardContent>
                <DataTable
                  columns={[
                    "Participant",
                    "Contact",
                    "Event",
                    "Certificate ID",
                    "Status",
                    "Created Date",
                    "",
                  ]}
                  rows={filteredParticipants}
                  renderRow={(participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-brand-green/10 text-brand-green">
                              {getInitials(participant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{participant.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{participant.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {participant.event_name}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {participant.event_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{participant.certificate_id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(participant.revoked)}>
                          {participant.revoked ? "Revoked" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(participant.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Send Message</DropdownMenuItem>
                            <DropdownMenuItem>
                              {participant.revoked ? "Restore Certificate" : "Revoke Certificate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )}
                />
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminParticipants;