'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const laboratoryInfoSchema = z.object({
  labName: z.string().min(1, 'Le nom du laboratoire est requis'),
  headChef: z.string().min(1, 'Le nom du chef de laboratoire est requis'),
  address: z.string().min(1, "L'adresse est requise"),
  phone: z.string().min(1, 'Le numéro de téléphone est requis')
    .regex(/^(\+?\d{1,3}[- ]?)?\d{9,15}$/, 'Numéro de téléphone invalide'),
  email: z.string().email('Adresse e-mail invalide'),
  hygieneStandards: z.string().optional(),
  equipmentMaintenanceSchedule: z.string().optional(),
  notes: z.string().optional(),
});

type LaboratoryInfoFormValues = z.infer<typeof laboratoryInfoSchema>;

interface LaboratoryInfoData extends LaboratoryInfoFormValues {
  _id?: string;
  singleton?: string;
  createdAt?: string;
  updatedAt?: string;
}

function LaboratoryInformationContent() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<LaboratoryInfoFormValues>({
    resolver: zodResolver(laboratoryInfoSchema),
    defaultValues: {
      labName: '',
      headChef: '',
      address: '',
      phone: '',
      email: '',
      hygieneStandards: '',
      equipmentMaintenanceSchedule: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchLaboratoryInfo = async () => {
      setIsFetching(true);
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
          toast({ title: 'Erreur d\'authentification', description: 'Utilisateur non connecté.', variant: 'destructive' });
          router.push('/login');
          return;
        }
        const { token } = JSON.parse(userInfo);

        const fetchResponse = await fetch('/api/laboratory-info', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!fetchResponse.ok) {
          throw new Error('Échec de la récupération des informations du laboratoire');
        }
        const data: LaboratoryInfoData = await fetchResponse.json();
        form.reset(data); 
      } catch (error) {
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Impossible de récupérer les données du laboratoire.',
          variant: 'destructive',
        });
      } finally {
        setIsFetching(false);
      }
    };
    fetchLaboratoryInfo();
  }, [form, toast, router]);

  const onSubmit = async (values: LaboratoryInfoFormValues) => {
    setIsLoading(true);
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        toast({ title: 'Erreur d\'authentification', description: 'Utilisateur non connecté.', variant: 'destructive' });
        router.push('/login');
        return;
      }
      const { token } = JSON.parse(userInfo);

      const updateResponse = await fetch('/api/laboratory-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Échec de la mise à jour des informations du laboratoire');
      }

      const result = await updateResponse.json(); 
      toast({
        title: 'Succès',
        description: result.message || 'Informations du laboratoire mises à jour avec succès.',
      });
      form.reset(result.data); 

    } catch (error) {
      toast({
        title: 'Erreur lors de la mise à jour',
        description: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="flex justify-center items-center h-screen">Chargement des informations du laboratoire...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres du Laboratoire</h1>
        <p className="text-muted-foreground mt-1">
          Gérez et mettez à jour les informations générales et les détails spécifiques du laboratoire.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du Laboratoire</CardTitle>
          <CardDescription>Modifiez les détails spécifiques du laboratoire ci-dessous. Cliquez sur enregistrer lorsque vous avez terminé.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="labName">Nom du Laboratoire</Label>
                <Input id="labName" {...form.register('labName')} className="mt-1" />
                {form.formState.errors.labName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.labName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="headChef">Chef de Laboratoire</Label>
                <Input id="headChef" {...form.register('headChef')} className="mt-1" />
                {form.formState.errors.headChef && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.headChef.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...form.register('address')} className="mt-1" />
              {form.formState.errors.address && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" {...form.register('phone')} className="mt-1" />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...form.register('email')} className="mt-1" />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>
            
            {/* Fields kept for review, uncomment to add them to the form */}
            {/* <div>
              <Label htmlFor="hygieneStandards">Normes d'hygiène</Label>
              <Textarea id="hygieneStandards" {...form.register('hygieneStandards')} className="mt-1" rows={3}/>
            </div>
            <div>
              <Label htmlFor="equipmentMaintenanceSchedule">Calendrier de maintenance des équipements</Label>
              <Textarea id="equipmentMaintenanceSchedule" {...form.register('equipmentMaintenanceSchedule')} className="mt-1" rows={3}/>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...form.register('notes')} className="mt-1" rows={4}/>
            </div> */}

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LaboratoryInformationPage() {
  return (
    <DashboardLayout role="laboratory">
      <LaboratoryInformationContent />
    </DashboardLayout>
  );
}

