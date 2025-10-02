import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Calendar as CalendarIcon, 
  ArrowLeft, 
  Plus,
  FileText,
  Tag,
  Link,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { createEvent } from "@/features/events/api";
import { useUser } from '@clerk/clerk-react';

const eventSchema = z.object({
  eventName: z.string().min(1, "Event name is required").min(3, "Event name must be at least 3 characters"),
  eventCode: z.string().min(1, "Event code is required").min(2, "Event code must be at least 2 characters"),
  description: z.string().min(1, "Description is required").min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  googleSheetUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type EventFormData = z.infer<typeof eventSchema>;

const AdminCreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      eventName: "",
      eventCode: "",
      description: "",
      category: "",
      googleSheetUrl: "",
    },
  });

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        event_name: data.eventName,
        event_code: data.eventCode,
        description: data.description,
        tag: data.category,
        date: data.startDate.toISOString(),
        google_sheet_url: data.googleSheetUrl || null,
        sync_status: 'pending' as const,
        created_by: user.id,
      };

      await createEvent(eventData);
      
      toast({
        title: "Event Created Successfully",
        description: `${data.eventName} has been created and is ready for participants.`,
      });
      
      navigate("/admin/events");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.reset();
    toast({
      title: "Form Reset",
      description: "All fields have been cleared.",
    });
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
                  <h1 className="text-xl font-bold text-foreground">Create a New Event</h1>
                  <p className="text-sm text-muted-foreground">Provide event details to start issuing certificates</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/events")}
                  className="rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Events
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6 flex justify-center">
            <div className="w-full max-w-2xl space-y-6">
              <Card className="glassmorphic dark:glassmorphic-dark border-0 shadow-xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-brand-green to-brand-navy bg-clip-text text-transparent">
                    Event Information
                  </CardTitle>
                  <CardDescription>
                    Fill in the details below to create your new event
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Event Name */}
                      <FormField
                        control={form.control}
                        name="eventName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-brand-green" />
                              <span>Event Name</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Web Development Bootcamp"
                                className="rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Choose a clear, descriptive name for your event
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Event Code */}
                      <FormField
                        control={form.control}
                        name="eventCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Tag className="h-4 w-4 text-brand-navy" />
                              <span>Event Code</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., WDB2024"
                                className="rounded-xl font-mono"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              A unique identifier for this event (letters, numbers, dashes allowed)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Provide a detailed description of the event, what participants will learn, and any prerequisites..."
                                className="rounded-xl min-h-[100px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Describe the event goals, content, and what participants can expect
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Category */}
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Tag className="h-4 w-4 text-brand-orange" />
                              <span>Category / Tag</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Technology, Design, Marketing"
                                className="rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Help organize events by topic or department
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Start Date */}
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center space-x-2">
                              <CalendarIcon className="h-4 w-4 text-brand-green" />
                              <span>Start Date</span>
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal rounded-xl",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When does this event begin?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Google Sheet URL */}
                      <FormField
                        control={form.control}
                        name="googleSheetUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Link className="h-4 w-4 text-brand-navy" />
                              <span>Google Sheet URL (Optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className="rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Link to a Google Sheet with participant data or additional event information
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 rounded-xl bg-gradient-to-r from-brand-green to-brand-navy hover:from-brand-green/90 hover:to-brand-navy/90 transition-all duration-300"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Creating Event...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Event
                            </>
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleReset}
                          disabled={isSubmitting}
                          className="rounded-xl"
                        >
                          Reset Form
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminCreateEvent;
