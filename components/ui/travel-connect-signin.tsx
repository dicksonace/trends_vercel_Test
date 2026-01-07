'use client';

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Eye, EyeOff, ArrowRight, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from '@/components/ThemeProvider';

// Utils function to combine class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Custom Button Component
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg";
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        size === "default" && "h-10 px-4 py-2",
        size === "sm" && "h-9 px-3",
        size === "lg" && "h-11 px-8",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// Custom Input Component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background dark:bg-[#1a1d2b] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// DotMap Component
type RoutePoint = {
  x: number;
  y: number;
  delay: number;
};

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Prevent SSR execution - all canvas code runs only in browser
  const isClient = typeof window !== "undefined";

  // Set up routes that will animate across the map
  const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = useMemo(() => [
    {
      start: { x: 100, y: 150, delay: 0 },
      end: { x: 200, y: 80, delay: 2 },
      color: "#3b82f6",
    },
    {
      start: { x: 200, y: 80, delay: 2 },
      end: { x: 260, y: 120, delay: 4 },
      color: "#3b82f6",
    },
    {
      start: { x: 50, y: 50, delay: 1 },
      end: { x: 150, y: 180, delay: 3 },
      color: "#3b82f6",
    },
    {
      start: { x: 280, y: 60, delay: 0.5 },
      end: { x: 180, y: 180, delay: 2.5 },
      color: "#3b82f6",
    },
  ], []);

  // Create dots for the world map
  const generateDots = (width: number, height: number) => {
    const dots = [];
    const gap = 12;
    const dotRadius = 1;

    // Create a dot grid pattern with random opacity
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        // Shape the dots to form a world map silhouette
        const isInMapShape =
          // North America
          ((x < width * 0.25 && x > width * 0.05) && 
           (y < height * 0.4 && y > height * 0.1)) ||
          // South America
          ((x < width * 0.25 && x > width * 0.15) && 
           (y < height * 0.8 && y > height * 0.4)) ||
          // Europe
          ((x < width * 0.45 && x > width * 0.3) && 
           (y < height * 0.35 && y > height * 0.15)) ||
          // Africa
          ((x < width * 0.5 && x > width * 0.35) && 
           (y < height * 0.65 && y > height * 0.35)) ||
          // Asia
          ((x < width * 0.7 && x > width * 0.45) && 
           (y < height * 0.5 && y > height * 0.1)) ||
          // Australia
          ((x < width * 0.8 && x > width * 0.65) && 
           (y < height * 0.8 && y > height * 0.6));

        if (isInMapShape && Math.random() > 0.3) {
          dots.push({
            x,
            y,
            radius: dotRadius,
            opacity: Math.random() * 0.5 + 0.1,
          });
        }
      }
    }
    return dots;
  };

  // Setup ResizeObserver - only runs in browser
  useEffect(() => {
    if (!isClient) return; // Skip on Vercel SSR
    if (!parentRef.current || !canvasRef.current) return;

    const parent = parentRef.current;
    const canvas = canvasRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width && height) {
        setDimensions({ width, height });
        canvas.width = width;
        canvas.height = height;
      }
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [isClient]);

  // Canvas drawing - only runs in browser after dimensions are set
  useEffect(() => {
    if (!isClient) return; // Skip on Vercel SSR
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // After null check, ctx is guaranteed to be non-null
    const context = ctx as CanvasRenderingContext2D;

    // Generate dots AFTER canvas is ready
    const dots = generateDots(dimensions.width, dimensions.height);

    let animationFrameId = 0;
    let startTime = Date.now();

    // Draw background dots
    function drawDots() {
      context.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw the dots
      dots.forEach((dot) => {
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
        context.fill();
      });
    }

    // Draw animated routes
    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000; // Time in seconds
      
      routes.forEach((route) => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;
        
        const duration = 3; // Animation duration in seconds
        const progress = Math.min(elapsed / duration, 1);
        
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;
        
        // Draw the route line
        context.beginPath();
        context.moveTo(route.start.x, route.start.y);
        context.lineTo(x, y);
        context.strokeStyle = route.color;
        context.lineWidth = 1.5;
        context.stroke();
        
        // Draw the start point
        context.beginPath();
        context.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        context.fillStyle = route.color;
        context.fill();
        
        // Draw the moving point
        context.beginPath();
        context.arc(x, y, 3, 0, Math.PI * 2);
        context.fillStyle = "#60a5fa";
        context.fill();
        
        // Add glow effect to the moving point
        context.beginPath();
        context.arc(x, y, 6, 0, Math.PI * 2);
        context.fillStyle = "rgba(96, 165, 250, 0.3)";
        context.fill();
        
        // If the route is complete, draw the end point
        if (progress === 1) {
          context.beginPath();
          context.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          context.fillStyle = route.color;
          context.fill();
        }
      });
    }
    
    // Animation loop
    function animate() {
      drawDots();
      drawRoutes();
      
      // If all routes are complete, restart the animation
      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 15) { // Reset after 15 seconds
        startTime = Date.now();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isClient, dimensions, routes]);

  return (
    <div ref={parentRef} className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

// SignInCard Component Props
interface SignInCardProps {
  mode?: 'signin' | 'signup';
  onSignIn?: (email: string, password: string) => void;
  onSignUp?: (name: string, email: string, password: string) => void;
  onGoogleAuth?: () => void;
  onForgotPassword?: () => void;
  onSwitchMode?: () => void;
}

const SignInCard = ({ 
  mode = 'signin',
  onSignIn,
  onSignUp,
  onGoogleAuth,
  onForgotPassword,
  onSwitchMode
}: SignInCardProps) => {
  const { theme, toggleTheme } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      onSignIn?.(email, password);
    } else {
      onSignUp?.(name, email, password);
    }
  };
  
  return (
    <div className="flex w-full h-full items-center justify-center relative">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-[#13151f] dark:bg-[#1a1d2b] border border-[#2a2d3a] dark:border-[#3a3d4a] hover:bg-[#1a1d2b] dark:hover:bg-[#252830] transition-colors z-50"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-gray-300" />
        ) : (
          <Sun className="w-5 h-5 text-gray-300" />
        )}
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-[#090b13] dark:bg-[#0a0c14] text-white shadow-2xl"
      >
        {/* Left side - Map */}
        <div className="hidden md:block w-1/2 h-[600px] relative overflow-hidden border-r border-[#1f2130] dark:border-[#2a2d3a]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1120] to-[#151929] dark:from-[#0a0c14] dark:to-[#0f1120]">
            <DotMap />
            
            {/* Logo and text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-6"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <ArrowRight className="text-white h-6 w-6" />
                </div>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500"
              >
                TrendsHub
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-sm text-center text-gray-400 max-w-xs"
              >
                {mode === 'signin' 
                  ? 'Sign in to access your global social feed and connect with people worldwide'
                  : 'Join TrendsHub to share your thoughts and connect with a global community'}
              </motion.p>
            </div>
          </div>
        </div>
        
        {/* Right side - Sign In/Up Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-gray-400 mb-8">
              {mode === 'signin' ? 'Sign in to your account' : 'Sign up to get started'}
            </p>
            
            <div className="mb-6">
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-[#13151f] dark:bg-[#1a1d2b] border border-[#2a2d3a] dark:border-[#3a3d4a] rounded-lg p-3 hover:bg-[#1a1d2b] dark:hover:bg-[#252830] transition-all duration-300"
                onClick={onGoogleAuth}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fillOpacity=".54"
                  />
                  <path
                    fill="#4285F4"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#34A853"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="#EA4335" d="M1 1h22v22H1z" fillOpacity="0" />
                </svg>
                <span>Login with Google</span>
              </button>
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a2d3a] dark:border-[#3a3d4a]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#090b13] dark:bg-[#0a0c14] text-gray-400">or</span>
              </div>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Name <span className="text-blue-500">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="bg-background dark:bg-[#1a1d2b] border-border dark:border-[#3a3d4a] placeholder:text-muted-foreground text-foreground w-full"
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email <span className="text-blue-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="bg-[#13151f] dark:bg-[#1a1d2b] border-[#2a2d3a] dark:border-[#3a3d4a] placeholder:text-gray-500 text-gray-200 w-full"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password <span className="text-blue-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="bg-[#13151f] dark:bg-[#1a1d2b] border-[#2a2d3a] dark:border-[#3a3d4a] placeholder:text-gray-500 text-gray-200 w-full pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {mode === 'signup' && (
                <p className="text-xs text-gray-500 leading-relaxed">
                  By signing up, you agree to the{' '}
                  <button type="button" className="text-blue-500 hover:text-blue-400">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="text-blue-500 hover:text-blue-400">
                    Privacy Policy
                  </button>
                  , including{' '}
                  <button type="button" className="text-blue-500 hover:text-blue-400">
                    Cookie Use
                  </button>
                  .
                </p>
              )}
              
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-2"
              >
                <Button
                  type="submit"
                  className={cn(
                    "w-full bg-gradient-to-r relative overflow-hidden from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2 rounded-lg transition-all duration-300",
                    isHovered ? "shadow-lg shadow-blue-500/25" : ""
                  )}
                >
                  <span className="flex items-center justify-center">
                    {mode === 'signin' ? 'Sign in' : 'Sign up'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                  {isHovered && (
                    <motion.span
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                </Button>
              </motion.div>
              
              {mode === 'signin' && (
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-blue-500 hover:text-blue-400 text-sm transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </form>
            
            {/* Switch mode link */}
            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={onSwitchMode}
                  className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const TravelConnectSignIn = ({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#060818] to-[#0d1023] dark:from-[#030409] dark:to-[#060818] p-4">
      <SignInCard 
        mode={mode}
        onSignIn={(email, password) => {
          console.log("Sign in attempt with:", { email, password });
        }}
        onSignUp={(name, email, password) => {
          console.log("Sign up attempt with:", { name, email, password });
        }}
        onGoogleAuth={() => {
          console.log("Google auth clicked");
        }}
        onForgotPassword={() => {
          console.log("Forgot password clicked");
        }}
        onSwitchMode={() => {
          // This will be handled by Next.js routing
          window.location.href = mode === 'signin' ? '/signup' : '/login';
        }}
      />
    </div>
  );
};

export default TravelConnectSignIn;
