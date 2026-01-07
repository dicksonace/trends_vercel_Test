'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import {
	X,
} from 'lucide-react';
import { Input } from './input';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export function AuthPage() {
	const pathname = usePathname();
	const router = useRouter();
	const isSignup = pathname ? pathname.includes('/signup') : false;
	const [showSignInModal, setShowSignInModal] = useState(false);
	const [showSignUpModal, setShowSignUpModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [signInFormData, setSignInFormData] = useState({
		email: '',
		password: '',
	});
	const [signUpFormData, setSignUpFormData] = useState({
		username: '',
		email: '',
		password: '',
	});

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Close modal and redirect to home
		setShowSignInModal(false);
		setIsLoading(false);
		router.push('/');
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Close modal and redirect to home
		setShowSignUpModal(false);
		setIsLoading(false);
		router.push('/');
	};

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2 min-h-screen">
			{/* Left Side - Logo */}
			<div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex items-center justify-center">
				<div className="from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
				<div className="z-10 flex flex-col items-center justify-center space-y-6">
					<img
						src="/logo.jpeg"
						alt="TrendsHub Logo"
						width={200}
						height={200}
						className="rounded-2xl object-cover shadow-2xl"
					/>
				</div>
				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>

			{/* Right Side - Form */}
			<div className="relative flex min-h-screen flex-col justify-between p-4">
				{/* Theme Toggle - Top Right */}
				<div className="absolute top-4 right-4 z-20">
					<ThemeToggle />
				</div>

				<div
					aria-hidden
					className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
				>
					<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
				</div>

				{/* Main Content */}
				<div className="flex-1 flex flex-col justify-center">
					<div className="mx-auto space-y-6 sm:w-sm max-w-md">
						{/* Mobile Logo */}
						<div className="flex items-center gap-2 lg:hidden mb-8">
							<img
								src="/logo.jpeg"
								alt="TrendsHub Logo"
								width={48}
								height={48}
								className="rounded-lg object-cover"
							/>
							<p className="text-xl font-semibold">TrendsHub</p>
						</div>

						{/* Heading */}
						<div className="flex flex-col space-y-2">
							<h1 className="font-heading text-3xl font-bold tracking-wide">
								Are you trending?
							</h1>
							<p className="text-muted-foreground text-lg">
								Start a trend today.
							</p>
						</div>

						{/* Social Login Buttons */}
						<div className="space-y-3">
							<Button type="button" size="lg" className="w-full">
								<EthereumIcon className='size-5 me-2' />
								Continue with Ethereum
							</Button>
							<Button type="button" size="lg" className="w-full">
								<GoogleIcon className='size-5 me-2' />
								Continue with Google
							</Button>
						</div>

						{/* Separator */}
						<AuthSeparator />

						{/* Sign In Button - Opens Modal */}
						{!isSignup && (
							<Button 
								type="button" 
								className="w-full" 
								size="lg"
								onClick={() => setShowSignInModal(true)}
							>
								Sign in
							</Button>
						)}

						{/* Create Account Button - Show on signup page */}
						{isSignup && (
							<Button 
								type="button" 
								className="w-full" 
								size="lg"
								onClick={() => setShowSignUpModal(true)}
							>
								Create account
							</Button>
						)}

						{/* Terms */}
						{isSignup && (
							<p className="text-muted-foreground text-xs text-center">
								By signing up, you agree to the{' '}
								<a
									href="#"
									className="hover:text-primary underline underline-offset-4"
								>
									Terms of Service
								</a>{' '}
								and{' '}
								<a
									href="#"
									className="hover:text-primary underline underline-offset-4"
								>
									Privacy Policy
								</a>
								, including Cookie Use.
							</p>
						)}

						{/* Sign In/Sign Up Link */}
						<div className="text-center pt-4">
							<p className="text-muted-foreground text-sm">
								{isSignup ? (
									<>
										Already have an account?{' '}
										<button
											type="button"
											onClick={() => setShowSignInModal(true)}
											className="hover:text-primary underline underline-offset-4 font-medium"
										>
											Sign in
										</button>
									</>
								) : (
									<>
										Don&apos;t have an account?{' '}
										<Link
											href="/signup"
											className="hover:text-primary underline underline-offset-4 font-medium"
										>
											Sign up
										</Link>
									</>
								)}
							</p>
						</div>
					</div>
				</div>

				{/* Footer */}
				<footer className="mt-auto py-6 border-t border-border">
					<div className="mx-auto max-w-md text-center space-y-2">
						<p className="text-muted-foreground text-sm">
							© 2026 Trendshub •{' '}
							<a
								href="#"
								className="hover:text-primary underline underline-offset-4"
							>
								Privacy Policy
							</a>
						</p>
						<p className="text-muted-foreground text-xs">
							Powered by{' '}
							<a
								href="#"
								className="hover:text-primary underline underline-offset-4"
							>
								Kwazora
							</a>
						</p>
					</div>
				</footer>
			</div>

			{/* Sign In Modal */}
			<AnimatePresence>
				{showSignInModal && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setShowSignInModal(false)}
							className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
						/>

						{/* Modal */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 z-50 flex items-center justify-center p-4"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
								{/* Header */}
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold">Sign in</h2>
										<p className="text-muted-foreground text-sm mt-1">
											Welcome back to TrendsHub
										</p>
									</div>
									<button
										onClick={() => setShowSignInModal(false)}
										className="p-2 rounded-full hover:bg-accent transition-colors"
										aria-label="Close modal"
									>
										<X className="w-5 h-5" />
									</button>
								</div>

								{/* Form */}
								<form
									className="space-y-4"
									onSubmit={handleSignIn}
								>
									<div className="space-y-2">
										<Input
											type="text"
											placeholder="Email, username or phone number"
											value={signInFormData.email}
											onChange={(e) => setSignInFormData({ ...signInFormData, email: e.target.value })}
											className="w-full"
											required
											disabled={isLoading}
										/>
									</div>
									<div className="space-y-2">
										<Input
											type="password"
											placeholder="Enter your password"
											value={signInFormData.password}
											onChange={(e) => setSignInFormData({ ...signInFormData, password: e.target.value })}
											className="w-full"
											required
											disabled={isLoading}
										/>
									</div>
									<Button type="submit" className="w-full" size="lg" disabled={isLoading}>
										{isLoading ? 'Signing in...' : 'Sign In'}
									</Button>
								</form>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Create Account Modal */}
			<AnimatePresence>
				{showSignUpModal && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setShowSignUpModal(false)}
							className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
						/>

						{/* Modal */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 z-50 flex items-center justify-center p-4"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
								{/* Header */}
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold">Create your account</h2>
									</div>
									<button
										onClick={() => setShowSignUpModal(false)}
										className="p-2 rounded-full hover:bg-accent transition-colors"
										aria-label="Close modal"
									>
										<X className="w-5 h-5" />
									</button>
								</div>

								{/* Form */}
								<form
									className="space-y-4"
									onSubmit={handleSignUp}
								>
									<div className="space-y-2">
										<Input
											type="text"
											placeholder="Username"
											value={signUpFormData.username}
											onChange={(e) => setSignUpFormData({ ...signUpFormData, username: e.target.value })}
											className="w-full"
											required
											disabled={isLoading}
										/>
									</div>
									<div className="space-y-2">
										<Input
											type="email"
											placeholder="What is your email?"
											value={signUpFormData.email}
											onChange={(e) => setSignUpFormData({ ...signUpFormData, email: e.target.value })}
											className="w-full"
											required
											disabled={isLoading}
										/>
									</div>
									<div className="space-y-2">
										<Input
											type="password"
											placeholder="Choose a password"
											value={signUpFormData.password}
											onChange={(e) => setSignUpFormData({ ...signUpFormData, password: e.target.value })}
											className="w-full"
											required
											disabled={isLoading}
										/>
									</div>
									<Button type="submit" className="w-full" size="lg" disabled={isLoading}>
										{isLoading ? 'Creating account...' : 'Continue'}
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

function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
			380 - i * 5 * position
		} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
			152 - i * 5 * position
		} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
			684 - i * 5 * position
		} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		color: `rgba(15,23,42,${0.1 + i * 0.03})`,
		width: 0.5 + i * 0.03,
	}));

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg
				className="h-full w-full text-slate-950 dark:text-white"
				viewBox="0 0 696 316"
				fill="none"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.1 + path.id * 0.03}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + (path.id * 0.3),
							repeat: Number.POSITIVE_INFINITY,
							ease: 'linear',
						}}
					/>
				))}
			</svg>
		</div>
	);
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		{...props}
	>
		<g>
			<path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
		</g>
	</svg>
);

const EthereumIcon = (props: React.ComponentProps<'svg'>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		{...props}
	>
		<path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
	</svg>
);

const AuthSeparator = () => {
	return (
		<div className="flex w-full items-center justify-center">
			<div className="bg-border h-px w-full" />
			<span className="text-muted-foreground px-3 text-sm">— OR —</span>
			<div className="bg-border h-px w-full" />
		</div>
	);
};

// Default export for compatibility
export default AuthPage;
