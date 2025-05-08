"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Croissant, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // In a real application, this would be an API call to authenticate
      // For demo purposes, we'll simulate authentication with predefined users
      const users = [
        { email: "admin@boulangerie.fr", password: "admin123", role: "admin" },
        { email: "bakery@boulangerie.fr", password: "bakery123", role: "bakery" },
        { email: "lab@boulangerie.fr", password: "lab123", role: "laboratory" },
        { email: "delivery@boulangerie.fr", password: "delivery123", role: "delivery" },
      ]

      const user = users.find((u) => u.email === email && u.password === password)

      if (user) {
        // In a real app, we would store the JWT token and user info
        localStorage.setItem("user", JSON.stringify({ email: user.email, role: user.role }))

        // Redirect based on role
        switch (user.role) {
          case "admin":
            router.push("/admin/dashboard")
            break
          case "bakery":
            router.push("/bakery/dashboard")
            break
          case "laboratory":
            router.push("/laboratory/dashboard")
            break
          case "delivery":
            router.push("/delivery/dashboard")
            break
          default:
            router.push("/bakery/dashboard")
        }

        toast({
          title: "Connexion réussie",
          description: `Bienvenue, vous êtes connecté en tant que ${user.role}`,
        })
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <Croissant className="h-10 w-10 text-amber-500" />
        </div>
        <CardTitle className="text-2xl text-center">Boulangerie Manager</CardTitle>
        <CardDescription className="text-center">Connectez-vous pour accéder à votre espace</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@boulangerie.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Utilisateurs de démonstration:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Admin: admin@boulangerie.fr / admin123</li>
              <li>Boulangerie: bakery@boulangerie.fr / bakery123</li>
              <li>Laboratoire: lab@boulangerie.fr / lab123</li>
              <li>Livraison: delivery@boulangerie.fr / delivery123</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={isLoading}>
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
    </Card>
  )
}
