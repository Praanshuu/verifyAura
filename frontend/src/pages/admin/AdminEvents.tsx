import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { LoadingState } from "@/components/LoadingState";

import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Award,
  Filter,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/AdminPageHeader";
import { SearchFilterBar } from "@/components/SearchFilterBar";

const AdminEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    tag: "",
    event_status: undefined as "upcoming" | "ongoing" | "ended" | undefined,
    sort_by: "created_at",
    sort_order: "desc" as "asc" | "desc",
  });

  const { events, loading, error, pagination, refreshEvents } = useEvents({
    page: currentPage,
    limit: 12,
    search: filters.search,
    tag: filters.tag,
    event_status: filters.event_status,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      upcoming: "bg-orange-500/10 text-orange-600",
      ongoing: "bg-brand-green/10 text-brand-green",
      ended: "bg-blue-500/10 text-blue-600"
    };
    return variants[status as keyof typeof variants] || "bg-gray-500/10 text-gray-600";
  };

  // Update filters when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <PageHeader
            title="Events Management"
            subtitle="Manage your events and courses"
            rightContent={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={refreshEvents}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  asChild
                  className="rounded-xl bg-gradient-to-r from-brand-green to-brand-navy"
                >
                  <Link to="/admin/events/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
                <ThemeToggle />
              </>
            }
          />

          
          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <SearchFilterBar
                search={{
                  value: searchTerm,
                  onChange: setSearchTerm,
                  placeholder: "Search events...",
                }}
                filters={[
                  {
                    value: filters.event_status || "all",
                    onChange: (value) => handleFilterChange({ 
                      event_status: value === "all" ? undefined : value as "upcoming" | "ongoing" | "ended" 
                    }),
                    placeholder: "Status",
                    options: [
                      { label: "All Status", value: "all" },
                      { label: "Upcoming", value: "upcoming" },
                      { label: "Ongoing", value: "ongoing" },
                      { label: "Ended", value: "ended" },
                    ],
                  },
                  {
                    value: filters.sort_by,
                    onChange: (value) => handleFilterChange({ sort_by: value }),
                    placeholder: "Sort By",
                    options: [
                      { label: "Created Date", value: "created_at" },
                      { label: "Event Name", value: "event_name" },
                      { label: "Event Code", value: "event_code" },
                      { label: "Event Date", value: "date" },
                    ],
                  },
                ]}
              />
            </div>

            {/* Events Grid */}
            {loading ? (
              <LoadingState />
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={refreshEvents} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <Link to={`/admin/events/${event.id}`} key={event.id} className="block">
                    <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{event.event_name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {event.tag || 'No Tag'}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/events/${event.id}`} className="flex items-center">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Event
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CardDescription className="text-sm">
                          {event.description || 'No description available'}
                        </CardDescription>
                        
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusBadge(event.status)}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Event Date:</span>
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Event Code:</span>
                            <span className="font-mono text-xs">{event.event_code}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{event.participant_count}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Award className="h-4 w-4" />
                            <span>{event.certificate_count}</span>
                          </div>
                        </div>
                      </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {pagination.totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminEvents;