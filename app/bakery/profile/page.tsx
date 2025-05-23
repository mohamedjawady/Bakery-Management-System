"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast, useToast } from "@/hooks/use-toast"; // Ensured useToast is imported
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch"; // Ensured Switch is imported
import { Label } from "@/components/ui/label"; // Ensured Label is imported

// Updated Zod schema based on bakeryInfoModel.js
// const openingHoursSchema = z.object({
//   dayOfWeek: z.number().min(0).max(6),
//   dayName: z.string(),
//   openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:mm requis"),
//   closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:mm requis"),
//   isClosed: z.boolean(),
// }); // Ensuring this line is fully commented out.

const bakeryProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères."),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères."),
  postalCode: z.string().regex(/^[0-9]{5}$/, "Code postal invalide (doit être 5 chiffres)."),
  phone: z.string().min(10, "Numéro de téléphone invalide.").optional().or(z.literal('')), // Allow empty string
  email: z.string().email("Adresse e-mail invalide."),
  siret: z.string().optional().or(z.literal('')), // Allow empty string
  vatNumber: z.string().optional().or(z.literal('')), // Allow empty string
  website: z.string().url("URL de site web invalide.").optional().or(z.literal('')), // Allow empty string
  logoUrl: z.string().url("URL de logo invalide.").optional().or(z.literal('')), // Allow empty string
  // openingHours: z.array(openingHoursSchema).optional(),
});

type BakeryProfileFormValues = z.infer<typeof bakeryProfileSchema>;

// const defaultOpeningHours: BakeryProfileFormValues['openingHours'] = [
//   { dayOfWeek: 1, dayName: "Lundi", openTime: "09:00", closeTime: "18:00", isClosed: false },
//   { dayOfWeek: 2, dayName: "Mardi", openTime: "09:00", closeTime: "18:00", isClosed: false },
//   { dayOfWeek: 3, dayName: "Mercredi", openTime: "09:00", closeTime: "18:00", isClosed: false },
//   { dayOfWeek: 4, dayName: "Jeudi", openTime: "09:00", closeTime: "18:00", isClosed: false },
//   { dayOfWeek: 5, dayName: "Vendredi", openTime: "09:00", closeTime: "18:00", isClosed: false },
//   { dayOfWeek: 6, dayName: "Samedi", openTime: "10:00", closeTime: "16:00", isClosed: false },
//   { dayOfWeek: 0, dayName: "Dimanche", openTime: "00:00", closeTime: "00:00", isClosed: true },
// ];

