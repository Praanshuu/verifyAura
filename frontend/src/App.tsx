
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/admin/auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminParticipants from "./pages/admin/AdminParticipants";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import EventDetails from "./pages/admin/EventDetails";
import AdminCreateEvent from "./pages/admin/AdminCreateEvent";
import AdminAddParticipant from "./pages/admin/AdminAddParticipant";

const queryClient = new QueryClient();

const App = () => (
  <>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <SignedIn>
                  <AdminDashboard />
                </SignedIn>
              }
            />
            <Route
              path="/admin/events"
              element={
                <SignedIn>
                  <AdminEvents />
                </SignedIn>
              }
            />
            <Route 
              path="/admin/events/create" 
              element={
                <SignedIn>
                  <AdminCreateEvent />
                </SignedIn>
              } 
            />
            <Route 
              path="/admin/events/:id" 
              element={
                <SignedIn>
                  <EventDetails />
                </SignedIn>
              } 
            />
            <Route 
              path="/admin/events/:id/add-participant" 
              element={
                <SignedIn>
                  <AdminAddParticipant />
                </SignedIn>
              } 
            />
            <Route
              path="/admin/participants"
              element={
                <SignedIn>
                  <AdminParticipants />
                </SignedIn>
              }
            />
            <Route
              path="/admin/certificates"
              element={
                <SignedIn>
                  <AdminCertificates />
                </SignedIn>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <SignedIn>
                  <AdminLogs />
                </SignedIn>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <SignedIn>
                  <AdminSettings />
                </SignedIn>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </>
);

export default App;
