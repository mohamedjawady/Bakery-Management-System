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
import { useToast } from '@/components/ui/use-toast';
import { Croissant, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type UserFormValue = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

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
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      localStorage.setItem('userInfo', JSON.stringify(result));
      toast({
        title: 'Connexion réussie',
        description: `Bienvenue, ${result.name}!`,
      });

      console.log('[Login Form] User role:', result.role);

      let targetPath = "/";
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
        toast({
          title: 'Erreur de redirection',
          description: navError.message || `Impossible de naviguer vers ${targetPath}.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Une erreur est survenue lors de la connexion.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
            />
            <FormField
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
