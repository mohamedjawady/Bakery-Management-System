'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from "@/components/auth/login-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated and redirect to appropriate dashboard
    const checkAuthentication = () => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const userInfo = localStorage.getItem('userInfo');
        
        if (userInfo) {
          const user = JSON.parse(userInfo);
          
          // Check if token exists and user has a role
          if (user.token && user.role) {
            console.log('[Home Page] User authenticated as', user.role, 'redirecting...');
            
            // Redirect to appropriate dashboard based on role
            let targetPath = "/login";
            switch (user.role) {
              case "admin":
                targetPath = "/admin/dashboard";
                break;
              case "bakery":
                targetPath = "/bakery/dashboard";
                break;
              case "laboratory":
                targetPath = "/laboratory/dashboard";
                break;
              case "delivery":
                targetPath = "/delivery/dashboard";
                break;
              default:
                targetPath = "/login";
            }
            
            router.push(targetPath);
          }
        }
      } catch (error) {
        console.error('[Home Page] Error parsing user info:', error);
        // Clear invalid data
        localStorage.removeItem('userInfo');
      }
    };

    checkAuthentication();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/50 relative">
      {/* Added ThemeToggle to top right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle variant="outline" /> {/* Explicitly set variant to outline */}
      </div>
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  )
}
