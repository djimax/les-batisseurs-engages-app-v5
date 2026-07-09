import { useState, useMemo } from "react";
import { RefreshCw, Send, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdhesionRenewals() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [renewalAmount, setRenewalAmount] = useState<string>("50");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Récupérer les adhésions expirées
  const { data: expiringAdherents = [], isLoading: isLoadingExpiring } =
    trpc.adhesionRenewals.getExpiredAdhesions.useQuery({
      daysBeforeExpiry: 15,
    });

  // Récupérer les statistiques
  const { data: statistics = {} } = trpc.adhesionRenewals.getRenewalStatistics.useQuery({
    year: parseInt(year),
  });

  // Créer un renouvellement
  const createRenewal = trpc.adhesionRenewals.createRenewal.useMutation({
    onSuccess: () => {
      toast.success("Renouvellement créé avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la création du renouvellement");
    },
  });

  // Créer les renouvellements en masse
  const createBulkRenewals = trpc.adhesionRenewals.createBulkRenewals.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.count} renouvellements créés`);
      setIsProcessing(false);
    },
    onError: () => {
      toast.error("Erreur lors de la création des renouvellements");
      setIsProcessing(false);
    },
  });

  // Envoyer les rappels
  const sendReminders = trpc.adhesionRenewals.sendRenewalReminders.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.count} rappels envoyés`);
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi des rappels");
    },
  });

  // Filtrer les adhérents
  const filteredAdherents = useMemo(() => {
    return (expiringAdherents as any[]).filter((adherent: any) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        `${adherent.firstName} ${adherent.lastName}`.toLowerCase().includes(searchLower) ||
        adherent.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [expiringAdherents, searchTerm]);

  const handleCreateRenewal = async (adherent: any) => {
    await createRenewal.mutateAsync({
      cotisationId: adherent.id,
      memberId: adherent.memberId,
      amount: parseFloat(renewalAmount),
      year: parseInt(year),
    });
  };

  const handleCreateBulkRenewals = async () => {
    setIsProcessing(true);
    await createBulkRenewals.mutateAsync({
      year: parseInt(year),
      amount: parseFloat(renewalAmount),
    });
  };

  const handleSendReminders = async () => {
    await sendReminders.mutateAsync({ daysBeforeExpiry: 15 });
  };

  const stats = statistics as any;

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Renouvellements d'Adhésion</h1>
          <p className="text-gray-600 mt-1">
            Gérez les renouvellements automatiques d'adhésion
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSendReminders}
            disabled={sendReminders.isPending}
            variant="outline"
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            Envoyer rappels
          </Button>
          <Button
            onClick={handleCreateBulkRenewals}
            disabled={isProcessing || filteredAdherents.length === 0}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {isProcessing ? "Création..." : "Créer renouvellements"}
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Année de renouvellement</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Montant du renouvellement (€)</label>
          <Input
            type="number"
            value={renewalAmount}
            onChange={(e) => setRenewalAmount(e.target.value)}
            placeholder="50"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Rechercher</label>
          <Input
            placeholder="Nom, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total expirant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExpiring || 0}</div>
            <p className="text-xs text-gray-500 mt-1">adhésions</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Renouvelées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.renewedCount || 0}</div>
            <p className="text-xs text-green-600 mt-1">adhésions</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingCount || 0}</div>
            <p className="text-xs text-orange-600 mt-1">adhésions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taux de renouvellement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.renewalRate || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">complétés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des adhésions expirantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Adhésions expirant bientôt ({filteredAdherents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingExpiring ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : filteredAdherents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 mx-auto text-green-300 mb-2" />
              <p className="text-gray-500">Aucune adhésion n'expire bientôt</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Adhérent</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-center py-3 px-4">Jours restants</th>
                    <th className="text-right py-3 px-4">Montant</th>
                    <th className="text-center py-3 px-4">Statut</th>
                    <th className="text-center py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdherents.map((adherent: any) => (
                    <tr key={adherent.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        {adherent.firstName} {adherent.lastName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{adherent.email}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            adherent.daysUntilExpiry <= 7
                              ? "destructive"
                              : adherent.daysUntilExpiry <= 14
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {adherent.daysUntilExpiry} j
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {parseFloat(adherent.montant).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Expire bientôt
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateRenewal(adherent)}
                          disabled={createRenewal.isPending}
                          className="gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Renouveler
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guide d'utilisation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Guide d'utilisation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • <strong>Créer renouvellements</strong> : Cliquez sur "Créer renouvellements" pour
            générer automatiquement les nouvelles adhésions pour l'année sélectionnée.
          </p>
          <p>
            • <strong>Renouvellement individuel</strong> : Utilisez le bouton "Renouveler" pour
            créer une adhésion pour un adhérent spécifique.
          </p>
          <p>
            • <strong>Envoyer rappels</strong> : Cliquez sur "Envoyer rappels" pour notifier les
            adhérents dont l'adhésion expire dans 15 jours.
          </p>
          <p>
            • <strong>Montant</strong> : Définissez le montant du renouvellement avant de créer
            les adhésions.
          </p>
          <p>
            • <strong>Statuts</strong> : Les adhésions renouvelées sont marquées comme "À jour"
            automatiquement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
