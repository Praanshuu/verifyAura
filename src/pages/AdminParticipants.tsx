import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  MoreHorizontal
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

const AdminParticipants = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const participants = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
      avatar: "",
      events: ["Web Development Bootcamp", "UI/UX Design Masterclass"],
      certificates: 2,
      joinDate: "2024-01-15",
      status: "Active"
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike.chen@email.com",
      phone: "+1 (555) 234-5678",
      avatar: "",
      events: ["Data Science Workshop"],
      certificates: 1,
      joinDate: "2024-02-01",
      status: "Active"
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      phone: "+1 (555) 345-6789",
      avatar: "",
      events: ["Web Development Bootcamp", "Digital Marketing Course"],
      certificates: 1,
      joinDate: "2024-01-20",
      status: "Completed"
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david.wilson@email.com",
      phone: "+1 (555) 456-7890",
      avatar: "",
      events: ["UI/UX Design Masterclass"],
      certificates: 0,
      joinDate: "2024-02-15",
      status: "In Progress"
    },
    {
      id: 5,
      name: "Lisa Anderson",
      email: "lisa.anderson@email.com",
      phone: "+1 (555) 567-8901",
      avatar: "",
      events: ["Data Science Workshop", "Web Development Bootcamp"],
      certificates: 2,
      joinDate: "2024-01-10",
      status: "Active"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: "bg-brand-green/10 text-brand-green",
      Completed: "bg-blue-500/10 text-blue-600",
      "In Progress": "bg-orange-500/10 text-orange-600"
    };
    return variants[status as keyof typeof variants] || "bg-gray-500/10 text-gray-600";
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
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button className="rounded-xl bg-gradient-to-r from-brand-green to-brand-navy">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Participant
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
                    {participants.reduce((acc, p) => acc + p.certificates, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Certificates Earned</p>
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
                    {participants.filter(p => p.status === "Active").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Learners</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-green-500/10">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {participants.filter(p => p.status === "Completed").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Completed</p>
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
            <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Participants List</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Certificates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback className="bg-brand-green/10 text-brand-green">
                                {getInitials(participant.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{participant.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{participant.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{participant.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {participant.events.slice(0, 2).map((event, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {participant.events.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{participant.events.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-brand-green/10 text-brand-green">
                            {participant.certificates}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(participant.status)}>
                            {participant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(participant.joinDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Issue Certificate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

export default AdminParticipants;