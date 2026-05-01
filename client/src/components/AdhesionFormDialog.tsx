import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AdhesionFormDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AdhesionFormDialog({ onSuccess, trigger }: AdhesionFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: "",
    annee: new Date().getFullYear(),
    montant: "",
    dateAdhesion: new Date().toISOString().split("T")[0],
    dateExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "pending",
  });

  const { data: members = [] } = trpc.users.list.useQuery();
  const createMutation = trpc.memberships.createMembership.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMutation.mutateAsync({
        memberId: parseInt(formData.memberId),
        membershipTypeId: 1, // À adapter selon les types disponibles
        startDate: formData.dateAdhesion,
        endDate: formData.dateExpiration,
        amount: parseFloat(formData.montant),
      });

      toast.success("Adhésion créée avec succès");
      setOpen(false);
      setFormData({
        memberId: "",
        annee: new Date().getFullYear(),
        montant: "",
        dateAdhesion: new Date().toISOString().split("T")[0],
        dateExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "pending",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'adhésion:", error);
      toast.error("Erreur lors de la création de l'adhésion");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Adhésion
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle adhésion</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer une nouvelle adhésion
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberId">Membre</Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) =>
                setFormData({ ...formData, memberId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {(members as any[]).map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annee">Année</Label>
            <Input
              id="annee"
              type="number"
              value={formData.annee}
              onChange={(e) =>
                setFormData({ ...formData, annee: parseInt(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant">Montant (€)</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) =>
                setFormData({ ...formData, montant: e.target.value })
              }
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateAdhesion">Date d'adhésion</Label>
            <Input
              id="dateAdhesion"
              type="date"
              value={formData.dateAdhesion}
              onChange={(e) =>
                setFormData({ ...formData, dateAdhesion: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateExpiration">Date d'expiration</Label>
            <Input
              id="dateExpiration"
              type="date"
              value={formData.dateExpiration}
              onChange={(e) =>
                setFormData({ ...formData, dateExpiration: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
