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
import { getEventById, Event, syncParticipantsFromGoogleSheet, SyncResult } from "@/features/events/api";
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const participantsPerPage = 10;

  // Fetch event data
  const fetchEvent = async () => {
    if (!id) return;
    
    try {
      const token = await getToken();
      const eventData = await getEventById(id, token || undefined);
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch event');
    }
  };

  // Fetch participants data
  const fetchParticipants = async () => {
    if (!id) return;
    
    try {
      const token = await getToken();
      const response = await getParticipantsByEvent(id, 1, 1000, token || undefined);
      setParticipants(response.data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchEvent(), fetchParticipants()]);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // Handle Google Sheets sync
  const handleSyncGoogleSheet = async () => {
    if (!event || !id) return;
    
    // Get URL from user or use existing
    let url = event.google_sheet_url;
    if (!url) {
      url = prompt("Enter Google Apps Script URL:");
      if (!url) return;
    }
    
    setIsSyncing(true);
    
    try {
      const token = await getToken();
      const response = await syncParticipantsFromGoogleSheet(id, url, token || undefined);
      
      if (response.success && response.data) {
        const { imported, updated, skipped, errors } = response.data;
        
        // Show detailed results
        toast({
          title: "✅ Sync Completed Successfully",
          description: `Imported: ${imported}, Updated: ${updated}, Skipped: ${skipped}${errors > 0 ? `, Errors: ${errors}` : ''}`,
          duration: 5000,
        });

        // Log the action
        if (user) {
          await logAdminAction(
            token || '',
            user.id,
            user.primaryEmailAddress?.emailAddress || '',
            'participants_synced',
            {
              event_id: id,
              event_name: event.event_name,
              imported,
              updated,
              skipped,
              errors,
              google_sheet_url: url
            }
          );
        }

        // Refresh participants list to show new data
        await fetchParticipants();
      } else {
        toast({
          title: "❌ Sync Failed",
          description: response.message || "Failed to sync participants from Google Sheets",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during sync",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = () => {
    toast({
      title: "Export Started",
      description: "Your CSV file will be downloaded shortly.",
    });
  };

  const handleRevokeCertificate = async (participantId: string) => {
    setIsLoading(true);
    try {
      // Add revoke logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Certificate Revoked",
        description: "The certificate has been successfully revoked.",
      });
      await fetchParticipants();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke certificate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                  disabled={isSyncing}
                >
                  {isSyncing ? (
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
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No participants found</p>
                    <p className="text-muted-foreground text-sm">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search filters"
                        : "Add participants to this event to get started"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <DataTable
                      columns={["Name", "Email", "Certificate ID", "Status", "Actions"]}
                      rows={paginatedParticipants}
                      renderRow={(participant) => (
                        <ParticipantRow
                          key={participant.id}
                          participant={participant}
                          onRevoke={() => handleRevokeCertificate(participant.id)}
                          onUnrevoke={() => handleRevokeCertificate(participant.id)}
                        />
                      )}
                    />
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-2">
                        <p className="text-sm text-muted-foreground">
                          Showing {startIndex + 1} to {Math.min(startIndex + participantsPerPage, filteredParticipants.length)} of {filteredParticipants.length} participants
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm px-3">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
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
