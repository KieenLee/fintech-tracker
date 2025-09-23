const API_URL = "http://localhost:5013/api/Auth/login";

export async function login({
  email,
  username,
  password,
}: {
  email?: string;
  username?: string;
  password: string;
}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Login failed");
  }
  return res.json();
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface ResendOtpResponse {
  message: string;
  email: string;
}

export interface PendingRegistration {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}
