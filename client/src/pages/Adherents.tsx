import { useMemo, useState } from "react";
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
import {
  AlertCircle,
  Download,
  Users,
  Filter,
  Search,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const STATUT_COLORS: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  "À jour": {
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  "En retard": {
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-700",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  Impayé: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: <XCircle className="w-4 h-4" />,
  },
  Exempté: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    icon: <Shield className="w-4 h-4" />,
  },
};

export default function Adherents() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch adherents from tRPC
  const {
    data: adherents = [],
    isLoading,
    error,
  } = trpc.adherents.getByYear.useQuery({
    year: parseInt(year),
  });

  // Filter and search adherents
  const filteredAdherents = useMemo(() => {
    return adherents.filter((adherent: any) => {
      const matchesStatus =
        !statusFilter ||
        adherent.cotisationStatus === statusFilter;
      const matchesSearch =
        !searchTerm ||
        adherent.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        adherent.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [adherents, statusFilter, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = adherents.length;
    const upToDate = adherents.filter(
      (a: any) => a.cotisationStatus === "À jour"
    ).length;
    const overdue = adherents.filter(
      (a: any) => a.cotisationStatus === "En retard"
    ).length;
    const unpaid = adherents.filter(
      (a: any) => a.cotisationStatus === "Impayé"
    ).length;
    const exempt = adherents.filter(
      (a: any) => a.cotisationStatus === "Exempté"
    ).length;
    const totalAmount = adherents.reduce(
      (sum: number, a: any) => sum + (a.cotisationAmount || 0),
      0
    );
    const paidAmount = adherents
      .filter((a: any) => a.cotisationStatus === "À jour")
      .reduce((sum: number, a: any) => sum + (a.cotisationAmount || 0), 0);

    return {
      total,
      upToDate,
      overdue,
      unpaid,
      exempt,
      totalAmount,
      paidAmount,
      paymentRate:
        total > 0
          ? Math.round((upToDate / total) * 100)
          : 0,
    };
  }, [adherents]);

  const handleExportCSV = () => {
    const headers = [
      "Nom",
      "Email",
      "Téléphone",
      "Statut",
      "Montant",
      "Date d'adhésion",
    ];
    const rows = filteredAdherents.map((a: any) => [
      a.name,
      a.email,
      a.phone || "-",
      a.cotisationStatus,
      `${a.cotisationAmount || 0}€`,
      new Date(a.createdAt).toLocaleDateString("fr-FR"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adherents-${year}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Fichier CSV téléchargé avec succès");
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des adhérents
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Liste des Adhérents
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion et suivi des adhésions annuelles
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Adhérents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.total}</div>
              <Users className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              À jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                {stats.upToDate}
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              En Retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.overdue}
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taux de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-600">
                {stats.paymentRate}%
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Year Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Année
              </label>
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

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Statut
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="À jour">À jour</SelectItem>
                  <SelectItem value="En retard">En retard</SelectItem>
                  <SelectItem value="Impayé">Impayé</SelectItem>
                  <SelectItem value="Exempté">Exempté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Adhérents ({filteredAdherents.length}/{adherents.length})
          </CardTitle>
          <CardDescription>
            Liste complète des adhérents pour l'année {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : filteredAdherents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aucun adhérent trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date d'adhésion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdherents.map((adherent: any) => (
                    <TableRow
                      key={adherent.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="font-medium">
                        {adherent.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {adherent.email}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {adherent.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`gap-1 ${
                            STATUT_COLORS[adherent.cotisationStatus]
                              ?.bg || "bg-gray-100"
                          }`}
                          variant="outline"
                        >
                          {STATUT_COLORS[adherent.cotisationStatus]?.icon}
                          {adherent.cotisationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {adherent.cotisationAmount || 0}€
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(adherent.createdAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-lg">Résumé Financier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Montant Total Attendu</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalAmount.toLocaleString("fr-FR")}€
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant Collecté</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.paidAmount.toLocaleString("fr-FR")}€
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
