import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, User, Mail, Phone, Shield } from "lucide-react";

interface ActorFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  responsibilities: string;
  permissions: string[];
  photoUrl: string;
  status: "active" | "inactive" | "on_leave";
}

const initialFormData: ActorFormData = {
  name: "",
  email: "",
  phone: "",
  role: "",
  responsibilities: "",
  permissions: [],
  photoUrl: "",
  status: "active",
};

const AVAILABLE_PERMISSIONS = [
  "create_projects",
  "edit_projects",
  "delete_projects",
  "manage_members",
  "manage_budget",
  "manage_documents",
  "view_reports",
  "export_data",
  "manage_roles",
];

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  on_leave: "bg-yellow-100 text-yellow-800",
};

const STATUS_LABELS = {
  active: "Actif",
  inactive: "Inactif",
  on_leave: "En congé",
};

export default function Actors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ActorFormData>(initialFormData);

  // Queries
  const { data: actors = [], isLoading, refetch } = trpc.actors.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    role: roleFilter === "all" ? undefined : roleFilter,
    search: searchTerm || undefined,
  });

  // Mutations
  const createMutation = trpc.actors.create.useMutation({
    onSuccess: () => {
      toast.success("Acteur créé avec succès");
      setIsDialogOpen(false);
      setFormData(initialFormData);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.actors.update.useMutation({
    onSuccess: () => {
      toast.success("Acteur modifié avec succès");
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(initialFormData);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.actors.delete.useMutation({
    onSuccess: () => {
      toast.success("Acteur supprimé avec succès");
      setDeleteId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.role) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (actor: any) => {
    setEditingId(actor.id);
    setFormData({
      name: actor.name,
      email: actor.email || "",
      phone: actor.phone || "",
      role: actor.role,
      responsibilities: actor.responsibilities || "",
      permissions: actor.permissions || [],
      photoUrl: actor.photoUrl || "",
      status: actor.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const filteredActors = actors.filter((actor) => {
    const matchesSearch =
      actor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const uniqueRoles = Array.from(new Set(actors.map((a) => a.role)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Acteurs</h1>
          <p className="text-gray-600 mt-1">
            Gérez les rôles, responsabilités et permissions des acteurs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData(initialFormData);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvel Acteur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Modifier l'acteur" : "Créer un nouvel acteur"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nom *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nom de l'acteur"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Rôle *
                  </label>
                  <Input
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    placeholder="Ex: Directeur, Coordinateur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+33 6 XX XX XX XX"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Responsabilités
                </label>
                <Textarea
                  value={formData.responsibilities}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsibilities: e.target.value,
                    })
                  }
                  placeholder="Décrivez les responsabilités..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [
                                ...formData.permissions,
                                permission,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter(
                                (p) => p !== permission
                              ),
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {permission.replace(/_/g, " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="on_leave">En congé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Photo URL
                  </label>
                  <Input
                    value={formData.photoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, photoUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingId(null);
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleSubmit}>
                  {editingId ? "Modifier" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">
            Recherche
          </label>
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="text-sm font-medium text-gray-700">Statut</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="on_leave">En congé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <label className="text-sm font-medium text-gray-700">Rôle</label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actors Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement des acteurs...</p>
        </div>
      ) : filteredActors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun acteur trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActors.map((actor) => (
            <Card key={actor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {actor.photoUrl ? (
                      <img
                        src={actor.photoUrl}
                        alt={actor.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{actor.name}</CardTitle>
                      <p className="text-sm text-gray-600">{actor.role}</p>
                    </div>
                  </div>
                  <Badge
                    className={STATUS_COLORS[actor.status as keyof typeof STATUS_COLORS]}
                  >
                    {STATUS_LABELS[actor.status as keyof typeof STATUS_LABELS]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {actor.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${actor.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {actor.email}
                    </a>
                  </div>
                )}
                {actor.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${actor.phone}`} className="text-blue-600 hover:underline">
                      {actor.phone}
                    </a>
                  </div>
                )}
                {actor.responsibilities && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Responsabilités:</p>
                    <p className="line-clamp-2">{actor.responsibilities}</p>
                  </div>
                )}
                {actor.permissions && actor.permissions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Permissions
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {actor.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.replace(/_/g, " ")}
                        </Badge>
                      ))}
                      {actor.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{actor.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(actor)}
                    className="flex-1 gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(actor.id)}
                    className="flex-1 gap-1"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer cet acteur ? Cette action ne peut pas être
            annulée.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
