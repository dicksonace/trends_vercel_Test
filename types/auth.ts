// Authentication API Types

export interface LoginRequest {
  identity: string; // Can be email, username, or phone number
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  name?: string;
  success?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
  name?: string;
  success?: boolean;
  message?: string;
}

export interface CheckUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  message?: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface ResendOTPRequest {
  email: string;
}

export interface ResendOTPResponse {
  success: boolean;
  message?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleLoginResponse {
  token: string;
  user: User;
  name?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  verified?: boolean;
  [key: string]: any;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  error?: string;
  status?: number;
}
