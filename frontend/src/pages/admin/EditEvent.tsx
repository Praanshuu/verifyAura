import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { PageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuthToken } from "@/hooks/useAuthToken";
import { getEventById, updateEvent } from "@/features/events/api";
import { LoadingState } from "@/components/LoadingState";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar, Tag, Link2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, loading: tokenLoading } = useAuthToken();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventData, setEventData] = useState({
    event_name: "",
    event_code: "",
    date: "",
    description: "",
    tag: "",
    google_sheet_url: "",
    sync_status: "pending" as "pending" | "synced" | "failed"
  });

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!token || !id) return;
      
      try {
        setLoading(true);
        const event = await getEventById(id, token);
        
        // Format date for input field
        const formattedDate = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
        
        setEventData({
          event_name: event.event_name || "",
          event_code: event.event_code || "",
          date: formattedDate,
          description: event.description || "",
          tag: event.tag || "",
          google_sheet_url: event.google_sheet_url || "",
          sync_status: event.sync_status || "pending"
        });
      } catch (error) {
        console.error("Error fetching event:", error);
        toast({
          title: "Error",
          description: "Failed to load event details. Please try again.",
          variant: "destructive"
        });
        navigate("/admin/events");
      } finally {
        setLoading(false);
      }
    };

    if (!tokenLoading) {
      fetchEvent();
    }
  }, [id, token, tokenLoading, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !id) return;
    
    // Validation
    if (!eventData.event_name || !eventData.event_code || !eventData.date) {
      toast({
        title: "Validation Error",
        description: "Event name, code, and date are required fields.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      await updateEvent(id, eventData, token);
      
      toast({
        title: "Success",
        description: "Event updated successfully!",
      });
      
      // Navigate back to events list
      navigate("/admin/events");
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || tokenLoading) {
    return <LoadingState title="Loading event details..." description="Please wait while we fetch the event information" />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <PageHeader
            title="Edit Event"
            subtitle="Update event details and settings"
            rightContent={
              <Button
                variant="ghost"
                onClick={() => navigate("/admin/events")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Events
              </Button>
            }
          />
          
          <div className="flex-1 p-4 md:p-6 space-y-6">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Event Information</CardTitle>
                  <CardDescription>
                    Update the basic information about this event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="event_name">
                      Event Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="event_name"
                      value={eventData.event_name}
                      onChange={(e) => handleInputChange("event_name", e.target.value)}
                      placeholder="Enter event name"
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* Event Code */}
                  <div className="space-y-2">
                    <Label htmlFor="event_code">
                      Event Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="event_code"
                      value={eventData.event_code}
                      onChange={(e) => handleInputChange("event_code", e.target.value.toUpperCase())}
                      placeholder="e.g., EVT2024"
                      required
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      This code is used for certificate generation
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Event Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date">
                        Event Date <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="date"
                          type="date"
                          value={eventData.date}
                          onChange={(e) => handleInputChange("date", e.target.value)}
                          className="pl-10"
                          required
                          disabled={saving}
                        />
                      </div>
                    </div>

                    {/* Tag */}
                    <div className="space-y-2">
                      <Label htmlFor="tag">
                        Event Tag
                      </Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="tag"
                          value={eventData.tag}
                          onChange={(e) => handleInputChange("tag", e.target.value)}
                          placeholder="e.g., workshop, seminar"
                          className="pl-10"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={eventData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter event description"
                      rows={4}
                      disabled={saving}
                    />
                  </div>

                  {/* Google Sheet URL */}
                  <div className="space-y-2">
                    <Label htmlFor="google_sheet_url">
                      Google Sheet URL
                    </Label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="google_sheet_url"
                        type="url"
                        value={eventData.google_sheet_url}
                        onChange={(e) => handleInputChange("google_sheet_url", e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/..."
                        className="pl-10"
                        disabled={saving}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used for importing participants from Google Sheets
                    </p>
                  </div>

                  {/* Sync Status */}
                  <div className="space-y-2">
                    <Label htmlFor="sync_status">
                      Sync Status
                    </Label>
                    <Select
                      value={eventData.sync_status}
                      onValueChange={(value) => handleInputChange("sync_status", value)}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sync status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="synced">Synced</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/events")}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="min-w-[100px]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EditEvent;
