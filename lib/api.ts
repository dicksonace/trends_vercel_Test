// API Utility Functions for Trendshub Authentication
// Using Next.js API routes as proxy to avoid CORS issues

const API_BASE_URL = '/api/auth';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${path}`;
    
    console.log('API Request:', { url, method: options.method || 'GET', body: options.body });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('API Response Status:', response.status, response.statusText);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('API Response Data:', data);
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        console.error('Response status:', response.status);
        return {
          error: 'Invalid response from server',
          status: response.status,
        };
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response status:', response.status);
      return {
        error: 'Failed to parse server response',
        status: response.status,
      };
    }

    if (!response.ok) {
      console.error('API Error Response:', data);
      return {
        error: data.message || data.error || 'An error occurred',
        status: response.status,
      };
    }

    console.log('API Success Response:', data);
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
    };
  }
}

/**
 * Get authentication token from storage (cookies and localStorage)
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Try cookie first, then localStorage
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('trendshub_token='))
    ?.split('=')[1];
  return cookieToken || localStorage.getItem('trendshub_token');
}

/**
 * Set authentication token in storage (cookies and localStorage)
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  // Set in localStorage
  localStorage.setItem('trendshub_token', token);
  // Set in cookie (expires in 30 days)
  const expires = new Date();
  expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
  document.cookie = `trendshub_token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Remove authentication token from storage (cookies and localStorage)
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  // Remove from localStorage
  localStorage.removeItem('trendshub_token');
  // Remove cookie by setting it to expire in the past
  document.cookie = 'trendshub_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

/**
 * API request with authentication token
 */
async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}

// Authentication API Functions

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  CheckUsernameRequest,
  CheckUsernameResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  User,
} from '@/types/auth';

/**
 * Login with email/username and password
 */
export async function login(
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Register a new account
 */
export async function register(
  userData: RegisterRequest
): Promise<ApiResponse<RegisterResponse>> {
  const response = await apiRequest<RegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Check if username is available
 */
export async function checkUsername(
  username: string
): Promise<ApiResponse<CheckUsernameResponse>> {
  return apiRequest<CheckUsernameResponse>('/check-username', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

/**
 * Verify email with OTP
 */
export async function verifyOTP(
  otpData: VerifyOTPRequest
): Promise<ApiResponse<VerifyOTPResponse>> {
  const response = await apiRequest<VerifyOTPResponse>('/verify-otp', {
    method: 'POST',
    body: JSON.stringify(otpData),
  });

  if (response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Resend verification OTP
 */
export async function resendOTP(
  email: string
): Promise<ApiResponse<ResendOTPResponse>> {
  return apiRequest<ResendOTPResponse>('/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Logout (requires authentication)
 */
export async function logout(): Promise<ApiResponse<{ message: string }>> {
  const response = await authenticatedRequest<{ message: string }>('/logout', {
    method: 'POST',
  });

  // Always remove token, regardless of response status
  removeAuthToken();
  // Also clear from localStorage explicitly
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userName');
  }

  return response;
}

/**
 * Login with Google ID token
 */
export async function googleLogin(
  idToken: string
): Promise<ApiResponse<GoogleLoginResponse>> {
  const response = await apiRequest<GoogleLoginResponse>('/google-login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });

  if (response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Request password reset (forgot password)
 */
export async function forgotPassword(
  email: string
): Promise<ApiResponse<ForgotPasswordResponse>> {
  return apiRequest<ForgotPasswordResponse>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password with token
 */
export async function resetPassword(
  resetData: ResetPasswordRequest
): Promise<ApiResponse<ResetPasswordResponse>> {
  return apiRequest<ResetPasswordResponse>('/reset-password', {
    method: 'POST',
    body: JSON.stringify(resetData),
  });
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return authenticatedRequest<User>('/me', {
    method: 'GET',
  });
}
