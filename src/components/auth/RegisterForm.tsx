"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { registerUser, type RegisterResult } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { FormError, SubmitButton } from "@/components/auth/FormMessages";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

type RegisterValues = RegisterInput;
type FieldErrors = Partial<Record<keyof RegisterValues, string>>;

// Tells the sign-in page which banner to show after registering
function getRegisteredStatus(data: RegisterResult["data"]) {
  if (!data?.verificationRequired) return "ready";
  return data.emailSent ? "1" : "email-failed";
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
      const result = await registerUser(values);

      if (result.rateLimited) {
        toast.error(result.error ?? "Too many attempts. Please try again later.");
        return;
      }
      if (!result.success) {
        setFormError(result.error ?? "Registration failed. Please try again.");
        return;
      }
      router.push(`/sign-in?registered=${getRegisteredStatus(result.data)}`);
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
      <FormError message={formError} />
      <SubmitButton pending={isPending} pendingLabel="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
}
