"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api/auth";
import { getApiErrorMessage, getStoredToken } from "@/lib/api/client";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter your username."),
  password: z.string().min(1, "Please enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    } satisfies LoginValues,
    onSubmit: async ({ value }) => {
      setFormError(null);
      const parsed = loginSchema.safeParse(value);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? "Invalid input");
        return;
      }
      try {
        await login(parsed.data.username, parsed.data.password);
        router.replace("/dashboard");
      } catch (error) {
        setFormError(
          getApiErrorMessage(error) ||
            "We could not sign you in. Check your credentials and try again.",
        );
      }
    },
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Soft warm wash behind the card */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.03_55)_0%,_transparent_55%)]"
        aria-hidden
      />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
            The Date Company
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Matchmaker sign in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A quiet workspace for reviewing profiles and considering
            introductions with care.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
            className="space-y-5"
            noValidate
          >
            <form.Field name="username">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Username</Label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id={field.name}
                      name={field.name}
                      autoComplete="username"
                      autoFocus
                      placeholder="Your username"
                      value={field.state.value}
                      disabled={form.state.isSubmitting}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="h-11 pl-10"
                      aria-invalid={Boolean(formError)}
                    />
                  </div>
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Password</Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={field.state.value}
                      disabled={form.state.isSubmitting}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="h-11 px-10"
                      aria-invalid={Boolean(formError)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form.Field>

            {formError && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{formError}</span>
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full text-[15px]"
              disabled={form.state.isSubmitting}
            >
              {form.state.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Access is limited to authorised matchmakers. Contact your
          administrator if you need an account.
        </p>
      </div>
    </div>
  );
}
