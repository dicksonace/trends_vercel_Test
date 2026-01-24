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
  GoogleSignupRequest,
  GoogleSignupResponse,
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
/**
 * Login with Google ID token (with CSRF token support)
 * Matches the pattern from googleSignup to call backend directly
 */
export async function googleLogin(
  idToken: string
): Promise<ApiResponse<GoogleLoginResponse>> {
  if (typeof window === 'undefined') {
    return {
      error: 'This function must be called from the client side',
      status: 0,
    };
  }

  // Get CSRF token from cookies
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const csrfToken = getCookie('XSRF-TOKEN');
  const sessionCookie = getCookie('session') || '';

  // Prepare headers with CSRF token if available
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
    headers['Cookie'] = `XSRF-TOKEN=${csrfToken};${sessionCookie ? `session=${sessionCookie}` : ''}`;
  }

  // Call backend directly from client to preserve origin
  // Note: Backend uses /google-signup for both login and signup
  const BACKEND_URL = 'https://www.trendshub.link';
  
  console.log('🚀 Calling Google Login API directly:', `${BACKEND_URL}/google-signup`);
  console.log('📤 Sending idToken:', idToken ? `${idToken.substring(0, 50)}...` : 'missing');
  console.log('🌐 Using /google-signup endpoint for both login and signup');
  
  // Validate token before sending
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    console.error('❌ Invalid idToken provided');
    return {
      error: 'Invalid Google token. Please try signing in again.',
      status: 0,
    };
  }
  
  // Check token format (JWT should have 3 parts separated by dots)
  const tokenParts = idToken.split('.');
  if (tokenParts.length !== 3) {
    console.error('❌ Invalid JWT format - token should have 3 parts');
    return {
      error: 'Invalid Google token format. Please try signing in again.',
      status: 0,
    };
  }

  // Backend uses /google-signup for both login and signup
  const response = await fetch(`${BACKEND_URL}/google-signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id_token: idToken }), // Use snake_case to match backend expectation
    credentials: 'include',
  });

  console.log('📥 Google login response status:', response.status);

  const contentType = response.headers.get('content-type');
  let data: GoogleLoginResponse;

  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response from Google login:', text);
      return {
        error: 'Invalid response from server',
        status: response.status,
      };
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    return {
      error: 'Failed to parse server response',
      status: response.status,
    };
  }

  if (!response.ok) {
    // Log the full error for debugging
    console.error('Google login error response:', {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    // For error responses, data might have different structure
    const errorData = data as any;
    
    // For 422, provide more detailed error information
    if (response.status === 422) {
      const errorMessage = errorData.error || errorData.message || (errorData as any)?.message || 'Unable to verify Google token. Please try again.';
      const errorDetails = errorData.details || errorData.errors || (errorData as any)?.fullError;
      
      console.error('422 Validation Error Details:', errorDetails);
      console.error('Full error response:', JSON.stringify(data, null, 2));
      
      // Provide a more user-friendly error message
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('Unable to verify Google token') || errorMessage.includes('verify')) {
        userFriendlyMessage = 'Unable to verify Google account. This may be a configuration issue. Please contact support if the problem persists.';
      }
      
      return {
        error: userFriendlyMessage,
        status: response.status,
      };
    }
    
    // For 400 errors, check if it's a token verification issue
    if (response.status === 400) {
      const errorMessage = errorData.error || errorData.message || (errorData as any)?.message || 'Invalid request';
      console.error('400 Bad Request Details:', JSON.stringify(data, null, 2));
      
      return {
        error: errorMessage.includes('token') || errorMessage.includes('verify') 
          ? 'Unable to verify Google account. Please try signing in again.'
          : errorMessage,
        status: response.status,
      };
    }
    
    return {
      error: errorData.error || errorData.message || (errorData as any)?.message || 'Google login failed. Please try again.',
      status: response.status,
    };
  }

  if (!data.success && !data.token) {
    return {
      error: (data as any).message || 'Google login failed',
      status: response.status,
    };
  }

  // Set token if present
  if (data.token) {
    setAuthToken(data.token);
    
    // Store user data
    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    if (data.name) {
      localStorage.setItem('userName', data.name);
    }
  }

  return {
    data,
    status: response.status,
  };
}

/**
 * Sign up with Google ID token (with CSRF token support)
 * Matches the pattern from your backend that requires CSRF tokens
 */
export async function googleSignup(
  id_token: string
): Promise<ApiResponse<GoogleSignupResponse>> {
  if (typeof window === 'undefined') {
    return {
      error: 'This function must be called from the client side',
      status: 0,
    };
  }

  // Get CSRF token from cookies
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const csrfToken = getCookie('XSRF-TOKEN');
  const sessionCookie = getCookie('session') || '';

  // Prepare headers with CSRF token if available
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
    headers['Cookie'] = `XSRF-TOKEN=${csrfToken};${sessionCookie ? `session=${sessionCookie}` : ''}`;
  }

  // Call backend directly from client (like original code) to preserve origin
  // This avoids origin issues when proxying through Next.js API route
  const BACKEND_URL = 'https://www.trendshub.link';
  
  console.log('🚀 Calling Google Signup API directly:', `${BACKEND_URL}/google-signup`);
  console.log('📤 Sending id_token:', id_token ? `${id_token.substring(0, 50)}...` : 'missing');
  console.log('🌐 Calling backend directly from client to preserve origin');
  
  // Validate token before sending
  if (!id_token || typeof id_token !== 'string' || id_token.trim().length === 0) {
    console.error('❌ Invalid id_token provided');
    return {
      error: 'Invalid Google token. Please try signing in again.',
      status: 0,
    };
  }
  
  // Check token format (JWT should have 3 parts separated by dots)
  const tokenParts = id_token.split('.');
  if (tokenParts.length !== 3) {
    console.error('❌ Invalid JWT format - token should have 3 parts');
    return {
      error: 'Invalid Google token format. Please try signing in again.',
      status: 0,
    };
  }
  
  const response = await fetch(`${BACKEND_URL}/google-signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id_token }),
    credentials: 'include',
  });

  console.log('📥 Google signup response status:', response.status);

  const contentType = response.headers.get('content-type');
  let data: GoogleSignupResponse;

  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response from Google signup:', text);
      return {
        error: 'Invalid response from server',
        status: response.status,
      };
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    return {
      error: 'Failed to parse server response',
      status: response.status,
    };
  }

  if (!response.ok) {
    // Log the full error for debugging
    console.error('Google signup error response:', {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    // For error responses, data might have different structure
    const errorData = data as any;
    
    // For 422, provide more detailed error information
    if (response.status === 422) {
      // Try multiple paths to find the error message
      const errorMessage = errorData.error || errorData.message || (errorData as any)?.message || 'Unable to verify Google token. Please try again.';
      const errorDetails = errorData.details || errorData.errors || (errorData as any)?.fullError;
      
      console.error('422 Validation Error Details:', errorDetails);
      console.error('Full error response:', JSON.stringify(data, null, 2));
      
      // Provide a more user-friendly error message
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('Unable to verify Google token') || errorMessage.includes('verify')) {
        userFriendlyMessage = 'Unable to verify Google account. This may be a configuration issue. Please contact support if the problem persists.';
      }
      
      return {
        error: userFriendlyMessage,
        status: response.status,
      };
    }
    
    // For 400 errors, check if it's a token verification issue
    if (response.status === 400) {
      const errorMessage = errorData.error || errorData.message || (errorData as any)?.message || 'Invalid request';
      console.error('400 Bad Request Details:', JSON.stringify(data, null, 2));
      
      return {
        error: errorMessage.includes('token') || errorMessage.includes('verify') 
          ? 'Unable to verify Google account. Please try signing in again.'
          : errorMessage,
        status: response.status,
      };
    }
    
    return {
      error: errorData.error || errorData.message || (errorData as any)?.message || 'Google signup failed. Please try again.',
      status: response.status,
    };
  }

  if (!data.success) {
    return {
      error: data.message || 'Google signup failed',
      status: response.status,
    };
  }

  // Set token if present
  if (data.token) {
    setAuthToken(data.token);
    
    // Store user data
    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      if (data.user.name) {
        localStorage.setItem('userName', data.user.name);
      }
    }
  }

  // Fetch user details after successful signup (optional, if needed)
  if (data.token && data.user) {
    // User data is already in the response, but you can fetch additional details if needed
    try {
      const userResponse = await getCurrentUser();
      if (userResponse.data) {
        localStorage.setItem('currentUser', JSON.stringify(userResponse.data));
      }
    } catch (error) {
      console.warn('Could not fetch additional user details:', error);
      // Not critical, we already have user data from signup response
    }
  }

  return {
    data,
    status: response.status,
  };
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

