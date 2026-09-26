"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { registerSchema } from "@/lib/validations/auth";

type RegisterValues = z.input<typeof registerSchema>;
type FieldErrors = Partial<Record<keyof RegisterValues, string>>;

interface RegisterResponse {
  success: boolean;
  data?: { emailSent: boolean };
  error?: string;
}

const INITIAL_VALUES: RegisterValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error);
      setFieldErrors({
        name: errors.name?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        confirmPassword: errors.confirmPassword?.[0],
      });
      return;
    }
    setFieldErrors({});
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: RegisterResponse = await response.json();

      if (!result.success) {
        setFormError(result.error ?? "Registration failed. Please try again.");
        return;
      }
      router.push(`/sign-in?registered=${result.data?.emailSent ? "1" : "email-failed"}`);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField id="name" label="Name" autoComplete="name" value={values.name}
        onChange={handleChange} error={fieldErrors.name} />
      <FormField id="email" label="Email" type="email" autoComplete="email"
        value={values.email} onChange={handleChange} error={fieldErrors.email} />
      <FormField id="password" label="Password" type="password" autoComplete="new-password"
        value={values.password} onChange={handleChange} error={fieldErrors.password} />
      <FormField id="confirmPassword" label="Confirm password" type="password"
        autoComplete="new-password" value={values.confirmPassword} onChange={handleChange}
        error={fieldErrors.confirmPassword} />
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
