import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CotisationCriteria {
  id: number;
  name: string;
  description: string | null;
  montantAnnuel: string;
  dateDebut: Date | string;
  dateFin: Date | string;
  joursRetardMax: number;
  isActive: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function CotisationSettings() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] =
    useState<CotisationCriteria | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    montantAnnuel: "",
    dateDebut: "",
    dateFin: "",
    joursRetardMax: "30",
  });

  const { data: criteria = [], isLoading, refetch } = trpc.cotisationSettings.getAll.useQuery();
  const createMutation = trpc.cotisationSettings.create.useMutation();
  const updateMutation = trpc.cotisationSettings.update.useMutation();
  const deleteMutation = trpc.cotisationSettings.delete.useMutation();
  const deactivateMutation = trpc.cotisationSettings.deactivate.useMutation();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        montantAnnuel: formData.montantAnnuel,
        dateDebut: new Date(formData.dateDebut),
        dateFin: new Date(formData.dateFin),
        joursRetardMax: parseInt(formData.joursRetardMax),
      });
      setFormData({
        name: "",
        description: "",
        montantAnnuel: "",
        dateDebut: "",
        dateFin: "",
        joursRetardMax: "30",
      });
      setIsCreateOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create criteria:", error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCriteria) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedCriteria.id,
        name: formData.name || undefined,
        description: formData.description || undefined,
        montantAnnuel: formData.montantAnnuel || undefined,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut) : undefined,
        dateFin: formData.dateFin ? new Date(formData.dateFin) : undefined,
        joursRetardMax: formData.joursRetardMax
          ? parseInt(formData.joursRetardMax)
          : undefined,
      });
      setFormData({
        name: "",
        description: "",
        montantAnnuel: "",
        dateDebut: "",
        dateFin: "",
        joursRetardMax: "30",
      });
      setSelectedCriteria(null);
      setIsEditOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to update criteria:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce critère ?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        refetch();
      } catch (error) {
        console.error("Failed to delete criteria:", error);
      }
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error("Failed to deactivate criteria:", error);
    }
  };

  const openEditDialog = (item: CotisationCriteria) => {
    setSelectedCriteria(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      montantAnnuel: item.montantAnnuel,
      dateDebut: new Date(item.dateDebut).toISOString().split("T")[0],
      dateFin: new Date(item.dateFin).toISOString().split("T")[0],
      joursRetardMax: item.joursRetardMax.toString(),
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Critères de Cotisation</h1>
          <p className="text-gray-600 mt-2">
            Configurez les montants et délais de cotisation pour votre association
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau Critère
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Critère</DialogTitle>
              <DialogDescription>
                Définissez les paramètres de cotisation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du Critère</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="ex: Cotisation 2025"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description optionnelle"
                />
              </div>
              <div>
                <Label htmlFor="montant">Montant Annuel (€)</Label>
                <Input
                  id="montant"
                  type="number"
                  step="0.01"
                  value={formData.montantAnnuel}
                  onChange={(e) =>
                    setFormData({ ...formData, montantAnnuel: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateDebut">Date de Début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) =>
                      setFormData({ ...formData, dateDebut: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dateFin">Date de Fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) =>
                      setFormData({ ...formData, dateFin: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="jours">Jours avant Retard</Label>
                <Input
                  id="jours"
                  type="number"
                  value={formData.joursRetardMax}
                  onChange={(e) =>
                    setFormData({ ...formData, joursRetardMax: e.target.value })
                  }
                  placeholder="30"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : criteria.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucun critère de cotisation défini. Créez-en un pour commencer.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {criteria.map((item: CotisationCriteria) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{item.name}</CardTitle>
                      {item.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                    {item.description && (
                      <CardDescription>{item.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier le Critère</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">Nom du Critère</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-description">
                              Description
                            </Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-montant">
                              Montant Annuel (€)
                            </Label>
                            <Input
                              id="edit-montant"
                              type="number"
                              step="0.01"
                              value={formData.montantAnnuel}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  montantAnnuel: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-dateDebut">
                                Date de Début
                              </Label>
                              <Input
                                id="edit-dateDebut"
                                type="date"
                                value={formData.dateDebut}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    dateDebut: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-dateFin">Date de Fin</Label>
                              <Input
                                id="edit-dateFin"
                                type="date"
                                value={formData.dateFin}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    dateFin: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="edit-jours">
                              Jours avant Retard
                            </Label>
                            <Input
                              id="edit-jours"
                              type="number"
                              value={formData.joursRetardMax}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  joursRetardMax: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Button
                            onClick={handleUpdate}
                            disabled={updateMutation.isPending}
                            className="w-full"
                          >
                            {updateMutation.isPending
                              ? "Mise à jour..."
                              : "Mettre à jour"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(item.id)}
                      disabled={!item.isActive}
                    >
                      Désactiver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Montant Annuel</p>
                    <p className="font-semibold">{item.montantAnnuel} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Jours avant Retard</p>
                    <p className="font-semibold">{item.joursRetardMax} jours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Début</p>
                    <p className="font-semibold">
                      {new Date(item.dateDebut).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fin</p>
                    <p className="font-semibold">
                      {new Date(item.dateFin).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
