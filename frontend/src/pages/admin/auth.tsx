// frontend/src/pages/admin/auth.tsx

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Mail, Eye, EyeOff } from "lucide-react";
import { useSignIn, useSignUp, useUser } from '@clerk/clerk-react';
import { SignIn, SignUp } from '@clerk/clerk-react';

const Auth = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/admin', { replace: true });
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header showAdminButton={false} />
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="glassmorphic dark:glassmorphic-dark border-0 shadow-2xl rounded-2xl p-6">
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid grid-cols-2 w-full h-12 p-1 bg-muted/50 rounded-2xl mb-6">
                <TabsTrigger value="login" className="rounded-xl font-medium">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl font-medium">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <SignIn
                  appearance={{
                    elements: {
                      card: 'bg-transparent shadow-none border-0',
                      formButtonPrimary: 'w-full h-12 rounded-xl bg-gradient-to-r from-brand-green to-brand-navy font-semibold',
                      headerTitle: 'text-2xl font-bold',
                      headerSubtitle: 'text-muted-foreground',
                    },
                  }}
                  path="/auth"
                  routing="path"
                  signUpUrl="/auth?tab=signup"
                />
              </TabsContent>
              <TabsContent value="signup">
                <SignUp
                  appearance={{
                    elements: {
                      card: 'bg-transparent shadow-none border-0',
                      formButtonPrimary: 'w-full h-12 rounded-xl bg-gradient-to-r from-brand-green to-brand-navy font-semibold',
                      headerTitle: 'text-2xl font-bold',
                      headerSubtitle: 'text-muted-foreground',
                    },
                  }}
                  path="/auth"
                  routing="path"
                  signInUrl="/auth?tab=login"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
