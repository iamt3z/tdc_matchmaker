"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getStoredUser, clearStoredAuth } from "@/lib/api/client";
import type { AuthenticatedMatchmaker } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser<AuthenticatedMatchmaker>();

  function handleLogout() {
    clearStoredAuth();
    router.replace("/login");
  }

  const onCustomers =
    pathname.startsWith("/dashboard") || pathname.startsWith("/customers");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="text-[15px] font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
            >
              TDC Matchmaker
            </Link>
            <nav className="flex items-center" aria-label="Main">
              <Link
                href="/dashboard"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  onCustomers
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={onCustomers ? "page" : undefined}
              >
                <Users className="size-3.5" aria-hidden />
                Customers
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:inline">
                {user.displayName || user.username}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5 sm:mr-1.5" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sr-only sm:hidden">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="tdc-page">
        {(title || description) && (
          <header className="mb-6 sm:mb-8">
            {title && <h1 className="tdc-section-title text-2xl">{title}</h1>}
            {description && (
              <p className="tdc-section-desc max-w-2xl">{description}</p>
            )}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
