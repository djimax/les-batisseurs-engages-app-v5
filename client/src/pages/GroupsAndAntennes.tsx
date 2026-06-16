import { useState } from "react";
import { trpc } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Edit2, Trash2, Plus, MapPin, Users, Mail, Phone } from "lucide-react";

interface GroupFormData {
  name: string;
  description: string;
  location: string;
  city: string;
  region: string;
  country: string;
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  responsiblePhotoUrl: string;
  status: "active" | "inactive" | "pending";
  photoUrl: string;
}

export default function GroupsAndAntennes() {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    description: "",
    location: "",
    city: "",
    region: "",
    country: "France",
    responsibleName: "",
    responsibleEmail: "",
    responsiblePhone: "",
    responsiblePhotoUrl: "",
    status: "active",
    photoUrl: "",
  });

  const { data: groups = [], isLoading, refetch } = trpc.groups.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    city: cityFilter || undefined,
    search: searchTerm || undefined,
  });

  const createMutation = trpc.groups.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      setErrorMessage("");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      setErrorMessage(`Erreur lors de la création: ${error.message}`);
    },
  });

  const updateMutation = trpc.groups.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      setErrorMessage("");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      setErrorMessage(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  const deleteMutation = trpc.groups.delete.useMutation({
    onSuccess: () => {
      refetch();
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      city: "",
      region: "",
      country: "France",
      responsibleName: "",
      responsibleEmail: "",
      responsiblePhone: "",
      responsiblePhotoUrl: "",
      status: "active",
      photoUrl: "",
    });
    setEditingId(null);
  };

  const openEditDialog = (group: any) => {
    setFormData({
      name: group.name,
      description: group.description || "",
      location: group.location,
      city: group.city,
      region: group.region || "",
      country: group.country || "France",
      responsibleName: group.responsibleName || "",
      responsibleEmail: group.responsibleEmail || "",
      responsiblePhone: group.responsiblePhone || "",
      responsiblePhotoUrl: group.responsiblePhotoUrl || "",
      status: group.status,
      photoUrl: group.photoUrl || "",
    });
    setEditingId(group.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location || !formData.city) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          photoUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResponsiblePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          responsiblePhotoUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "inactive":
        return "Inactif";
      case "pending":
        return "En attente";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groupes & Antennes</h1>
          <p className="text-muted-foreground mt-1">Gérez les groupes locaux et antennes de votre association</p>
        </div>
          <Button onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau groupe
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Rechercher</Label>
                <Input
                  placeholder="Nom du groupe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ville</Label>
                <Input
                  placeholder="Filtrer par ville..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucun groupe trouvé. Créez votre premier groupe pour commencer.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group: any) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  {/* Group Photo */}
                  {group.photoUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 h-40">
                      <img
                        src={group.photoUrl}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Group Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${statusBadgeColor(group.status)}`}>
                        {statusLabel(group.status)}
                      </span>
                    </div>

                    {group.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                    )}

                    {/* Location */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div>
                        <p>{group.location}</p>
                        <p className="text-muted-foreground">{group.city} {group.region && `(${group.region})`}</p>
                      </div>
                    </div>

                    {/* Responsible */}
                    {group.responsibleName && (
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          {group.responsiblePhotoUrl && (
                            <img
                              src={group.responsiblePhotoUrl}
                              alt={group.responsibleName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{group.responsibleName}</p>
                            <p className="text-xs text-muted-foreground">Responsable</p>
                          </div>
                        </div>
                        {group.responsibleEmail && (
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="w-3 h-3" />
                            <a href={`mailto:${group.responsibleEmail}`} className="text-blue-600 hover:underline">
                              {group.responsibleEmail}
                            </a>
                          </div>
                        )}
                        {group.responsiblePhone && (
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${group.responsiblePhone}`} className="text-blue-600 hover:underline">
                              {group.responsiblePhone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Members Count */}
                    {group.memberCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{group.memberCount} membre{group.memberCount > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(group)}
                      className="flex-1 gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(group.id)}
                      className="flex-1 gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier le groupe" : "Créer un nouveau groupe"}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du groupe ou de l'antenne
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="name">Nom du groupe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Groupe de Paris"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du groupe..."
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="ex: 123 Rue de Paris"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="ex: Paris"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Région</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="ex: Île-de-France"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              {/* Group Photo */}
              <div>
                <Label htmlFor="photoUrl">Photo du groupe</Label>
                <Input
                  id="photoUrl"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {formData.photoUrl && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden">
                    <img src={formData.photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Responsible Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Responsable du groupe</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="responsibleName">Nom du responsable</Label>
                    <Input
                      id="responsibleName"
                      value={formData.responsibleName}
                      onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                      placeholder="ex: Jean Dupont"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="responsibleEmail">Email</Label>
                      <Input
                        id="responsibleEmail"
                        type="email"
                        value={formData.responsibleEmail}
                        onChange={(e) => setFormData({ ...formData, responsibleEmail: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="responsiblePhone">Téléphone</Label>
                      <Input
                        id="responsiblePhone"
                        value={formData.responsiblePhone}
                        onChange={(e) => setFormData({ ...formData, responsiblePhone: e.target.value })}
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="responsiblePhotoUrl">Photo du responsable</Label>
                    <Input
                      id="responsiblePhotoUrl"
                      type="file"
                      accept="image/*"
                      onChange={handleResponsiblePhotoChange}
                    />
                    {formData.responsiblePhotoUrl && (
                      <div className="mt-2 w-16 h-16 rounded-full overflow-hidden">
                        <img src={formData.responsiblePhotoUrl} alt="Aperçu" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.location || !formData.city}>
                {editingId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