// ============================================
// Direct Backend API Functions
// These call the backend directly (https://www.trendshub.link)
// ============================================

const BACKEND_BASE_URL = 'https://www.trendshub.link';

/**
 * Make authenticated request directly to backend
 */
async function backendRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (typeof window === 'undefined') {
    return {
      error: 'This function must be called from the client side',
      status: 0,
    };
  }

  const token = getAuthToken();
  const url = `${BACKEND_BASE_URL}${endpoint}`;

  console.log('=== backendRequest ===');
  console.log('URL:', url);
  console.log('Method:', options.method || 'GET');
  console.log('Has Token:', !!token);
  console.log('Token Preview:', token ? `${token.substring(0, 20)}...` : 'No token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('Request Headers:', JSON.stringify(headers, null, 2));
  if (options.body) {
    const bodyPreview = typeof options.body === 'string' 
      ? (options.body.length > 500 ? `${options.body.substring(0, 500)}... (truncated)` : options.body)
      : options.body;
    console.log('Request Body Preview:', bodyPreview);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    console.log('Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response Text (non-JSON):', text);
      return {
        error: 'Invalid response from server',
        status: response.status,
      };
    }

    if (!response.ok) {
      console.error('❌ Response not OK:', response.status);
      console.error('Error Data:', JSON.stringify(data, null, 2));
      return {
        error: data.message || data.error || 'An error occurred',
        status: response.status,
        data,
      };
    }

    console.log('✅ Response OK');
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    console.error('❌ Network Error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
    };
  }
}

