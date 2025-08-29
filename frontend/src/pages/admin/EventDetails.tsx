import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getEventById, createEvent, Event } from "@/features/events/api";
import { getParticipantsByEvent, ParticipantWithEvent } from "@/features/participants/api";
import { logAdminAction } from "@/features/logs/api";
import { LoadingState } from "@/components/LoadingState";
import { 
  Users, 
  Download, 
  FileSpreadsheet,
  RefreshCw,
  Clock,
  Calendar
} from "lucide-react";
import { PageHeader } from "@/components/AdminPageHeader";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { DataTable } from "@/components/DataTable";
import { ParticipantRow } from "@/components/ParticipantRow";
import { getEventStatusBadge } from "@/lib/utils/status";
import { formatDateTime } from "@/lib/utils/date";

const EventDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const participantsPerPage = 10;

  // Fetch event and participants data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const token = await getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }
        
        // Fetch event details
        const eventResponse = await getEventById(id, token);
        setEvent(eventResponse);
        
        // Fetch participants
        const participantsResponse = await getParticipantsByEvent(id, 1, 1000, token); // Get all participants
        setParticipants(participantsResponse.data || []);
        
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event data');
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, getToken, toast]);

  const handleCertificateAction = async (participantId: string, action: "revoke" | "unrevoke") => {
    setIsLoading(true);
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Import the API functions
      const { revokeCertificate, restoreCertificate } = await import("@/features/participants/api");
      
      // Call the appropriate API function
      if (action === "revoke") {
        await revokeCertificate(token, participantId, "Admin action");
      } else {
        await restoreCertificate(token, participantId);
      }
      
      // Refresh participants data
      if (id) {
        const participantsResponse = await getParticipantsByEvent(id, 1, 1000, token);
        setParticipants(participantsResponse.data || []);
      }
      
      // Log the action
      await logAdminAction(
        token,
        user?.id || "admin",
        user?.emailAddresses[0]?.emailAddress || "admin@verifyaura.com",
        action === "revoke" ? "Certificate Revoked" : "Certificate Restored",
        { participantId, action }
      );
      
      toast({
        title: action === "revoke" ? "Certificate Revoked" : "Certificate Restored",
        description: action === "revoke" 
          ? "The certificate has been successfully revoked." 
          : "The certificate has been successfully restored.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update certificate status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncGoogleSheet = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Google Sheet Synced",
      description: "Participant data has been successfully synchronized.",
    });
    
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    toast({
      title: "Export Started",
      description: "Your CSV file will be downloaded shortly.",
    });
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = 
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.certificate_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !participant.revoked) ||
      (statusFilter === "revoked" && participant.revoked);
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredParticipants.length / participantsPerPage);
  const startIndex = (currentPage - 1) * participantsPerPage;
  const paginatedParticipants = filteredParticipants.slice(startIndex, startIndex + participantsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
          <AdminSidebar />
          <div className="flex-1 p-6">
            <LoadingState />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !event) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
          <AdminSidebar />
          <div className="flex-1 p-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <PageHeader
            title="Event Details"
            subtitle="Manage event participants and certificates"
            backLink="/admin/events"
            rightContent={
              <>
                <Button
                  className="rounded-xl bg-gradient-to-r from-brand-green to-brand-navy"
                  asChild
                >
                  <Link to={`/admin/events/${id}/add-participant`}>
                    <Users className="h-4 w-4 mr-2" />
                    Add Participants
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleSyncGoogleSheet}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Sync Google Sheet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleExportCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <ThemeToggle />
              </>
            }
          />

          
          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Event Details Section */}
            <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{event.event_name}</CardTitle>
                    <CardDescription className="text-base max-w-2xl">
                      {event.description || 'No description available'}
                    </CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>Event Code: {event.event_code}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Created {formatDate(event.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getEventStatusBadge(event.sync_status)}>
                    {event.sync_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-brand-green">{participants.length}</div>
                    <div className="text-sm text-muted-foreground">Total Participants</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-brand-navy">{participants.filter(p => !p.revoked).length}</div>
                    <div className="text-sm text-muted-foreground">Active Certificates</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-accent">{participants.filter(p => p.revoked).length}</div>
                    <div className="text-sm text-muted-foreground">Revoked Certificates</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">{event.tag || 'No Tag'}</div>
                    <div className="text-sm text-muted-foreground">Event Tag</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants Table Section */}
            <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-brand-green" />
                      <span>Participants</span>
                    </CardTitle>
                    <CardDescription>
                      Manage participant certificates and status
                    </CardDescription>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <SearchFilterBar
                    search={{
                      value: searchTerm,
                      onChange: setSearchTerm,
                      placeholder: "Search participants...",
                    }}
                    filters={[
                      {
                        value: statusFilter,
                        onChange: setStatusFilter,
                        placeholder: "Status",
                        options: [
                          { label: "All Status", value: "all" },
                          { label: "Active", value: "active" },
                          { label: "Revoked", value: "revoked" },
                        ],
                      },
                    ]}
                  />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {paginatedParticipants.length === 0 ? (
                  // Empty State
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="p-4 rounded-full bg-muted/30">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-medium">No participants found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search or filter criteria." 
                          : "No participants have been added to this event yet."}
                      </p>
                    </div>
                    {(!searchTerm && statusFilter === "all") && (
                      <p className="text-muted-foreground text-sm text-center max-w-md">
                      You can add a participant manually or import them from Google Sheets using the options above.
                    </p>
                    )}
                  </div>
                ) : (
                  <>
                    <DataTable
                      columns={["Name", "Email", "Certificate ID", "Status", "Created Date", "Actions"]}
                      rows={paginatedParticipants}
                      renderRow={(participant) => (
                        <ParticipantRow
                          key={participant.id}
                          participant={participant}
                          onRevoke={(id) => handleCertificateAction(id, "revoke")}
                          onUnrevoke={(id) => handleCertificateAction(id, "unrevoke")}
                        />
                      )}
                      pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: setCurrentPage,
                        itemsLabel: "participants",
                        startIndex,
                        pageSize: participantsPerPage,
                        totalItems: filteredParticipants.length,
                      }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EventDetails;