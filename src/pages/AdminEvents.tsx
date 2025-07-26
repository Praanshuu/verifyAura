import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Award,
  Filter,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const events = [
    {
      id: 1,
      name: "Web Development Bootcamp",
      description: "Complete full-stack web development course",
      startDate: "2024-01-15",
      endDate: "2024-03-15",
      status: "Active",
      participants: 45,
      certificates: 32,
      category: "Technology"
    },
    {
      id: 2,
      name: "Data Science Workshop",
      description: "Introduction to data analysis and machine learning",
      startDate: "2024-02-01",
      endDate: "2024-02-28",
      status: "Completed",
      participants: 28,
      certificates: 28,
      category: "Data Science"
    },
    {
      id: 3,
      name: "Digital Marketing Course",
      description: "Modern digital marketing strategies and tools",
      startDate: "2024-03-01",
      endDate: "2024-04-30",
      status: "Upcoming",
      participants: 0,
      certificates: 0,
      category: "Marketing"
    },
    {
      id: 4,
      name: "UI/UX Design Masterclass",
      description: "Advanced user interface and experience design",
      startDate: "2024-02-15",
      endDate: "2024-03-30",
      status: "Active",
      participants: 22,
      certificates: 15,
      category: "Design"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: "bg-brand-green/10 text-brand-green",
      Completed: "bg-blue-500/10 text-blue-600",
      Upcoming: "bg-orange-500/10 text-orange-600"
    };
    return variants[status as keyof typeof variants] || "bg-gray-500/10 text-gray-600";
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <h1 className="text-xl font-bold text-foreground">Events Management</h1>
                  <p className="text-sm text-muted-foreground">Manage your events and courses</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button className="rounded-xl bg-gradient-to-r from-brand-green to-brand-navy">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
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

            {/* Events Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {event.category}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                      {event.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusBadge(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Start Date:</span>
                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>End Date:</span>
                        <span>{new Date(event.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.participants}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Award className="h-4 w-4" />
                        <span>{event.certificates}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminEvents;