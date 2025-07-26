import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  History, 
  Search, 
  Filter,
  Download,
  Eye,
  User,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const logs = [
    {
      id: 1,
      timestamp: "2024-03-15T14:30:00Z",
      action: "Certificate Issued",
      user: "Admin",
      target: "Sarah Johnson - Web Development Bootcamp",
      type: "success",
      ip: "192.168.1.100",
      details: "Certificate CERT-2024-001 issued successfully"
    },
    {
      id: 2,
      timestamp: "2024-03-15T14:25:00Z",
      action: "User Login",
      user: "admin@verifyaura.com",
      target: "Admin Dashboard",
      type: "info",
      ip: "192.168.1.100",
      details: "Successful admin login"
    },
    {
      id: 3,
      timestamp: "2024-03-15T13:45:00Z",
      action: "Certificate Verified",
      user: "Anonymous",
      target: "CERT-2024-002",
      type: "info",
      ip: "203.0.113.45",
      details: "Certificate verification by external user"
    },
    {
      id: 4,
      timestamp: "2024-03-15T13:30:00Z",
      action: "Event Created",
      user: "Admin",
      target: "Digital Marketing Course",
      type: "success",
      ip: "192.168.1.100",
      details: "New event created with 30 participant slots"
    },
    {
      id: 5,
      timestamp: "2024-03-15T12:15:00Z",
      action: "Failed Login Attempt",
      user: "unknown@email.com",
      target: "Admin Login",
      type: "warning",
      ip: "198.51.100.42",
      details: "Invalid credentials provided"
    },
    {
      id: 6,
      timestamp: "2024-03-15T11:00:00Z",
      action: "Bulk Certificate Generation",
      user: "Admin",
      target: "Data Science Workshop",
      type: "success",
      ip: "192.168.1.100",
      details: "28 certificates generated for workshop completion"
    },
    {
      id: 7,
      timestamp: "2024-03-15T10:30:00Z",
      action: "System Backup",
      user: "System",
      target: "Database",
      type: "info",
      ip: "127.0.0.1",
      details: "Automated daily backup completed"
    },
    {
      id: 8,
      timestamp: "2024-03-15T09:45:00Z",
      action: "Participant Added",
      user: "Admin",
      target: "Emily Rodriguez",
      type: "success",
      ip: "192.168.1.100",
      details: "New participant enrolled in Web Development Bootcamp"
    }
  ];

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getLogBadge = (type: string) => {
    const variants = {
      success: "bg-green-500/10 text-green-600",
      warning: "bg-orange-500/10 text-orange-600",
      error: "bg-red-500/10 text-red-600",
      info: "bg-blue-500/10 text-blue-600"
    };
    return variants[type as keyof typeof variants] || "bg-gray-500/10 text-gray-600";
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || log.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

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
                  <h1 className="text-xl font-bold text-foreground">Activity Logs</h1>
                  <p className="text-sm text-muted-foreground">Monitor system activities and user actions</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
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
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {logs.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {logs.filter(l => l.type === "success").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Successful Actions</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-orange-500/10">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {logs.filter(l => l.type === "warning").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-purple-500/10">
                      <History className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    24h
                  </div>
                  <p className="text-sm text-muted-foreground">Recent Activity</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warnings</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity Logs Table */}
            <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
              <CardHeader>
                <CardTitle>System Activity Log</CardTitle>
                <CardDescription>
                  Chronological list of system activities and user actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getLogIcon(log.type)}
                            <span className="font-medium">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{log.user}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.target}
                        </TableCell>
                        <TableCell>
                          <Badge className={getLogBadge(log.type)}>
                            {log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ip}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-muted-foreground">
                            {log.details}
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

export default AdminLogs;