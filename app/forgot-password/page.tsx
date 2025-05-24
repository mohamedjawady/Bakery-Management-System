'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Veuillez entrer une adresse e-mail valide'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetTokenSent, setResetTokenSent] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de l\'envoi des instructions de réinitialisation');
      }

      const data = await response.json();
      setResetToken(data.resetToken);
      setResetTokenSent(true);
      
      toast({
        title: 'Instructions envoyées',
        description: 'Si un compte avec cette adresse e-mail existe, vous recevrez des instructions de réinitialisation.',
      });    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (resetTokenSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Mail className="h-6 w-6 text-green-600" />
                Vérifiez votre e-mail
              </CardTitle>
              <CardDescription>
                Les instructions de réinitialisation ont été envoyées à votre adresse e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Si vous ne recevez pas d'e-mail dans quelques minutes, veuillez vérifier votre dossier spam.
                </p>
                
                {/* For testing purposes, show the reset token */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    À des fins de test uniquement :
                  </p>
                  <p className="text-xs text-yellow-700 mb-2">Jeton de réinitialisation :</p>
                  <code className="text-xs bg-yellow-100 px-2 py-1 rounded break-all">
                    {resetToken}
                  </code>
                  <p className="text-xs text-yellow-700 mt-2">
                    Utilisez ce jeton dans le formulaire de réinitialisation.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Link href="/reset-password">
                  <Button className="w-full">
                    Réinitialiser le mot de passe
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Mot de passe oublié ?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entrez votre adresse e-mail et nous vous enverrons des instructions pour réinitialiser votre mot de passe.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Réinitialiser le mot de passe
            </CardTitle>
            <CardDescription>
              Nous enverrons les instructions de réinitialisation à votre adresse e-mail.
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  className="mt-1"
                  placeholder="Entrez votre adresse e-mail"
                />
                {form.formState.errors.email && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Envoi en cours...' : 'Envoyer les instructions'}
                </Button>
                
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
