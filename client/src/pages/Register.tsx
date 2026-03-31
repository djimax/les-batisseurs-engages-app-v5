import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const registerMutation = trpc.localAuth.register.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    // Validation
    const newErrors: string[] = [];

    if (!formData.email) {
      newErrors.push("L'email est requis");
    }

    if (!formData.password) {
      newErrors.push("Le mot de passe est requis");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.push("Les mots de passe ne correspondent pas");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Store session token in localStorage
      localStorage.setItem("sessionToken", result.sessionToken);

      toast.success("Inscription réussie!");
      setLocation("/dashboard");
    } catch (error: any) {
      const errorMessage = error.message || "Erreur lors de l'inscription";
      setErrors([errorMessage]);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Les Bâtisseurs Engagés</h1>
            <p className="text-muted-foreground">Créer un compte</p>
          </div>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prénom</label>
                <Input
                  type="text"
                  name="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nom</label>
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Inscription..." : "Créer un compte"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Vous avez déjà un compte?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/login")}
            >
              Se connecter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