// ============================================
// Compose / Create Post API
// ============================================

export interface ComposeTrendRequest {
  text: string;
  images?: string[];
  video_file?: string;
}

export interface ComposeTrendResponse {
  success: boolean;
  message?: string;
  post?: any;
}

export async function composeTrend(
  data: ComposeTrendRequest
): Promise<ApiResponse<ComposeTrendResponse>> {
  return backendRequest<ComposeTrendResponse>('/api/v1/compose-trend', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// Feed API
// ============================================

export interface FeedPost {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  images?: string[];
  video_file?: string;
  likes: number;
  retweets: number;
  replies: number;
  liked: boolean;
  retweeted: boolean;
  bookmarked?: boolean;
  timestamp: string;
  poll?: {
    options: string[];
    votes: number[];
    duration: string;
    endTime: string;
  };
}

export interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
}

export async function fetchFeed(
  type: 'for-you' | 'following' | 'trending',
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<any>> {
  console.log('=== fetchFeed API Call ===');
  console.log('Type:', type);
  console.log('Page:', page);
  console.log('PageSize:', pageSize);
  console.log('Method: GET');
  
  // Try different endpoint formats based on the backend implementation
  // Backend function is forYouTrends, so try various route formats
  // Laravel routes can be: camelCase, kebab-case, or snake_case
  const endpoints = [
    `/api/v1/forYouTrends?page=${page}&pageSize=${pageSize}`,  // Try camelCase: forYouTrends (matches function name)
    `/api/v1/for-you-trends?page=${page}&pageSize=${pageSize}`,  // Try kebab-case: for-you-trends
    `/api/v1/for_you_trends?page=${page}&pageSize=${pageSize}`,  // Try snake_case: for_you_trends
    `/api/v1/${type}-trends?page=${page}&pageSize=${pageSize}`,  // Dynamic: for-you-trends
    `/api/v1/${type}?page=${page}&pageSize=${pageSize}`,  // Simple: /api/v1/for-you?page=1&pageSize=20
    `/api/v1/feed/${type}?page=${page}&pageSize=${pageSize}`,  // Alternative format
    `/api/v1/fetch-feed/${type}?page=${page}&pageSize=${pageSize}`,  // Another alternative
  ];
  
  let response: ApiResponse<any> = { status: 404, error: 'Endpoint not found' };
  
  for (const endpoint of endpoints) {
    console.log('Trying endpoint:', endpoint);
    console.log('Full URL will be: https://www.trendshub.link' + endpoint);
    
    response = await backendRequest<any>(endpoint, {
      method: 'GET',
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data) {
      console.log('✅ Successfully fetched from:', endpoint);
      break; // Exit loop if successful
    } else if (response.status !== 404) {
      // If it's an error other than 404, break and report it
      console.error(`❌ Error fetching from ${endpoint}:`, response.error);
      break;
    } else {
      console.warn(`⚠️ Endpoint ${endpoint} returned 404.`);
    }
  }
  
  if (response.status === 404) {
    console.warn('❌ All endpoint formats returned 404.');
    console.warn('Please verify with backend team the correct endpoint for feed type:', type);
  }
  
  console.log('=== fetchFeed END ===');
  
  return response;
}

export async function fetchUserTrends(
  username: string
): Promise<ApiResponse<FeedResponse>> {
  console.log('=== fetchUserTrends API Call ===');
  console.log('Endpoint: /api/v1/fetch-user-trends/' + username);
  console.log('Username:', username);
  console.log('Method: GET');
  
  const response = await backendRequest<FeedResponse>(`/api/v1/fetch-user-trends/${username}`, {
    method: 'GET',
  });
  
  console.log('fetchUserTrends Response Status:', response.status);
  console.log('fetchUserTrends Response Data:', JSON.stringify(response.data, null, 2));
  console.log('fetchUserTrends Response Error:', response.error);
  console.log('=== fetchUserTrends END ===');
  
  return response;
}

export async function fetchBitsForYou(
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<FeedResponse>> {
  console.log('=== fetchBitsForYou API Call ===');
  console.log('Endpoint: /api/v1/fetch-bits-for-you');
  console.log('Page:', page);
  console.log('PageSize:', pageSize);
  console.log('Method: GET');
  
  // Try with pagination parameters
  const endpoints = [
    `/api/v1/fetch-bits-for-you?page=${page}&pageSize=${pageSize}`,  // With pagination
    `/api/v1/fetch-bits-for-you`,  // Without pagination (fallback)
  ];
  
  let response: ApiResponse<FeedResponse> = { status: 404, error: 'Bits feed not found' };
  
  for (const endpoint of endpoints) {
    console.log('Trying bits endpoint:', endpoint);
    response = await backendRequest<FeedResponse>(endpoint, {
      method: 'GET',
    });
    
    if (response.status === 200 && response.data) {
      console.log('✅ Successfully fetched bits from:', endpoint);
      break;
    } else if (response.status !== 404) {
      console.error(`❌ Error fetching bits from ${endpoint}:`, response.error);
      break;
    }
  }
  
  console.log('fetchBitsForYou Response Status:', response.status);
  console.log('fetchBitsForYou Response Data:', JSON.stringify(response.data, null, 2));
  console.log('fetchBitsForYou Response Error:', response.error);
  console.log('=== fetchBitsForYou END ===');
  
  return response;
}

export interface SearchTrendsRequest {
  query: string;
  page?: number;
}

export async function searchTrends(
  data: SearchTrendsRequest
): Promise<ApiResponse<FeedResponse>> {
  console.log('=== searchTrends API Call ===');
  console.log('Endpoint: /api/v1/search-trends');
  console.log('Method: POST');
  console.log('Request Data:', JSON.stringify(data, null, 2));
  
  const response = await backendRequest<FeedResponse>('/api/v1/search-trends', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  console.log('searchTrends Response Status:', response.status);
  console.log('searchTrends Response Data:', JSON.stringify(response.data, null, 2));
  console.log('searchTrends Response Error:', response.error);
  console.log('=== searchTrends END ===');
  
  return response;
}

export async function fetchHashtag(
  hashtag: string
): Promise<ApiResponse<FeedResponse>> {
  console.log('=== fetchHashtag API Call ===');
  console.log('Endpoint: /api/v1/fetch-hashtag/' + hashtag);
  console.log('Hashtag:', hashtag);
  console.log('Method: GET');
  
  const response = await backendRequest<FeedResponse>(`/api/v1/fetch-hashtag/${hashtag}`, {
    method: 'GET',
  });
  
  console.log('fetchHashtag Response Status:', response.status);
  console.log('fetchHashtag Response Data:', JSON.stringify(response.data, null, 2));
  console.log('fetchHashtag Response Error:', response.error);
  console.log('=== fetchHashtag END ===');
  
  return response;
}

// ============================================
// Comments API
// ============================================

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  likes: number;
  replies: number;
  liked: boolean;
  timestamp: string;
}

export interface CommentsResponse {
  comments: Comment[];
}

export async function fetchComments(
  postId: string
): Promise<ApiResponse<CommentsResponse>> {
  return backendRequest<CommentsResponse>(`/api/v1/${postId}/comments`, {
    method: 'GET',
  });
}

export interface PostCommentRequest {
  content: string;
}

export interface PostCommentResponse {
  success: boolean;
  comment?: Comment;
  message?: string;
}

export async function postComment(
  postId: string,
  data: PostCommentRequest
): Promise<ApiResponse<PostCommentResponse>> {
  return backendRequest<PostCommentResponse>(`/api/v1/${postId}/post-comment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function likeComment(
  commentId: string
): Promise<ApiResponse<{ success: boolean; message?: string }>> {
  return backendRequest(`/api/v1/comments/${commentId}/like`, {
    method: 'POST',
  });
}

export async function deleteComment(
  commentId: string
): Promise<ApiResponse<{ success: boolean; message?: string }>> {
  return backendRequest(`/api/v1/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// ============================================
// Post / View Post API
// ============================================

export interface PostReactions {
  likes: number;
  retweets: number;
  replies: number;
  bookmarks: number;
}

/**
 * Fetch post reactions
 * GET /api/v1/trends/{postId}/reactions
 */
export async function fetchPostReactions(
  postId: string
): Promise<ApiResponse<PostReactions>> {
  return backendRequest<PostReactions>(`/api/v1/trends/${postId}/reactions`, {
    method: 'GET',
  });
}

/**
 * Fetch a single post by ID
 * Note: The GET endpoint for a single post is not explicitly documented.
 * We try /api/v1/trend/{postId} first (following the DELETE endpoint pattern),
 * then fallback to alternative formats if 404.
 * If all direct endpoints fail, we try fetching from the feed and searching for the post.
 */
export async function fetchPost(
  postId: string
): Promise<ApiResponse<any>> {
  console.log('=== fetchPost API Call ===');
  console.log('Post ID:', postId);
  console.log('Method: GET');
  
  // Try primary endpoint: /api/v1/trend/{postId} (following DELETE endpoint pattern)
  console.log('Trying endpoint: /api/v1/trend/' + postId);
  let response = await backendRequest(`/api/v1/trend/${postId}`, {
    method: 'GET',
  });
  
  console.log('fetchPost Response Status:', response.status);
  console.log('fetchPost Response Data:', JSON.stringify(response.data, null, 2));
  console.log('fetchPost Response Error:', response.error);
  
  // If 404, try alternative endpoints
  if (response.status === 404) {
    console.warn('⚠️ Endpoint /api/v1/trend/' + postId + ' returned 404. Trying alternative formats...');
    
    // Try alternative 1: /api/v1/posts/{postId}
    console.log('Trying alternative: /api/v1/posts/' + postId);
    const altResponse1 = await backendRequest(`/api/v1/posts/${postId}`, {
      method: 'GET',
    });
    
    if (altResponse1.status === 200) {
      console.log('✅ Alternative endpoint /api/v1/posts/' + postId + ' works!');
      response = altResponse1;
    } else {
      // Try alternative 2: /api/v1/post/{postId}
      console.log('Trying alternative: /api/v1/post/' + postId);
      const altResponse2 = await backendRequest(`/api/v1/post/${postId}`, {
        method: 'GET',
      });
      
      if (altResponse2.status === 200) {
        console.log('✅ Alternative endpoint /api/v1/post/' + postId + ' works!');
        response = altResponse2;
      } else {
        console.warn('❌ All direct endpoint formats returned 404. Trying to fetch from feed and search...');
        
        // Final fallback: Try fetching from feed and searching for the post
        // First try regular feed
        const feedResponse = await fetchFeed('for-you');
        if (feedResponse.status === 200 && feedResponse.data) {
          const posts = feedResponse.data.posts || (feedResponse.data as any).data || (feedResponse.data as any).trend || [];
          const foundPost = posts.find((p: any) => String(p.id) === String(postId));
          if (foundPost) {
            console.log('✅ Found post in fetched feed data as fallback!');
            return { status: 200, data: foundPost };
          }
        }
        
        // If regular feed didn't work, try bits feed
        console.log('⚠️ Post not found in regular feed. Trying bits feed...');
        const bitsResponse = await fetchBitsForYou();
        if (bitsResponse.status === 200 && bitsResponse.data) {
          const bits = bitsResponse.data.data || [];
          const foundBit = bits.find((b: any) => String(b.id) === String(postId));
          if (foundBit) {
            console.log('✅ Found post in bits feed as fallback!');
            return { status: 200, data: foundBit };
          }
        }
        
        console.warn('❌ Post not found in direct endpoints or feeds.');
        console.warn('Please verify with backend team that /api/v1/trend/{id} or /api/v1/posts/{id} is implemented.');
      }
    }
  }
  
  console.log('=== fetchPost END ===');
  
  return response;
}

/**
 * Delete a post
 * DELETE /api/v1/trend/{postId}
 */
export async function deletePost(
  postId: string
): Promise<ApiResponse<{ success: boolean; message?: string }>> {
  return backendRequest(`/api/v1/trend/${postId}`, {
    method: 'DELETE',
  });
}

// ============================================
// Bookmark API
// ============================================

/**
 * Toggle bookmark on a post
 * POST /api/v1/bookmark/{postId}
 */
export async function toggleBookmark(
  postId: string
): Promise<ApiResponse<{ success: boolean; bookmarked: boolean; message?: string }>> {
  return backendRequest(`/api/v1/bookmark/${postId}`, {
    method: 'POST',
  });
}

/**
 * Get bookmark status
 * GET /api/v1/bookmark-status/{postId}
 */
export async function getBookmarkStatus(
  postId: string
): Promise<ApiResponse<{ bookmarked: boolean }>> {
  return backendRequest(`/api/v1/bookmark-status/${postId}`, {
    method: 'GET',
  });
}

/**
 * Fetch all bookmarked posts
 * GET /api/v1/fetch-book-marks
 */
export async function fetchBookmarks(): Promise<ApiResponse<FeedResponse>> {
  return backendRequest<FeedResponse>('/api/v1/fetch-book-marks', {
    method: 'GET',
  });
}

// ============================================
// Likes / Reactions API
// ============================================

/**
 * React to a post (like)
 * POST /api/v1/react-to-post/{postId}
 */
export async function reactToPost(
  postId: string
): Promise<ApiResponse<{ success: boolean; liked: boolean; message?: string }>> {
  return backendRequest(`/api/v1/react-to-post/${postId}`, {
    method: 'POST',
  });
}

/**
 * Get like status
 * GET /api/v1/likes/status/{postId}
 */
export async function getLikeStatus(
  postId: string
): Promise<ApiResponse<{ liked: boolean }>> {
  return backendRequest(`/api/v1/likes/status/${postId}`, {
    method: 'GET',
  });
}

/**
 * Like a bit
 * POST /api/v1/bits/{bitId}/like
 */
export async function likeBit(
  bitId: string
): Promise<ApiResponse<{ success: boolean; message?: string }>> {
  return backendRequest(`/api/v1/bits/${bitId}/like`, {
    method: 'POST',
  });
}


export interface ToggleReactionRequest {
  reaction_type?: string;
}

/**
 * Toggle reaction on a post (alternative endpoint)
 * POST /api/v1/posts/{postId}/reactions
 */
export async function toggleReaction(
  postId: string,
  data?: ToggleReactionRequest
): Promise<ApiResponse<{ success: boolean; message?: string }>> {
  return backendRequest(`/api/v1/posts/${postId}/reactions`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  });
}

/**
 * Get reactions list for a post
 * GET /api/v1/posts/{postId}/reactions
 */
export async function getReactions(
  postId: string
): Promise<ApiResponse<{ reactions: any[] }>> {
  return backendRequest(`/api/v1/posts/${postId}/reactions`, {
    method: 'GET',
  });
}

// ============================================
// User Profile API
// ============================================

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  cover?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  posts?: number;
}

export async function fetchUserProfile(
  username: string
): Promise<ApiResponse<UserProfile>> {
  return backendRequest<UserProfile>(`/api/v1/profile/${username}`, {
    method: 'GET',
  });
}

export interface UpdateProfileRequest {
  name?: string;
  username?: string;
  bio?: string;
  website?: string;
}

export async function updateProfile(
  data: UpdateProfileRequest
): Promise<ApiResponse<{ success: boolean; user?: UserProfile; message?: string }>> {
  console.log('=== updateProfile API Call ===');
  console.log('Endpoint: /api/v1/update-profile');
  console.log('Request Data:', JSON.stringify(data, null, 2));
  
  const response = await backendRequest('/api/v1/update-profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  console.log('updateProfile Response:', JSON.stringify(response, null, 2));
  return response;
}

export async function updateProfilePicture(
  imageUrl: string
): Promise<ApiResponse<{ success: boolean; avatar?: string; message?: string }>> {
  console.log('=== updateProfilePicture API Call ===');
  console.log('Endpoint: /api/v1/update-profile-pic');
  console.log('Image URL length:', imageUrl.length);
  console.log('Image URL preview (first 100 chars):', imageUrl.substring(0, 100));
  
  const response = await backendRequest('/api/v1/update-profile-pic', {
    method: 'POST',
    body: JSON.stringify({ image: imageUrl }),
  });
  
  console.log('updateProfilePicture Response:', JSON.stringify(response, null, 2));
  return response;
}

export async function updateCoverPicture(
  imageUrl: string
): Promise<ApiResponse<{ success: boolean; cover?: string; message?: string }>> {
  console.log('=== updateCoverPicture API Call ===');
  console.log('Endpoint: /api/v1/update-cover-pic');
  console.log('Image URL length:', imageUrl.length);
  console.log('Image URL preview (first 100 chars):', imageUrl.substring(0, 100));
  
  const response = await backendRequest('/api/v1/update-cover-pic', {
    method: 'POST',
    body: JSON.stringify({ image: imageUrl }),
  });
  
  console.log('updateCoverPicture Response:', JSON.stringify(response, null, 2));
  return response;
}

export async function getUserBits(
  username: string
): Promise<ApiResponse<any>> {
  return backendRequest(`/api/v1/user/${username}/bits`, {
    method: 'GET',
  });
}