export default function ProfilePage() {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<BakeryProfileFormValues>({
    resolver: zodResolver(bakeryProfileSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      phone: "",
      email: "",
      siret: "",
      vatNumber: "",
      website: "",
      logoUrl: "",
      // openingHours: defaultOpeningHours,
    },
  });

  useEffect(() => {
    const fetchBakeryInfo = async () => {
      setIsLoadingData(true);
      try {
        const token = localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")!).token : null;
        if (!token) {
          toast({
            title: "Erreur d'authentification",
            description: "Veuillez vous reconnecter.",
            variant: "destructive",
          });
          // Optionally redirect to login page
          // router.push('/login'); 
          setIsLoadingData(false);
          return;
        }

        const response = await fetch("/api/bakery-info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Impossible de récupérer les informations de la boulangerie" }));
          throw new Error(errorData.message);
        }
        const data = await response.json();
        if (data) {
          form.reset({
            name: data.name || "",
            address: data.address || "",
            city: data.city || "",
            postalCode: data.postalCode || "",
            phone: data.phone || "",
            email: data.email || "",
            siret: data.siret || "",
            vatNumber: data.vatNumber || "",
            website: data.website || "",
            logoUrl: data.logoUrl || "",
            // openingHours: data.openingHours && data.openingHours.length > 0 ? data.openingHours : defaultOpeningHours,
          });
        } else {
           toast({
            title: "Aucune information de boulangerie trouvée",
            description: "Veuillez remplir le formulaire pour ajouter les informations.",
          });
        }
      } catch (error: any) {
        toast({
          title: "Erreur de chargement",
          description: error.message || "Impossible de charger les informations de la boulangerie. Veuillez réessayer.",
          variant: "destructive",
        });
        console.error("Fetch error:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchBakeryInfo();
  }, [form, toast]);

  async function onProfileSubmit(data: BakeryProfileFormValues) {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")!).token : null;
      if (!token) {
        toast({
          title: "Erreur d'authentification",
          description: "Veuillez vous reconnecter.",
          variant: "destructive",
        });
        // Optionally redirect to login page
        // router.push('/login');
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/bakery-info`, { 
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Une erreur est survenue lors de la sauvegarde." }));
        throw new Error(errorData.message);
      }
      
      const result = await response.json();
      form.reset(result); 

      toast({
        title: "Succès",
        description: "Les informations de la boulangerie ont été mises à jour.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Une erreur inconnue est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => { // Made async for potential API call
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
        variant: "destructive",
      });
      return;
    }
    setIsChangingPassword(true);
    // TODO: Replace with actual API call to change password
    // For now, simulating API call
    try {
      const token = localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")!).token : null;
      if (!token) {
        toast({
          title: "Erreur d'authentification",
          description: "Veuillez vous reconnecter.",
          variant: "destructive",
        });
        setIsChangingPassword(false);
        return;
      }
      // const response = await fetch('/api/user/change-password', { // Example API endpoint
      //   method: 'POST',
      //   headers: { 
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ currentPassword, newPassword }),
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to change password');
      // }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de changement de mot de passe",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profil et Informations</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles, de boulangerie et vos préférences.
          </p>
        </div>

        <Tabs defaultValue="bakery-info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bakery-info">Informations Boulangerie</TabsTrigger>
            {/* <TabsTrigger value="opening-hours">Horaires d'Ouverture</TabsTrigger> */}
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bakery-info">
            <Card>
              <Form {...form}> {/* Encapsulate with Form provider */}
                <form onSubmit={form.handleSubmit(onProfileSubmit)}> {/* Use form.handleSubmit */}
                  <CardHeader>
                    <CardTitle>Détails de la Boulangerie</CardTitle>
                    <CardDescription>
                      Modifiez les informations principales de votre boulangerie.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingData ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-lg">Chargement...</span>
                      </div>
                    ) : (
                      <> {/* Use Fragment to group FormFields */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom de la Boulangerie</FormLabel>
                              <FormControl>
                                <Input placeholder="Nom de votre boulangerie" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Rue Principale" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ville</FormLabel>
                                <FormControl>
                                  <Input placeholder="Paris" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code Postal</FormLabel>
                                <FormControl>
                                  <Input placeholder="75001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input placeholder="+33 1 23 45 67 89" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="contact@maboulangerie.fr" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="siret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SIRET (Optionnel)</FormLabel>
                              <FormControl>
                                <Input placeholder="12345678900011" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vatNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de TVA (Optionnel)</FormLabel>
                              <FormControl>
                                <Input placeholder="FR12345678900" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site Web (Optionnel)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://www.maboulangerie.fr" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="logoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL du Logo (Optionnel)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/logo.png" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isSaving || isLoadingData}>
                      {isSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sauvegarde...</>
                      ) : (
                        "Enregistrer les informations"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* <TabsContent value="opening-hours">
            <Card>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onProfileSubmit)}>
                  <CardHeader>
                    <CardTitle>Horaires d\\'Ouverture</CardTitle>
                    <CardDescription>
                      Gérez les horaires d\\'ouverture de votre boulangerie pour chaque jour de la semaine.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isLoadingData ? (
                       <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-lg">Chargement...</span>
                      </div>
                    ) : (
                      form.getValues('openingHours')?.map((day, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center p-3 border rounded-md">
                          <FormField
                            control={form.control}
                            name={`openingHours.${index}.dayName`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-1">
                                <FormLabel className="sr-only">Jour</FormLabel>
                                <FormControl>
                                 <Input {...field} readOnly className="font-medium border-0 px-0 bg-transparent" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`openingHours.${index}.openTime`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-1">
                                <FormLabel className="text-xs">Ouverture</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} disabled={form.getValues(`openingHours.${index}.isClosed`)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`openingHours.${index}.closeTime`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-1">
                                <FormLabel className="text-xs">Fermeture</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} disabled={form.getValues(`openingHours.${index}.isClosed`)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`openingHours.${index}.isClosed`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4 md:mt-0">
                                <div className="space-y-0.5">
                                  <FormLabel>Fermé</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked);
                                      if (checked) {
                                        form.setValue(`openingHours.${index}.openTime`, '00:00');
                                        form.setValue(`openingHours.${index}.closeTime`, '00:00');
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isSaving || isLoadingData}>
                      {isSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sauvegarde...</>
                      ) : (
                        "Enregistrer les horaires"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent> */}
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>
                  Mettez à jour votre mot de passe pour sécuriser votre compte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour...</>
                  ) : (
                    "Changer le mot de passe"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
