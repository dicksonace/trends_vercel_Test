'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from './input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import { login, register, checkUsername, verifyOTP, resendOTP, googleLogin, googleSignup, forgotPassword, resetPassword } from '@/lib/api';
import type { GoogleLoginResponse, GoogleSignupResponse } from '@/types/auth';

// Extend Window interface for Google Identity Services
declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (config: any) => void;
					prompt: (callback?: (notification: any) => void) => void;
					renderButton: (element: HTMLElement, config: any) => void;
					disableAutoSelect: () => void;
				};
				oauth2: {
					initTokenClient: (config: any) => {
						requestAccessToken: () => void;
					};
				};
			};
		};
	}
}

export function AuthPage() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { theme } = useTheme();
	const isSignup = pathname ? pathname.includes('/signup') : false;
	
	// Get return URL from query params, default to discover tab
	const returnUrl = searchParams.get('returnUrl') || '/?tab=discover';
	const [showSignInModal, setShowSignInModal] = useState(false);
	const [showSignUpModal, setShowSignUpModal] = useState(false);
	const [showOTPModal, setShowOTPModal] = useState(false);
	// Track which modal triggered Google auth (using ref to avoid closure issues)
	const googleAuthModeRef = React.useRef<'signin' | 'signup'>('signin');
	const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
	const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
	const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
	const [resetPasswordData, setResetPasswordData] = useState({ email: '', token: '', password: '', confirmPassword: '' });
	const [isLoading, setIsLoading] = useState(false);
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [signInFormData, setSignInFormData] = useState({ email: '', password: '' });
	const [signUpFormData, setSignUpFormData] = useState({ username: '', email: '', password: '' });
	const [otpData, setOtpData] = useState({ email: '', otp: '' });
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
	const [pendingEmail, setPendingEmail] = useState<string>('');

	const logoImage = '/logo.jpeg';

	// Initialize Google Sign-In on component mount
	useEffect(() => {
		// Fetch Google Client ID from Next.js backend to avoid CORS issues
		let clientId: string | null = null;
		let isInitialized = false;

		const fetchClientId = async () => {
			try {
				// console.log('🔍 Fetching Google Client ID from backend...');
				const response = await fetch('/api/auth/google-client-id');
				
				if (!response.ok) {
					// console.error('❌ Failed to fetch Google Client ID:', response.status);
					setError('Failed to load Google Sign-In configuration');
					return;
				}

				const data = await response.json();
				clientId = data.clientId;
				
				// console.log('✅ Google Client ID fetched from backend:', clientId ? 'Found' : 'Not found');
				
				if (!clientId) {
					// console.error('❌ Google Client ID is missing from backend');
					setError('Google Sign-In is not configured');
					return;
				}

				// Initialize Google Sign-In after fetching client ID
				initGoogleSignIn(clientId);
			} catch (error) {
				// console.error('❌ Error fetching Google Client ID:', error);
				setError('Failed to load Google Sign-In configuration');
			}
		};

		const initGoogleSignIn = (clientId: string) => {
			if (typeof window === 'undefined' || !window.google) {
				// console.log('⏳ Waiting for Google script to load...');
				return;
			}
			
			if (isInitialized) {
				// console.log('⚠️ Google Sign-In already initialized');
				return;
			}

			if (!clientId) {
				// console.error('❌ Google Client ID is missing');
				return;
			}

			// console.log('✅ Initializing Google Sign-In with client ID from backend...');

			window.google.accounts.id.initialize({
				client_id: clientId,
				callback: async (response: any) => {
					try {
						if (!response.credential) {
							setError('Google sign-in was cancelled');
							setIsLoading(false);
							return;
						}

						setIsLoading(true);
						
						// Determine if this is sign-up or sign-in based on ref (updated when modals open)
						const isSignUp = googleAuthModeRef.current === 'signup';
						
						// console.log('Google auth - mode:', googleAuthModeRef.current, 'isSignUp:', isSignUp);
						
						// Use googleSignup for sign-up, googleLogin for sign-in
						const apiResponse = isSignUp 
							? await googleSignup(response.credential)
							: await googleLogin(response.credential);

						if (apiResponse.error) {
							setError(apiResponse.error);
							setIsLoading(false);
							return;
						}

						if (apiResponse.data) {
							setSuccess(isSignUp ? 'Account created successfully!' : 'Login successful!');
							
							// Store user data (googleSignup already handles this, but we do it here for googleLogin too)
							if (isSignUp) {
								// For googleSignup - data is GoogleSignupResponse
								const signupData = apiResponse.data as GoogleSignupResponse;
								if (signupData.user) {
									// googleSignup already stores user data, but ensure it's set
									localStorage.setItem('currentUser', JSON.stringify(signupData.user));
									if (signupData.user.name) {
										localStorage.setItem('userName', signupData.user.name);
									}
								}
							} else {
								// For googleLogin - data is GoogleLoginResponse
								const loginData = apiResponse.data as GoogleLoginResponse;
								if (loginData.name) {
									localStorage.setItem('userName', loginData.name);
								}
								if (loginData.user) {
									localStorage.setItem('currentUser', JSON.stringify(loginData.user));
								}
							}
							
							// Close modals and redirect
							setShowSignInModal(false);
							setShowSignUpModal(false);
							setTimeout(() => {
								router.push(returnUrl);
							}, 500);
						}
						setIsLoading(false);
					} catch (err) {
						// console.error('Google authentication error:', err);
						setError(`An unexpected error occurred during Google ${showSignUpModal ? 'signup' : 'login'}`);
						setIsLoading(false);
					}
				},
			});

			// Render buttons when modals are open
			const renderButtons = () => {
				if (!clientId) return;
				if (!window.google?.accounts?.id) return;
				
				const googleAccountsId = window.google.accounts.id;
				const containers = document.querySelectorAll('#google-signin-container');
				// console.log(`🎨 Rendering Google buttons in ${containers.length} containers...`);
				
				containers.forEach((container, index) => {
					// Clear container
					(container as HTMLElement).innerHTML = '';
					(container as HTMLElement).classList.remove('hidden');
					
					try {
						// Get container width for responsive button (use parent width or default)
						const containerElement = container as HTMLElement;
						const parentWidth = containerElement.parentElement?.offsetWidth || 400;
						const buttonWidth = Math.min(parentWidth - 20, 400); // Max 400px, with padding
						googleAccountsId.renderButton(containerElement, {
							theme: 'outline',
							size: 'large',
							width: buttonWidth, // Google SDK requires a number, not percentage
							text: 'signin_with',
						});
						// console.log(`✅ Google button rendered in container ${index + 1}`);
					} catch (e) {
						// console.error(`❌ Error rendering Google button in container ${index + 1}:`, e);
					}
				});
			};

			// Render buttons when modals open
			if (showSignInModal || showSignUpModal) {
				// Try multiple times to ensure it renders
				setTimeout(renderButtons, 300);
				setTimeout(renderButtons, 800);
				setTimeout(renderButtons, 1500);
			}

			isInitialized = true;
		};

		// Wait for Google script to load, then fetch client ID
		if (window.google) {
			// console.log('✅ Google script already loaded');
			fetchClientId();
		} else {
			// console.log('⏳ Waiting for Google script...');
			let attempts = 0;
			const checkGoogle = setInterval(() => {
				attempts++;
				if (window.google) {
					// console.log(`✅ Google script loaded after ${attempts} attempts`);
					clearInterval(checkGoogle);
					fetchClientId();
				}
				if (attempts > 50) {
					// console.error('❌ Google script failed to load after 5 seconds');
					clearInterval(checkGoogle);
				}
			}, 100);
		}
	}, [showSignInModal, showSignUpModal]);

	// Check username availability on change
	useEffect(() => {
		const checkUsernameAvailability = async () => {
			if (signUpFormData.username.length < 3) {
				setUsernameAvailable(null);
				return;
			}

		setIsCheckingUsername(true);
		const response = await checkUsername(signUpFormData.username);
		setIsCheckingUsername(false);
		
		// If endpoint doesn't exist (404), gracefully skip username checking
		// The registration will handle validation
		if (response.status === 404 || (response.error && response.error.includes('could not be found'))) {
			setUsernameAvailable(null); // Don't show availability status
			return;
		}
		
		if (response.error) {
			// Only set as unavailable if it's a clear "username taken" error
			// Otherwise, let registration handle it
			if (response.error.toLowerCase().includes('username') && 
			    (response.error.toLowerCase().includes('taken') || 
			     response.error.toLowerCase().includes('already') ||
			     response.error.toLowerCase().includes('exists'))) {
				setUsernameAvailable(false);
			} else {
				setUsernameAvailable(null); // Unknown error, let registration handle it
			}
		} else {
			setUsernameAvailable(response.data?.available ?? null);
		}
		};

		const timeoutId = setTimeout(checkUsernameAvailability, 500);
		return () => clearTimeout(timeoutId);
	}, [signUpFormData.username]);

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setIsLoading(true);

		try {
			// API expects "identity" field instead of email/username
			const credentials = {
				identity: signInFormData.email, // Can be email, username, or phone
				password: signInFormData.password
			};

			const response = await login(credentials);

			if (response.error) {
				setError(response.error);
				setIsLoading(false);
				return;
			}

			if (response.data) {
				setSuccess('Login successful!');
				// Store user data
				if (response.data.name) {
					localStorage.setItem('userName', response.data.name);
				}
				if (response.data.user) {
					localStorage.setItem('currentUser', JSON.stringify(response.data.user));
				}
				setTimeout(() => {
					setShowSignInModal(false);
					router.push(returnUrl);
				}, 500);
			}
		} catch (err) {
			setError('An unexpected error occurred');
			setIsLoading(false);
		}
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);

		if (usernameAvailable === false) {
			setError('Username is not available');
			return;
		}

		setIsLoading(true);

		try {
			const response = await register(signUpFormData);

			if (response.error) {
				setError(response.error);
				setIsLoading(false);
				return;
			}

			if (response.data) {
				// Check if OTP verification is needed
				if (response.data.message?.toLowerCase().includes('otp') || response.data.message?.toLowerCase().includes('verify')) {
					setPendingEmail(signUpFormData.email);
					setOtpData({ email: signUpFormData.email, otp: '' });
					setShowSignUpModal(false);
					setShowOTPModal(true);
					setSuccess('Please check your email for verification code');
				} else {
					setSuccess('Account created successfully!');
					// Store user data
					if (response.data.name) {
						localStorage.setItem('userName', response.data.name);
					}
					if (response.data.user) {
						localStorage.setItem('currentUser', JSON.stringify(response.data.user));
					}
					setTimeout(() => {
						setShowSignUpModal(false);
						router.push(returnUrl);
					}, 500);
				}
				setIsLoading(false);
			}
		} catch (err) {
			setError('An unexpected error occurred');
			setIsLoading(false);
		}
	};

	const handleVerifyOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setIsLoading(true);

		try {
			const response = await verifyOTP(otpData);

			if (response.error) {
				setError(response.error);
				setIsLoading(false);
				return;
			}

			// Check for success - either success field or message indicating success
			if (response.data?.success || 
			    response.data?.message?.toLowerCase().includes('verified') ||
			    response.data?.message?.toLowerCase().includes('success')) {
				setSuccess(response.data?.message || 'Email verified successfully!');
				setIsLoading(false);
				
				// Store user data if available
				if (response.data?.user) {
					localStorage.setItem('currentUser', JSON.stringify(response.data.user));
				}
				
				// Close modal and redirect after a short delay
				setTimeout(() => {
					setShowOTPModal(false);
					setOtpData({ email: '', otp: '' });
					router.push(returnUrl);
				}, 1500);
			} else {
				// If we got a response but no clear success indicator, still treat as success if status is 200
				if (response.status === 200 || response.status === 201) {
					setSuccess(response.data?.message || 'Email verified successfully!');
					setIsLoading(false);
					
					// Store user data if available
					if (response.data?.user) {
						localStorage.setItem('currentUser', JSON.stringify(response.data.user));
					}
					
					setTimeout(() => {
						setShowOTPModal(false);
						setOtpData({ email: '', otp: '' });
						router.push(returnUrl);
					}, 1500);
				} else {
					setError('Verification failed. Please try again.');
					setIsLoading(false);
				}
			}
		} catch (err) {
			setError('An unexpected error occurred');
			setIsLoading(false);
		}
	};

	const handleResendOTP = async () => {
		setError(null);
		setSuccess(null);
		setIsLoading(true);

		try {
			const response = await resendOTP(pendingEmail || otpData.email);

			if (response.error) {
				setError(response.error);
			} else {
				setSuccess('Verification code resent to your email');
			}
			setIsLoading(false);
		} catch (err) {
			setError('An unexpected error occurred');
			setIsLoading(false);
		}
	};

	// handleGoogleLogin is no longer needed - the Google button handles it directly
	// But we keep it for backwards compatibility and to trigger the prompt
	const handleGoogleLogin = () => {
		// Try to trigger the One Tap prompt
		if (window.google?.accounts?.id) {
			window.google.accounts.id.prompt();
		}
	};

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setIsLoading(true);

		try {
			const response = await forgotPassword(forgotPasswordEmail);

			if (response.error) {
				setError(response.error);
				setIsLoading(false);
				return;
			}

			if (response.data?.success) {
				setSuccess('Password reset link sent to your email!');
				setTimeout(() => {
					setShowForgotPasswordModal(false);
					setForgotPasswordEmail('');
				}, 2000);
			}
			setIsLoading(false);
		} catch (err) {
			setError('An unexpected error occurred');
			setIsLoading(false);
		}
	};

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);

		if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		setIsLoading(true);

		try {
			const response = await resetPassword({
				email: resetPasswordData.email,
				token: resetPasswordData.token,
				password: resetPasswordData.password,
			});

			if (response.error) {
				setError(response.error);
				setIsLoading(false);
				return;
			}

			if (response.data?.success) {
				setSuccess('Password reset successful! Redirecting to login...');
				setTimeout(() => {
					setShowResetPasswordModal(false);
					setResetPasswordData({ email: '', token: '', password: '', confirmPassword: '' });
					googleAuthModeRef.current = 'signin';
					setShowSignInModal(true);
				}, 2000);
			}
			setIsLoading(false);
		} catch (err) {
			setError('An unexpected error occurred');
			setIsLoading(false);
		}
	};

	return (
		<main className="relative lg:grid lg:grid-cols-2 min-h-screen overflow-y-auto">
			<div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex items-center justify-center">
				<div className="z-10 flex flex-col items-center justify-center space-y-6">
					<img src={logoImage} alt="TrendsHub Logo" width={200} height={200} className="rounded-2xl object-contain shadow-2xl" />
				</div>
			</div>
			<div className="relative flex min-h-screen flex-col justify-between p-4">
				<div className="absolute top-4 right-4 z-20"><ThemeToggle /></div>
				<div className="flex-1 flex flex-col justify-center">
					<div className="mx-auto space-y-6 sm:w-sm max-w-md">
						<div className="flex items-center gap-2 lg:hidden mb-8">
							<img src={logoImage} alt="TrendsHub Logo" width={48} height={48} className="rounded-lg object-contain" />
							<p className="text-xl font-semibold">TrendsHub</p>
						</div>
						<div className="flex flex-col space-y-2">
							<h1 className="font-heading text-3xl font-bold tracking-wide">Are you trending?</h1>
							<p className="text-muted-foreground text-lg">Start a trend today.</p>
						</div>
						{!isSignup ? (
							<Button type="button" className="w-full" size="lg" onClick={() => { googleAuthModeRef.current = 'signin'; setShowSignInModal(true); }}>Sign in</Button>
						) : (
							<Button type="button" className="w-full" size="lg" onClick={() => { googleAuthModeRef.current = 'signup'; setShowSignUpModal(true); }}>Create account</Button>
						)}
						<div className="text-center pt-4">
							<p className="text-muted-foreground text-sm">
								{isSignup ? (
									<>Already have an account? <button type="button" onClick={() => { googleAuthModeRef.current = 'signin'; setShowSignInModal(true); }} className="hover:text-primary underline underline-offset-4 font-medium">Sign in</button></>
								) : (
									<>Don&apos;t have an account? <Link href="/signup" className="hover:text-primary underline underline-offset-4 font-medium">Sign up</Link></>
								)}
							</p>
						</div>
					</div>
				</div>
			</div>
			<AnimatePresence>
				{showSignInModal && (
					<>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSignInModal(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
						<motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
							<div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
								<div className="flex items-center justify-between">
									<div><h2 className="text-2xl font-bold">Sign in</h2><p className="text-muted-foreground text-sm mt-1">Welcome back to TrendsHub</p></div>
									<button onClick={() => { setShowSignInModal(false); setError(null); setSuccess(null); }} className="p-2 rounded-full hover:bg-accent transition-colors" aria-label="Close modal"><X className="w-5 h-5" /></button>
								</div>
								{error && (
									<div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
										<AlertCircle className="w-4 h-4" />
										<span>{error}</span>
									</div>
								)}
								{success && (
									<div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
										<CheckCircle2 className="w-4 h-4" />
										<span>{success}</span>
									</div>
								)}
								<form className="space-y-4" onSubmit={handleSignIn}>
									<Input type="text" placeholder="Email, username or phone number" value={signInFormData.email} onChange={(e) => { setSignInFormData({ ...signInFormData, email: e.target.value }); setError(null); }} className="w-full" required disabled={isLoading} />
									<div>
										<Input type="password" placeholder="Enter your password" value={signInFormData.password} onChange={(e) => { setSignInFormData({ ...signInFormData, password: e.target.value }); setError(null); }} className="w-full" required disabled={isLoading} />
										<button
											type="button"
											onClick={() => { setShowSignInModal(false); setShowForgotPasswordModal(true); }}
											className="text-sm text-blue-500 hover:underline mt-2 text-right w-full"
										>
											Forgot password?
										</button>
									</div>
									<Button type="submit" className="w-full" size="lg" disabled={isLoading}>
										{isLoading ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Signing in...
											</>
										) : (
											'Sign In'
										)}
									</Button>
								</form>
								{/* Google Sign-In Button - Rendered by Google SDK (includes logo and text) */}
								<div id="google-signin-container" className="w-full min-h-[40px] flex items-center justify-center mt-4"></div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{showSignUpModal && (
					<>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSignUpModal(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
						<motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
							<div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
								<div className="flex items-center justify-between">
									<div><h2 className="text-2xl font-bold">Create your account</h2></div>
									<button onClick={() => { setShowSignUpModal(false); setError(null); setSuccess(null); setUsernameAvailable(null); }} className="p-2 rounded-full hover:bg-accent transition-colors" aria-label="Close modal"><X className="w-5 h-5" /></button>
								</div>
								{error && (
									<div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
										<AlertCircle className="w-4 h-4" />
										<span>{error}</span>
									</div>
								)}
								{success && (
									<div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
										<CheckCircle2 className="w-4 h-4" />
										<span>{success}</span>
									</div>
								)}
								<form className="space-y-4" onSubmit={handleSignUp}>
									<div>
										<Input 
											type="text" 
											placeholder="Username" 
											value={signUpFormData.username} 
											onChange={(e) => { 
												setSignUpFormData({ ...signUpFormData, username: e.target.value }); 
												setError(null);
											}} 
											className={`w-full ${usernameAvailable === false ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : ''}`} 
											required 
											disabled={isLoading} 
										/>
										{signUpFormData.username.length >= 3 && (
											<div className="mt-1 text-xs flex items-center gap-1">
												{isCheckingUsername ? (
													<>
														<Loader2 className="w-3 h-3 animate-spin" />
														<span className="text-muted-foreground">Checking...</span>
													</>
												) : usernameAvailable === true ? (
													<>
														<CheckCircle2 className="w-3 h-3 text-green-500" />
														<span className="text-green-500">Username available</span>
													</>
												) : usernameAvailable === false ? (
													<>
														<AlertCircle className="w-3 h-3 text-red-500" />
														<span className="text-red-500">Username not available</span>
													</>
												) : null}
											</div>
										)}
									</div>
									<Input type="email" placeholder="What is your email?" value={signUpFormData.email} onChange={(e) => { setSignUpFormData({ ...signUpFormData, email: e.target.value }); setError(null); }} className="w-full" required disabled={isLoading} />
									<Input type="password" placeholder="Choose a password" value={signUpFormData.password} onChange={(e) => { setSignUpFormData({ ...signUpFormData, password: e.target.value }); setError(null); }} className="w-full" required disabled={isLoading} />
									<Button type="submit" className="w-full" size="lg" disabled={isLoading || usernameAvailable === false}>
										{isLoading ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Creating account...
											</>
										) : (
											'Continue'
										)}
									</Button>
								</form>
								{/* Google Sign-In Button - Rendered by Google SDK (includes logo and text) */}
								<div id="google-signin-container" className="w-full min-h-[40px] flex items-center justify-center mt-4"></div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{showOTPModal && (
					<>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowOTPModal(false); setError(null); setSuccess(null); }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
						<motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
							<div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold">Verify your email</h2>
										<p className="text-muted-foreground text-sm mt-1">Enter the code sent to {otpData.email}</p>
									</div>
									<button onClick={() => { setShowOTPModal(false); setError(null); setSuccess(null); }} className="p-2 rounded-full hover:bg-accent transition-colors" aria-label="Close modal"><X className="w-5 h-5" /></button>
								</div>
								{error && (
									<div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
										<AlertCircle className="w-4 h-4" />
										<span>{error}</span>
									</div>
								)}
								{success && (
									<div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
										<CheckCircle2 className="w-4 h-4" />
										<span>{success}</span>
									</div>
								)}
								<form className="space-y-4" onSubmit={handleVerifyOTP}>
									<div className="flex gap-2 justify-center">
										{[0, 1, 2, 3, 4, 5].map((index) => (
											<Input
												key={index}
												type="text"
												inputMode="numeric"
												maxLength={1}
												value={otpData.otp[index] || ''}
												onChange={(e) => {
													const value = e.target.value.replace(/\D/g, '');
													if (value.length <= 1) {
														const currentOtp = otpData.otp.padEnd(6, ' ').split('');
														if (value) {
															currentOtp[index] = value;
														} else {
															currentOtp[index] = '';
														}
														const newOtp = currentOtp.join('').trim();
														setOtpData({ ...otpData, otp: newOtp });
														setError(null);
														
														// Auto-focus next input if digit entered
														if (value && index < 5) {
															setTimeout(() => {
																const nextInput = document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement;
																nextInput?.focus();
															}, 10);
														}
													}
												}}
												onKeyDown={(e) => {
													// Handle backspace
													if (e.key === 'Backspace') {
														if (!otpData.otp[index] && index > 0) {
															// If current is empty, go to previous and clear it
															e.preventDefault();
															const currentOtp = otpData.otp.split('');
															currentOtp[index - 1] = '';
															setOtpData({ ...otpData, otp: currentOtp.join('') });
															const prevInput = document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement;
															prevInput?.focus();
														} else if (otpData.otp[index]) {
															// If current has value, clear it
															const currentOtp = otpData.otp.split('');
															currentOtp[index] = '';
															setOtpData({ ...otpData, otp: currentOtp.join('') });
														}
													}
													// Handle arrow keys
													else if (e.key === 'ArrowLeft' && index > 0) {
														e.preventDefault();
														const prevInput = document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement;
														prevInput?.focus();
													}
													else if (e.key === 'ArrowRight' && index < 5) {
														e.preventDefault();
														const nextInput = document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement;
														nextInput?.focus();
													}
												}}
												onPaste={(e) => {
													e.preventDefault();
													const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
													if (pastedData) {
														setOtpData({ ...otpData, otp: pastedData });
														setError(null);
														// Focus the last filled input or the last input
														const focusIndex = Math.min(pastedData.length - 1, 5);
														setTimeout(() => {
															const targetInput = document.querySelector(`input[data-otp-index="${focusIndex}"]`) as HTMLInputElement;
															targetInput?.focus();
														}, 10);
													}
												}}
												data-otp-index={index}
												className="w-12 h-14 text-center text-2xl font-bold"
												required
												disabled={isLoading}
											/>
										))}
									</div>
									<Button type="submit" className="w-full" size="lg" disabled={isLoading || otpData.otp.length !== 6}>
										{isLoading ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Verifying...
											</>
										) : (
											'Verify'
										)}
									</Button>
								</form>
								<div className="text-center">
									<button 
										type="button"
										onClick={handleResendOTP} 
										disabled={isLoading}
										className="text-sm text-blue-500 hover:underline disabled:opacity-50"
									>
										Resend code
									</button>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{showForgotPasswordModal && (
					<>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowForgotPasswordModal(false); setError(null); setSuccess(null); }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
						<motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
							<div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold">Forgot Password</h2>
										<p className="text-muted-foreground text-sm mt-1">Enter your email to reset your password</p>
									</div>
									<button onClick={() => { setShowForgotPasswordModal(false); setError(null); setSuccess(null); }} className="p-2 rounded-full hover:bg-accent transition-colors" aria-label="Close modal"><X className="w-5 h-5" /></button>
								</div>
								{error && (
									<div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
										<AlertCircle className="w-4 h-4" />
										<span>{error}</span>
									</div>
								)}
								{success && (
									<div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
										<CheckCircle2 className="w-4 h-4" />
										<span>{success}</span>
									</div>
								)}
								<form className="space-y-4" onSubmit={handleForgotPassword}>
									<Input 
										type="email" 
										placeholder="Enter your email" 
										value={forgotPasswordEmail} 
										onChange={(e) => { 
											setForgotPasswordEmail(e.target.value); 
											setError(null); 
										}} 
										className="w-full" 
										required 
										disabled={isLoading} 
									/>
									<Button type="submit" className="w-full" size="lg" disabled={isLoading || !forgotPasswordEmail}>
										{isLoading ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Sending...
											</>
										) : (
											'Send Reset Link'
										)}
									</Button>
								</form>
								<div className="text-center">
									<button 
										type="button"
										onClick={() => { setShowForgotPasswordModal(false); setShowResetPasswordModal(true); }}
										className="text-sm text-blue-500 hover:underline"
									>
										Already have a reset token?
									</button>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{showResetPasswordModal && (
					<>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowResetPasswordModal(false); setError(null); setSuccess(null); }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
						<motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
							<div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold">Reset Password</h2>
										<p className="text-muted-foreground text-sm mt-1">Enter your email, token, and new password</p>
									</div>
									<button onClick={() => { setShowResetPasswordModal(false); setError(null); setSuccess(null); }} className="p-2 rounded-full hover:bg-accent transition-colors" aria-label="Close modal"><X className="w-5 h-5" /></button>
								</div>
								{error && (
									<div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
										<AlertCircle className="w-4 h-4" />
										<span>{error}</span>
									</div>
								)}
								{success && (
									<div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
										<CheckCircle2 className="w-4 h-4" />
										<span>{success}</span>
									</div>
								)}
								<form className="space-y-4" onSubmit={handleResetPassword}>
									<Input 
										type="email" 
										placeholder="Email" 
										value={resetPasswordData.email} 
										onChange={(e) => { 
											setResetPasswordData({ ...resetPasswordData, email: e.target.value }); 
											setError(null); 
										}} 
										className="w-full" 
										required 
										disabled={isLoading} 
									/>
									<Input 
										type="text" 
										placeholder="Reset token" 
										value={resetPasswordData.token} 
										onChange={(e) => { 
											setResetPasswordData({ ...resetPasswordData, token: e.target.value }); 
											setError(null); 
										}} 
										className="w-full" 
										required 
										disabled={isLoading} 
									/>
									<Input 
										type="password" 
										placeholder="New password" 
										value={resetPasswordData.password} 
										onChange={(e) => { 
											setResetPasswordData({ ...resetPasswordData, password: e.target.value }); 
											setError(null); 
										}} 
										className="w-full" 
										required 
										disabled={isLoading} 
									/>
									<Input 
										type="password" 
										placeholder="Confirm new password" 
										value={resetPasswordData.confirmPassword} 
										onChange={(e) => { 
											setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value }); 
											setError(null); 
										}} 
										className="w-full" 
										required 
										disabled={isLoading} 
									/>
									<Button type="submit" className="w-full" size="lg" disabled={isLoading}>
										{isLoading ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Resetting...
											</>
										) : (
											'Reset Password'
										)}
									</Button>
								</form>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</main>
	);
}

export default AuthPage;
