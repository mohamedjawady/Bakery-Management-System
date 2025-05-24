'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
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
            console.log('[Login Page] User authenticated as', user.role, 'redirecting...');
            
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
        console.error('[Login Page] Error parsing user info:', error);
        // Clear invalid data
        localStorage.removeItem('userInfo');
      }
    };

    checkAuthentication();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <LoginForm />
    </div>
  );
}
