import { getJson, postJson } from "@/lib/api/client";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  identityDocumentType: "CEDULA_CIUDADANIA" | "CEDULA_EXTRANJERIA" | "PASAPORTE" | "NIT";
  identityDocument: string;
  playerCategory: "TERCERA" | "SEGUNDA" | "PRIMERA" | "ELITE";
};

export type AuthenticatedUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export type LoginResponse = {
  ok: boolean;
  user: AuthenticatedUser;
};

export type CurrentSessionResponse = LoginResponse;

export type LogoutResponse = {
  ok: boolean;
  message: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ForgotPasswordResponse = {
  ok: boolean;
  message: string;
  data?: {
    resetToken?: string;
    expiresAt?: string;
    resetUrl?: string;
    emailSent?: boolean;
  };
};

export type ResetPasswordInput = {
  token: string;
  password: string;
};

export type ResetPasswordResponse = {
  ok: boolean;
  message: string;
};

export type RegisterResponse = {
  ok: boolean;
  data: {
    id?: string;
    name?: string;
    email?: string;
    identityDocumentType?: string;
    identityDocument?: string;
    role?: string;
  };
};

export async function getCurrentSession() {
  return getJson<CurrentSessionResponse>("/api/auth/me", {
    credentials: "include",
  });
}

export async function logoutWeb() {
  return postJson<LogoutResponse, Record<string, never>>("/api/auth/logout", {}, {
    credentials: "include",
  });
}

export async function forgotPassword(input: ForgotPasswordInput) {
  return postJson<ForgotPasswordResponse, ForgotPasswordInput>("/api/auth/forgot-password", input);
}

export async function resetPassword(input: ResetPasswordInput) {
  return postJson<ResetPasswordResponse, ResetPasswordInput>("/api/auth/reset-password", input);
}

export async function registerWeb(input: RegisterInput) {
  return postJson<RegisterResponse, RegisterInput>("/api/auth/register", input);
}

export async function loginWeb(input: LoginInput) {
  return postJson<LoginResponse, LoginInput>("/api/auth/login", input, {
    credentials: "include",
  });
}