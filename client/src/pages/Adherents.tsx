import { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, Download, Users, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const STATUT_COLORS: Record<string, string> = {
  "À jour": "bg-green-100 text-green-800",
  "En retard": "bg-yellow-100 text-yellow-800",
  Impayé: "bg-red-100 text-red-800",
  Exempté: "bg-blue-100 text-blue-800",
};

export default function Adherents() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch adherents from tRPC
  const { data: adherents = [], isLoading, error } = trpc.adherents.getByYear.useQuery({
    year: parseInt(year),
  });

  // Map the data to match our expected structure
  const mappedAdherents = useMemo(() => {
    return (adherents as any[]).map((adherent: any) => ({
      id: adherent.id,
      memberId: adherent.memberId,
      firstName: adherent.firstName,
      lastName: adherent.lastName,
      email: adherent.email,
      phone: adherent.phone,
      adhesionStatus: adherent.cotisationStatus || "Impayé",
      adhesionAmount: adherent.cotisationAmount || 0,
      cotisations: [
        {
          dateDebut: adherent.cotisationStartDate,
          dateFin: adherent.cotisationEndDate,
          statut: adherent.cotisationStatus,
        },
      ],
    }));
  }, [adherents]);

  // Apply filters
  const filteredAdherents = useMemo(() => {
    return mappedAdherents.filter((member: any) => {
      if (
        statusFilter &&
        member.adhesionStatus.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          `${member.firstName} ${member.lastName}`
            .toLowerCase()
            .includes(search) ||
          member.email?.toLowerCase().includes(search) ||
          member.memberId?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [mappedAdherents, statusFilter, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = mappedAdherents.length;
    const upToDate = mappedAdherents.filter((m: any) => m.adhesionStatus === "payée")
      .length;
    const overdue = mappedAdherents.filter((m: any) => m.adhesionStatus === "en retard")
      .length;
    const unpaid = mappedAdherents.filter((m: any) => m.adhesionStatus === "Impayé")
      .length;
    const exempt = mappedAdherents.filter((m: any) => m.adhesionStatus === "Exempté")
      .length;
    const totalAmount = mappedAdherents.reduce(
      (sum: number, m: any) => sum + (parseFloat(m.adhesionAmount) || 0),
      0
    );

    return { total, upToDate, overdue, unpaid, exempt, totalAmount };
  }, [mappedAdherents]);

  const handleExportCSV = () => {
    if (filteredAdherents.length === 0) {
      toast.error("Aucun adhérent à exporter");
      return;
    }

    const headers = [
      "ID Membre",
      "Nom",
      "Prénom",
      "Email",
      "Téléphone",
      "Statut Adhésion",
      "Montant",
      "Date Début",
      "Date Fin",
    ];

    const rows = filteredAdherents.map((member: any) => [
      member.memberId || "",
      member.lastName || "",
      member.firstName || "",
      member.email || "",
      member.phone || "",
      member.adhesionStatus || "",
      member.adhesionAmount || "",
      new Date(member.cotisations?.[0]?.dateDebut).toLocaleDateString(
        "fr-FR"
      ) || "",
      new Date(member.cotisations?.[0]?.dateFin).toLocaleDateString("fr-FR") ||
        "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `adherents-${year}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${filteredAdherents.length} adhérent(s) exporté(s)`);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liste des Adhérents</h1>
          <p className="text-muted-foreground">
            Adhérents à jour de paiement pour l'année {year}
          </p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Adhérents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Année {year}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              À Jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.upToDate}
            </div>
            <p className="text-xs text-muted-foreground">Paiement effectué</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">À relancer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impayé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.unpaid}
            </div>
            <p className="text-xs text-muted-foreground">Non payé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAmount.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground">Collecté</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Année</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut d'Adhésion</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="payée">À Jour (Payée)</SelectItem>
                  <SelectItem value="en retard">En Retard</SelectItem>
                  <SelectItem value="impayé">Impayé</SelectItem>
                  <SelectItem value="exempté">Exempté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rechercher</label>
              <Input
                placeholder="Nom, email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des adhérents
          </AlertDescription>
        </Alert>
      )}

      {/* Adherents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adhérents</CardTitle>
          <CardDescription>
            {filteredAdherents.length} adhérent(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredAdherents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun adhérent trouvé pour les critères sélectionnés
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Période</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdherents.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.memberId}
                      </TableCell>
                      <TableCell>
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell>{member.email || "-"}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            member.adhesionStatus === "payée"
                              ? "bg-green-100 text-green-800"
                              : member.adhesionStatus === "en retard"
                                ? "bg-yellow-100 text-yellow-800"
                                : member.adhesionStatus === "Impayé"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                          }
                        >
                          {member.adhesionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {parseFloat(member.adhesionAmount).toLocaleString(
                          "fr-FR",
                          {
                            style: "currency",
                            currency: "EUR",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        {member.cotisations?.[0]
                          ? `${new Date(
                              member.cotisations[0].dateDebut
                            ).toLocaleDateString("fr-FR")} - ${new Date(
                              member.cotisations[0].dateFin
                            ).toLocaleDateString("fr-FR")}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">ℹ️ À propos de cette liste</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-2 text-sm">
          <p>
            • Cette liste affiche uniquement les adhérents à jour de paiement
            pour l'année sélectionnée
          </p>
          <p>
            • Un adhérent doit avoir effectué son paiement d'adhésion pour
            apparaître dans cette liste
          </p>
          <p>
            • La liste est annuelle et se réinitialise chaque année
          </p>
          <p>
            • Vous pouvez filtrer par statut d'adhésion et rechercher par nom
            ou email
          </p>
          <p>
            • Utilisez l'export CSV pour générer un rapport des adhérents
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
