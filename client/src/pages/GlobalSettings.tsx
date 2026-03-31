import { useState, useEffect } from "react";
import { HeroSection } from "@/components/HeroSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Settings, Upload, Save, RotateCcw, Mail, Globe, MapPin, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function GlobalSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Fetch global settings from database
  const { data: settings, isLoading, refetch } = trpc.globalSettings.get.useQuery();
  const updateMutation = trpc.globalSettings.update.useMutation();

  // Local state for form
  const [formData, setFormData] = useState({
    associationName: "",
    seatCity: "",
    folio: "",
    email: "",
    website: "",
    phone: "",
    description: "",
  });

  // Initialize form with fetched data
  useEffect(() => {
    if (settings) {
      setFormData({
        associationName: settings.associationName || "",
        seatCity: settings.seatCity || "",
        folio: settings.folio || "",
        email: settings.email || "",
        website: settings.website || "",
        phone: settings.phone || "",
        description: settings.description || "",
      });
      if (settings.logo) {
        setLogoPreview(settings.logo);
      }
    }
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Le logo ne doit pas dépasser 2MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      toast.success("Logo chargé avec succès");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        ...formData,
        logo: logoPreview,
      });
      toast.success("Paramètres modifiés avec succès");
      // Invalider le cache pour mettre à jour immédiatement le tableau de bord
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la modification");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser les paramètres par défaut ?")) {
      setFormData({
        associationName: "Les Bâtisseurs Engagés",
        seatCity: "N'djaména-tchad",
        folio: "10512",
        email: "contact.lesbatisseursengages@gmail.com",
        website: "www.lesbatisseursengage.com",
        phone: "",
        description: "",
      });
      setLogoPreview(null);
      toast.success("Paramètres réinitialisés");
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    toast.success("Logo supprimé");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection
        title="Paramètres Globaux"
        subtitle="Gérez les informations de votre association"
        icon="⚙️"
        variant="accent"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Logo Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo de l'Association
            </CardTitle>
            <CardDescription>Téléchargez votre logo (max 2MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoPreview ? (
              <div className="space-y-3">
                <div className="relative w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleRemoveLogo}
                  className="w-full"
                >
                  Supprimer le logo
                </Button>
              </div>
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Aucun logo</p>
                </div>
              </div>
            )}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="w-full">
                Choisir un fichier
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informations de l'Association
            </CardTitle>
            <CardDescription>Mettez à jour les détails de votre association</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Association Name */}
            <div className="space-y-2">
              <Label htmlFor="associationName" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Nom de l'association
              </Label>
              <Input
                id="associationName"
                name="associationName"
                value={formData.associationName}
                onChange={handleInputChange}
                placeholder="Nom de l'association"
              />
            </div>

            {/* Seat City */}
            <div className="space-y-2">
              <Label htmlFor="seatCity" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Siège social
              </Label>
              <Input
                id="seatCity"
                name="seatCity"
                value={formData.seatCity}
                onChange={handleInputChange}
                placeholder="Siège social"
              />
            </div>

            {/* Folio */}
            <div className="space-y-2">
              <Label htmlFor="folio">Folio N°</Label>
              <Input
                id="folio"
                name="folio"
                value={formData.folio}
                onChange={handleInputChange}
                placeholder="Numéro de folio"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email de contact"
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site web
              </Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Site web"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Numéro de téléphone"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description de l'association"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || updateMutation.isPending}
                className="flex-1 gap-2"
              >
                {isSaving || updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Modifier
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>ℹ️ Note :</strong> Les paramètres sont synchronisés avec la base de données. 
            Ils seront utilisés pour afficher les informations de l'association sur la page d'accueil et dans le tableau de bord.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
