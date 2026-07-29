import { Navigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "./AppLayout";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return <AppLayout>{children}</AppLayout>;
}
