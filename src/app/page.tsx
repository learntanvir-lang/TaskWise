// src/app/page.tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Dashboard } from "@/components/dashboard";
import { LoginPage } from "@/components/login-page";
import { FullPageLoader } from "@/components/full-page-loader";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Dashboard user={user} />;
}
