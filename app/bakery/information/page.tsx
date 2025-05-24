"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import React, { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

const bakeryInfoSchema = z.object({
  bakeryname: z.string().min(2, {
    message: "Le nom de la boulangerie doit contenir au moins 2 caractères.",
  }),
  bakeryLocation: z.string().min(5, {
    message: "La localisation doit contenir au moins 5 caractères.",
  }),
})

type BakeryInfoFormValues = z.infer<typeof bakeryInfoSchema>

export default function BakeryInformationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [bakeryId, setBakeryId] = useState<string | null>(null)

  const form = useForm<BakeryInfoFormValues>({
    resolver: zodResolver(bakeryInfoSchema),
    defaultValues: {
      bakeryname: "",
      bakeryLocation: "",
    },
  })

  useEffect(() => {
    const fetchBakeryInfo = async () => {
      setIsLoading(true)
      try {
        // Assuming there's only one bakery info entry, or we fetch the first one
        // Adjust API endpoint as needed
        const response = await fetch("/api/bakery") // Corresponds to getAllItems in bakeryController.js
        if (!response.ok) {
          throw new Error("Impossible de récupérer les informations de la boulangerie")
        }
        const data = await response.json()
        if (data && data.length > 0) {
          // Assuming the API returns an array and we take the first element
          const bakeryDetails = data[0]
          form.reset({
            bakeryname: bakeryDetails.bakeryname,
            bakeryLocation: bakeryDetails.bakeryLocation,
          })
          setBakeryId(bakeryDetails._id) // Store the ID for updates
        } else {
          // No bakery info found, user might need to create one
          // For now, we'll let them fill the form to create a new one if no ID is set
           toast({
            title: "Aucune information trouvée",
            description: "Veuillez remplir le formulaire pour ajouter les informations de la boulangerie.",
            variant: "default",
          })
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations de la boulangerie. Veuillez réessayer.",
          variant: "destructive",
        })
        console.error("Fetch error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBakeryInfo()
  }, [form])

  async function onSubmit(data: BakeryInfoFormValues) {
    setIsSaving(true)
    try {
      let response
      if (bakeryId) {
        // Update existing bakery info
        response = await fetch(`/api/bakery/${bakeryId}`, { // Corresponds to updateItem
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
      } else {
        // Create new bakery info
        response = await fetch("/api/bakery", { // Corresponds to addItem
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Une erreur est survenue lors de la sauvegarde.")
      }
      
      const result = await response.json();
      if (!bakeryId && result._id) {
        setBakeryId(result._id); // Store new ID
      }
      // Update form with potentially new data from server (e.g. if server modifies it)
      form.reset(result);


      toast({
        title: "Succès",
        description: "Les informations de la boulangerie ont été mises à jour avec succès.",
      })
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Une erreur inconnue est survenue.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout role="bakery">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Informations de la Boulangerie</h1>
          <p className="text-muted-foreground">
            Gérez les informations de votre boulangerie.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails de la Boulangerie</CardTitle>
            <CardDescription>
              Mettez à jour le nom et la localisation de votre boulangerie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Chargement des informations...</span>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="bakeryname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la Boulangerie</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Boulangerie du Centre" {...field} />
                        </FormControl>
                        <FormDescription>
                          Le nom officiel de votre établissement.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bakeryLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localisation de la Boulangerie</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 123 Rue Principale, Paris" {...field} />
                        </FormControl>
                        <FormDescription>
                          L'adresse complète de votre boulangerie.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
