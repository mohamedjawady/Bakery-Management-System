'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
// import { useToast } from '@/components/ui/use-toast'; Removed useToast
import { Croissant, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type UserFormValue = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  // const { toast } = useToast(); Removed useToast
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null); // Added loginError state

  const defaultValues = {
    email: '',
    password: '',
  };

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: UserFormValue) => {
    setIsLoading(true);
    setLoginError(null); // Clear previous errors
    let targetPath = "/";
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLoginError('Email ou mot de passe incorrect.');
        } else {
          try {
            const errorResult = await response.json();
            setLoginError(errorResult.message || `Erreur ${response.status}: Une erreur est survenue.`);
          } catch (e) {
            setLoginError(`Erreur ${response.status}: Une erreur est survenue.`);
          }
        }
        setIsLoading(false); // Set loading to false on error
        return; 
      }

      const result = await response.json();
      console.log('result',result);
      
      localStorage.setItem('userInfo', JSON.stringify(result));
      // toast({ // Success toast can remain or be removed based on preference, focusing on error handling now
      //   title: 'Connexion réussie',
      //   description: `Bienvenue, ${result.name}!`,
      // });

      console.log('[Login Form] User role:', result.role);

      switch (result.role) {
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
          targetPath = "/";
      }

      console.log(`[Login Form] Attempting to redirect to ${targetPath}`);
      try {
        await router.push(targetPath);
        console.log(`[Login Form] Successfully initiated navigation to ${targetPath}`);
      } catch (navError: any) {
        console.error('[Login Form] Navigation error:', navError);
        setLoginError(navError.message || `Impossible de naviguer vers ${targetPath}. Une erreur de redirection est survenue.`);
        setIsLoading(false); // Set loading to false on navigation error
        return; // Stop execution if navigation fails
      }
    } catch (error: any) { 
      setLoginError(error.message || 'Une erreur réseau ou inattendue est survenue.');
      setIsLoading(false); // Set loading to false on catch-all error
      return; // Stop execution on error
    }
    // Removed finally block, setIsLoading(false) is handled in all paths including success
    setIsLoading(false); // Ensure loading is false on successful completion before potential redirect
  };

  return (
    <Card className="border-2 w-full max-w-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <Croissant className="h-10 w-10 text-amber-500" />
        </div>
        <CardTitle className="text-2xl text-center">Boulangerie Manager</CardTitle>
        <CardDescription className="text-center">Connectez-vous pour accéder à votre espace</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {loginError && (
              <div className="mb-4 text-center text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700/50 shadow-sm">
                <p className="font-medium">Erreur de connexion</p>
                <p>{loginError}</p>
              </div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="exemple@boulangerie.fr"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Votre mot de passe"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Forgot password link hidden as per user request */}
            {/* <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                Mot de passe oublié ?
              </Link>
            </div> */}
          </CardContent>
          <CardFooter>
            <Button disabled={isLoading} className="w-full" type="submit">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}