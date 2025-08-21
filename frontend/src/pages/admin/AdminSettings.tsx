import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Save, 
  Globe, 
  Mail, 
  Shield, 
  Palette,
  Database,
  Bell,
  Key,
  Upload
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    organizationName: "VerifyAura",
    organizationWebsite: "https://verifyaura.com",
    organizationEmail: "contact@verifyaura.com",
    organizationLogo: "",
    
    // Certificate Settings
    defaultTemplate: "professional",
    autoIssue: true,
    requireApproval: false,
    certificateExpiry: false,
    expiryMonths: 12,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    apiAccess: true,
    auditLogs: true,
    
    // Email Settings
    emailNotifications: true,
    emailProvider: "smtp",
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    
    // System Settings
    maintenanceMode: false,
    backupFrequency: "daily",
    dataRetention: 365,
    systemTimezone: "UTC"
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Handle settings save
    console.log("Saving settings:", settings);
  };

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
                  <h1 className="text-xl font-bold text-foreground">System Settings</h1>
                  <p className="text-sm text-muted-foreground">Configure system preferences and settings</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button onClick={handleSave} className="rounded-xl bg-gradient-to-r from-brand-green to-brand-navy">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-brand-green" />
                      <span>Organization Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure your organization's basic information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                          id="orgName"
                          value={settings.organizationName}
                          onChange={(e) => handleSettingChange("organizationName", e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgWebsite">Website</Label>
                        <Input
                          id="orgWebsite"
                          value={settings.organizationWebsite}
                          onChange={(e) => handleSettingChange("organizationWebsite", e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgEmail">Contact Email</Label>
                      <Input
                        id="orgEmail"
                        type="email"
                        value={settings.organizationEmail}
                        onChange={(e) => handleSettingChange("organizationEmail", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgLogo">Organization Logo</Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="orgLogo"
                          type="file"
                          accept="image/*"
                          className="rounded-xl"
                        />
                        <Button variant="outline" className="rounded-xl">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certificates" className="space-y-6">
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-5 w-5 text-brand-green" />
                      <span>Certificate Configuration</span>
                    </CardTitle>
                    <CardDescription>
                      Set default certificate templates and issuance rules
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultTemplate">Default Template</Label>
                      <Select value={settings.defaultTemplate} onValueChange={(value) => handleSettingChange("defaultTemplate", value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto-issue certificates</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically issue certificates when events are completed
                          </p>
                        </div>
                        <Switch
                          checked={settings.autoIssue}
                          onCheckedChange={(checked) => handleSettingChange("autoIssue", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require approval</Label>
                          <p className="text-sm text-muted-foreground">
                            Require admin approval before issuing certificates
                          </p>
                        </div>
                        <Switch
                          checked={settings.requireApproval}
                          onCheckedChange={(checked) => handleSettingChange("requireApproval", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Certificate expiry</Label>
                          <p className="text-sm text-muted-foreground">
                            Set certificates to expire after a certain period
                          </p>
                        </div>
                        <Switch
                          checked={settings.certificateExpiry}
                          onCheckedChange={(checked) => handleSettingChange("certificateExpiry", checked)}
                        />
                      </div>
                    </div>
                    
                    {settings.certificateExpiry && (
                      <div className="space-y-2">
                        <Label htmlFor="expiryMonths">Expiry Period (months)</Label>
                        <Input
                          id="expiryMonths"
                          type="number"
                          value={settings.expiryMonths}
                          onChange={(e) => handleSettingChange("expiryMonths", parseInt(e.target.value))}
                          className="rounded-xl w-32"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-brand-green" />
                      <span>Security Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure security and access controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Two-factor authentication</Label>
                          <p className="text-sm text-muted-foreground">
                            Require 2FA for admin accounts
                          </p>
                        </div>
                        <Switch
                          checked={settings.twoFactorAuth}
                          onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>API access</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow external API access to the system
                          </p>
                        </div>
                        <Switch
                          checked={settings.apiAccess}
                          onCheckedChange={(checked) => handleSettingChange("apiAccess", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Audit logs</Label>
                          <p className="text-sm text-muted-foreground">
                            Keep detailed logs of all system activities
                          </p>
                        </div>
                        <Switch
                          checked={settings.auditLogs}
                          onCheckedChange={(checked) => handleSettingChange("auditLogs", checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                        className="rounded-xl w-32"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="space-y-6">
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-brand-green" />
                      <span>Email Configuration</span>
                    </CardTitle>
                    <CardDescription>
                      Configure email settings and SMTP server
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send email notifications for important events
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                      />
                    </div>
                    
                    {settings.emailNotifications && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="smtpHost">SMTP Host</Label>
                            <Input
                              id="smtpHost"
                              value={settings.smtpHost}
                              onChange={(e) => handleSettingChange("smtpHost", e.target.value)}
                              className="rounded-xl"
                              placeholder="smtp.gmail.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtpPort">SMTP Port</Label>
                            <Input
                              id="smtpPort"
                              value={settings.smtpPort}
                              onChange={(e) => handleSettingChange("smtpPort", e.target.value)}
                              className="rounded-xl"
                              placeholder="587"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="smtpUsername">SMTP Username</Label>
                            <Input
                              id="smtpUsername"
                              value={settings.smtpUsername}
                              onChange={(e) => handleSettingChange("smtpUsername", e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtpPassword">SMTP Password</Label>
                            <Input
                              id="smtpPassword"
                              type="password"
                              value={settings.smtpPassword}
                              onChange={(e) => handleSettingChange("smtpPassword", e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="system" className="space-y-6">
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-brand-green" />
                      <span>System Configuration</span>
                    </CardTitle>
                    <CardDescription>
                      Configure system-wide settings and maintenance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Maintenance mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to restrict system access
                        </p>
                      </div>
                      <Switch
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="backupFrequency">Backup Frequency</Label>
                        <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange("backupFrequency", value)}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="systemTimezone">System Timezone</Label>
                        <Select value={settings.systemTimezone} onValueChange={(value) => handleSettingChange("systemTimezone", value)}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dataRetention">Data Retention (days)</Label>
                      <Input
                        id="dataRetention"
                        type="number"
                        value={settings.dataRetention}
                        onChange={(e) => handleSettingChange("dataRetention", parseInt(e.target.value))}
                        className="rounded-xl w-32"
                      />
                      <p className="text-sm text-muted-foreground">
                        How long to keep activity logs and system data
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminSettings;