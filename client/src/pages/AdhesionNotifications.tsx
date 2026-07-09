import { useState, useMemo } from "react";
import { AlertCircle, Bell, Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdhesionNotifications() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Récupérer les adhérents en retard
  const { data: overdueAdherents = [], isLoading: isLoadingOverdue } =
    trpc.adhesionNotifications.getOverdueAdherents.useQuery({
      year: parseInt(year),
    });

  // Récupérer les statistiques
  const { data: statistics = {} } =
    trpc.adhesionNotifications.getOverdueStatistics.useQuery({
      year: parseInt(year),
    });

  // Envoyer une notification
  const sendNotification = trpc.adhesionNotifications.sendReminderNotification.useMutation({
    onSuccess: () => {
      toast.success("Notification envoyée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de la notification");
    },
  });

  // Envoyer les notifications en masse
  const sendBulkNotifications = trpc.adhesionNotifications.sendBulkReminders.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.count} notifications envoyées`);
      setIsSendingBulk(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi des notifications");
      setIsSendingBulk(false);
    },
  });

  // Filtrer les adhérents
  const filteredAdherents = useMemo(() => {
    return (overdueAdherents as any[]).filter((adherent: any) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        `${adherent.firstName} ${adherent.lastName}`.toLowerCase().includes(searchLower) ||
        adherent.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [overdueAdherents, searchTerm]);

  const handleSendNotification = async (adherent: any) => {
    await sendNotification.mutateAsync({
      cotisationId: adherent.id,
      memberId: adherent.memberId,
      memberEmail: adherent.email,
      memberName: `${adherent.firstName} ${adherent.lastName}`,
      daysOverdue: adherent.daysOverdue,
      amount: parseFloat(adherent.montant),
    });
  };

  const handleSendBulkNotifications = async () => {
    setIsSendingBulk(true);
    await sendBulkNotifications.mutateAsync({ year: parseInt(year) });
  };

  const stats = statistics as any;

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications d'Adhésion</h1>
          <p className="text-gray-600 mt-1">
            Gérez les rappels pour les adhérents en retard de paiement
          </p>
        </div>
        <Button
          onClick={handleSendBulkNotifications}
          disabled={isSendingBulk || filteredAdherents.length === 0}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {isSendingBulk ? "Envoi en cours..." : "Envoyer les rappels"}
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Année</label>
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
              Total en retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOverdue || 0}</div>
            <p className="text-xs text-gray-500 mt-1">adhérents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Montant dû
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalAmount || 0).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Retard moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDaysOverdue || 0}</div>
            <p className="text-xs text-gray-500 mt-1">jours</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Critique (30+ jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalCount || 0}</div>
            <p className="text-xs text-red-500 mt-1">urgent</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des adhérents en retard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Adhérents en retard ({filteredAdherents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOverdue ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : filteredAdherents.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Aucun adhérent en retard</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Adhérent</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-center py-3 px-4">Jours de retard</th>
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
                            adherent.daysOverdue > 30
                              ? "destructive"
                              : adherent.daysOverdue > 7
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {adherent.daysOverdue} j
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {parseFloat(adherent.montant).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          En retard
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendNotification(adherent)}
                          disabled={sendNotification.isPending}
                          className="gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Rappel
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
            • <strong>Envoyer les rappels</strong> : Cliquez sur le bouton "Envoyer les rappels"
            pour notifier tous les adhérents en retard de plus de 7 jours.
          </p>
          <p>
            • <strong>Rappel individuel</strong> : Utilisez le bouton "Rappel" pour envoyer une
            notification à un adhérent spécifique.
          </p>
          <p>
            • <strong>Critiques</strong> : Les adhérents en retard de plus de 30 jours sont
            marqués comme urgents.
          </p>
          <p>
            • <strong>Recherche</strong> : Utilisez la barre de recherche pour filtrer par nom ou
            email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
