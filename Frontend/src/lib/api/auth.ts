import { getJson, postJson } from "@/lib/api/client";

export type LoginInput = {
  email: string;
  password: string;
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

export async function loginWeb(input: LoginInput) {
  return postJson<LoginResponse, LoginInput>("/api/auth/login", input, {
    credentials: "include",
  });
}