
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  Calendar,
  FileText,
  Activity,
  Download
} from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Certificates",
      value: "1,247",
      change: "+12%",
      trend: "up",
      icon: Award
    },
    {
      title: "Active Events",
      value: "8",
      change: "+2",
      trend: "up",
      icon: Calendar
    },
    {
      title: "Participants",
      value: "3,492",
      change: "+18%",
      trend: "up",
      icon: Users
    },
    {
      title: "Verifications Today",
      value: "156",
      change: "+24%",
      trend: "up",
      icon: Activity
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: "Certificate issued",
      user: "Sarah Johnson",
      event: "Web Development Course",
      time: "2 hours ago"
    },
    {
      id: 2,
      action: "Bulk certificates generated",
      user: "Admin",
      event: "Data Science Bootcamp",
      time: "4 hours ago"
    },
    {
      id: 3,
      action: "Event created",
      user: "Mike Chen",
      event: "AI/ML Workshop Series",
      time: "6 hours ago"
    },
    {
      id: 4,
      action: "Certificate verified",
      user: "Anonymous",
      event: "Digital Marketing Course",
      time: "8 hours ago"
    }
  ];

  return (
    <SidebarProvider collapsedWidth={56}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 h-full">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <Card key={stat.title} className="glassmorphic dark:glassmorphic-dark border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-brand-green/10">
                        <stat.icon className="h-5 w-5 text-brand-green" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stat.change}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-brand-green" />
                      <span>Recent Activity</span>
                    </CardTitle>
                    <CardDescription>
                      Latest actions and system events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {activity.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.user} • {activity.event}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-brand-navy" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-brand-green to-brand-navy justify-start">
                      <Award className="h-4 w-4 mr-2" />
                      Issue Certificates
                    </Button>
                    
                    <Button variant="outline" className="w-full h-12 rounded-xl justify-start hover:bg-brand-green/5">
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                    
                    <Button variant="outline" className="w-full h-12 rounded-xl justify-start hover:bg-brand-green/5">
                      <Users className="h-4 w-4 mr-2" />
                      Add Participants
                    </Button>
                    
                    <Button variant="outline" className="w-full h-12 rounded-xl justify-start hover:bg-brand-green/5">
                      <FileText className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  </CardContent>
                </Card>
                
                {/* System Status */}
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">API Status</span>
                      <Badge className="bg-brand-green/10 text-brand-green">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Database</span>
                      <Badge className="bg-brand-green/10 text-brand-green">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Storage</span>
                      <Badge variant="secondary">78% Used</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
