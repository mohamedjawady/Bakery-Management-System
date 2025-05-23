import { LoginForm } from "@/components/auth/login-form"
import { ThemeToggle } from "@/components/theme-toggle" // Added import

export default function Home() {
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
