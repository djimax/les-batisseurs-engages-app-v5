import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface AdherentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adherentId?: number;
  onSuccess?: () => void;
}

export function AdherentDetailModal({
  open,
  onOpenChange,
  adherentId,
  onSuccess,
}: AdherentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    status: "active" as const,
  });

  const { data: adherent, isLoading } = trpc.adherents.getByYear.useQuery(
    { year: new Date().getFullYear() },
    { enabled: open }
  );

  const selectedAdherent = adherent?.find(a => a.id === adherentId);

  const updateMutation = trpc.members.update.useMutation({
    onSuccess: () => {
      toast.success("Adhérent mis à jour avec succès");
      setIsEditing(false);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erreur lors de la mise à jour");
    },
  });

  useEffect(() => {
    if (selectedAdherent) {
      setFormData({
        name: `${selectedAdherent.firstName} ${selectedAdherent.lastName}` || "",
        email: selectedAdherent.email || "",
        phone: selectedAdherent.phone || "",
        address: "",
        city: "",
        zipCode: "",
        status: "active",
      });
    }
  }, [selectedAdherent]);

  const handleSave = async () => {
    if (!adherentId) return;

    try {
      await updateMutation.mutateAsync({
        id: adherentId,
        firstName: formData.name.split(" ")[0],
        lastName: formData.name.split(" ").slice(1).join(" "),
        email: formData.email,
        phone: formData.phone,
        status: "active",
      });
    } catch (error) {
      console.error("Error updating adherent:", error);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le profil" : "Détails du profil"}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !selectedAdherent ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as typeof formData.status,
                    })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="active">À jour</SelectItem>
                  <SelectItem value="pending">En retard</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                disabled={!isEditing}
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Code postal</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Fermer
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
