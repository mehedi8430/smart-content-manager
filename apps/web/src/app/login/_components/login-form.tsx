"use client";

import { loginAction } from "@/actions/auth.action";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginInput } from "@/validations/auth.shema";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { Eye, EyeOff, MoveRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "demo@smartcontent.test",
      password: "Password123!",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await loginAction(data);

      if (result.error) {
        setFormError("root", { message: result.error });
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      if (result.success) {
        if (result.user?.user?.id) Sentry.setUser({ id: result.user.user.id });
        toast.success(result.message || "Login successful");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-7", className)} {...props}>
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to your Smart Content Manager workspace.
        </p>
      </div>

      <form
        className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup>
          {errors.root && (
            <div role="alert" className="text-center text-sm text-destructive">
              {errors.root.message}
            </div>
          )}
          <Field>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                className="pr-10"
                {...register("password")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </Field>
          <Field>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0d9e98] to-[#08716d] font-semibold text-white hover:from-[#0b8984] hover:to-[#075d5a]"
            >
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && <MoveRight className="ml-2 size-4" />}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#087d79] underline-offset-4 hover:underline dark:text-[#54c9c1]"
            >
              Create one
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>

      <p className="px-2 text-center text-xs leading-5 text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
