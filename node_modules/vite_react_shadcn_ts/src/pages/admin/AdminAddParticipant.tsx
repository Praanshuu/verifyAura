import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generateCertificateId } from "@/lib/generateCertificateId";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  ArrowLeft, 
  UserPlus,
  User,
  Mail,
  Calendar,
  Users,
  Upload,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getEventById } from "@/features/events/api";
import { createParticipant } from "@/features/participants/api";
import { useUser, useAuth } from '@clerk/clerk-react';

const participantSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

type ParticipantFormData = z.infer<typeof participantSchema>;

interface Participant {
  id: string;
  name: string;
  email: string;
  dateAdded: string;
}

const AdminAddParticipant = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { id: eventId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentParticipants, setRecentParticipants] = useState<Participant[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [eventCode, setEventCode] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");


  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Fetch event details on component mount
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        const event = await getEventById(eventId);
        setEventName(event?.event_name || "Unknown Event");
        setEventCode(event?.event_code || "");
        setEventDate(event?.date || "");

      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const checkForDuplicate = (name: string, email: string) => {
    const isDuplicate = recentParticipants.some(p => 
      p.email.toLowerCase() === email.toLowerCase() &&
      p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  
    if (isDuplicate) {
      setDuplicateWarning("This participant (name + email) is already registered for this event.");
    } else {
      setDuplicateWarning("");
    }
  
    return isDuplicate;
  };
  

  const onSubmit = async (data: ParticipantFormData) => {
    if (!user || !eventId) {
      toast({
        title: "Error",
        description: "You must be logged in and have a valid event ID.",
        variant: "destructive",
      });
      return;
    }
  
    if (checkForDuplicate(data.name, data.email)) {
      toast({
        title: "Duplicate Entry",
        description: "This participant is already registered for this event.",
        variant: "destructive",
      });
      return;
    }
  
    setIsSubmitting(true);
    // ✅ Fetch full event details (for code and date)
    try {
      const event = await getEventById(eventId);
      
      if (!event?.event_code || !event?.date) {
        toast({
          title: "Error",
          description: "Missing event info for generating certificate ID.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
  
      // ✅ Generate certificate ID using utility function
      const certificateId = generateCertificateId(event.event_code, event.date);
  
      const participantData = {
        event_id: eventId,
        name: data.name,
        email: data.email,
        certificate_id: certificateId,
        revoked: false,
      };
  
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const newParticipant = await createParticipant(participantData, token);
  
      const participantForDisplay: Participant = {
        id: newParticipant.id,
        name: newParticipant.name,
        email: newParticipant.email,
        dateAdded: newParticipant.created_at,
      };
  
      setRecentParticipants(prev => [participantForDisplay, ...prev.slice(0, 4)]);
  
      toast({
        title: "Participant Added",
        description: `${data.name} has been successfully added to ${event.event_name}.`,
      });
  
      form.reset();
      setDuplicateWarning("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add participant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleEmailChange = (email: string) => {
    const name = form.getValues("name");
    if (email.length > 0 && name.length > 0) {
      checkForDuplicate(name, email);
    } else {
      setDuplicateWarning("");
    }
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
                  <h1 className="text-xl font-bold text-foreground">
                    Add Participants to {eventName}
                  </h1>
                  <p className="text-sm text-muted-foreground">Manually add a participant or import a CSV</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/events/${eventId}`)}
                  className="rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Event
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading event details...</p>
                </div>
              </div>
            ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Event Info */}
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-brand-green/10">
                        <Users className="h-5 w-5 text-brand-green" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{eventName}</h3>
                        <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-brand-green/10 text-brand-green">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Participant Form */}
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-xl">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-brand-green to-brand-navy bg-clip-text text-transparent">
                      Add New Participant
                    </CardTitle>
                    <CardDescription>
                      Enter participant details to register them for this event
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name Field */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-brand-green" />
                                <span>Full Name</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., John Smith"
                                  className="rounded-xl"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter the participant's full name
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Email Field */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-brand-navy" />
                                <span>Email Address</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="e.g., john.smith@example.com"
                                  className={`rounded-xl ${duplicateWarning ? 'border-destructive' : ''}`}
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleEmailChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              {duplicateWarning && (
                                <div className="flex items-center space-x-2 text-destructive text-sm">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>{duplicateWarning}</span>
                                </div>
                              )}
                              <FormDescription>
                                This will be used for certificate delivery
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Current Date Display */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-brand-orange" />
                            <span>Registration Date</span>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-xl text-sm text-muted-foreground">
                            {new Date().toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isSubmitting || !!duplicateWarning}
                          className="w-full rounded-xl bg-gradient-to-r from-brand-green to-brand-navy hover:from-brand-green/90 hover:to-brand-navy/90 transition-all duration-300"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Adding Participant...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Participant
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>

                    {/* Bulk Import Option */}
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={() => toast({
                          title: "Coming Soon",
                          description: "CSV import functionality will be available soon.",
                        })}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import from CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Participants */}
                <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Recently Added</CardTitle>
                    <CardDescription>
                      Latest participants added to this event
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {recentParticipants.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Added</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentParticipants.map((participant) => (
                            <TableRow key={participant.id}>
                              <TableCell className="font-medium">
                                {participant.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {participant.email}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(participant.dateAdded).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No participants added yet</p>
                        <p className="text-sm">Add your first participant using the form</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminAddParticipant;
