import { useState, useMemo } from "react";
import { BarChart3, LineChart, PieChart, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import { toast } from "sonner";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

export default function AdhesionReports() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [startYear, setStartYear] = useState<string>("2024");
  const [endYear, setEndYear] = useState<string>(new Date().getFullYear().toString());

  // Récupérer les données
  const { data: monthlyStats = [] } = trpc.adhesionReports.getMonthlyStatistics.useQuery({
    year: parseInt(year),
  });

  const { data: statusDist = [] } = trpc.adhesionReports.getStatusDistribution.useQuery({
    year: parseInt(year),
  });

  const { data: paymentRate = { rate: 0, paid: 0, total: 0 } } =
    trpc.adhesionReports.getPaymentRate.useQuery({
      year: parseInt(year),
    });

  const { data: trends = [] } = trpc.adhesionReports.getAnnualTrends.useQuery({
    startYear: parseInt(startYear),
    endYear: parseInt(endYear),
  });

  const { data: globalStats = {} } = trpc.adhesionReports.getGlobalStatistics.useQuery({
    year: parseInt(year),
  });

  // Préparer les données pour les graphiques
  const monthlyChartData = useMemo(() => {
    return {
      labels: monthlyStats.map((m: any) => {
        const monthNames = [
          "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
          "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"
        ];
        return monthNames[parseInt(m.month) - 1];
      }),
      datasets: [
        {
          label: "À jour",
          data: monthlyStats.map((m: any) => m.upToDate),
          backgroundColor: "#10b981",
          borderColor: "#059669",
          borderWidth: 1,
        },
        {
          label: "En retard",
          data: monthlyStats.map((m: any) => m.overdue),
          backgroundColor: "#f59e0b",
          borderColor: "#d97706",
          borderWidth: 1,
        },
        {
          label: "Impayé",
          data: monthlyStats.map((m: any) => m.unpaid),
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
        },
      ],
    };
  }, [monthlyStats]);

  const statusChartData = useMemo(() => {
    return {
      labels: statusDist.map((s: any) => s.label),
      datasets: [
        {
          data: statusDist.map((s: any) => s.value),
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#6b7280"],
          borderColor: ["#059669", "#d97706", "#dc2626", "#4b5563"],
          borderWidth: 2,
        },
      ],
    };
  }, [statusDist]);

  const trendsChartData = useMemo(() => {
    return {
      labels: trends.map((t: any) => t.year),
      datasets: [
        {
          label: "Taux de paiement (%)",
          data: trends.map((t: any) => parseFloat(t.rate as string)),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Nombre d'adhérents",
          data: trends.map((t: any) => t.total),
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    };
  }, [trends]);

  const handleExportPDF = () => {
    toast.info("Export PDF en cours...");
    // À implémenter avec une libraire PDF
  };

  const handleExportCSV = () => {
    const csv = [
      ["Mois", "Total", "À jour", "En retard", "Impayé", "Montant"],
      ...monthlyStats.map((m: any) => [
        m.month,
        m.total,
        m.upToDate,
        m.overdue,
        m.unpaid,
        m.amount,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-adhesion-${year}.csv`;
    a.click();
    toast.success("Rapport exporté en CSV");
  };

  const stats = globalStats as any;

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rapports d'Adhésion</h1>
          <p className="text-gray-600 mt-1">
            Analysez les tendances et les statistiques d'adhésion
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
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
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total adhérents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdherents || 0}</div>
            <p className="text-xs text-gray-500 mt-1">pour l'année</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Montant total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalAmount || 0).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">collecté</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Montant moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.averageAmount || 0).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">par adhérent</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Taux de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(stats.paymentRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-green-600 mt-1">adhérents à jour</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-2 gap-6">
        {/* Graphique mensuel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Évolution mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Bar
                data={monthlyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "top" as const },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Graphique de répartition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Répartition des statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Pie
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom" as const },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique de tendances annuelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Tendances annuelles
          </CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Année de début</label>
              <Select value={startYear} onValueChange={setStartYear}>
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
              <label className="text-sm font-medium">Année de fin</label>
              <Select value={endYear} onValueChange={setEndYear}>
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
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: "300px" }}>
            <Line
              data={trendsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" as const },
                },
                scales: {
                  y: {
                    type: "linear" as const,
                    display: true,
                    position: "left" as const,
                    title: { display: true, text: "Taux (%)" },
                  },
                  y1: {
                    type: "linear" as const,
                    display: true,
                    position: "right" as const,
                    title: { display: true, text: "Nombre" },
                    grid: { drawOnChartArea: false },
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guide d'utilisation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Guide d'utilisation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • <strong>Statistiques globales</strong> : Affichent le résumé des adhésions pour
            l'année sélectionnée.
          </p>
          <p>
            • <strong>Évolution mensuelle</strong> : Visualisez l'évolution du nombre d'adhérents
            par statut chaque mois.
          </p>
          <p>
            • <strong>Répartition des statuts</strong> : Voyez la proportion d'adhérents à jour,
            en retard, impayés et exemptés.
          </p>
          <p>
            • <strong>Tendances annuelles</strong> : Comparez les taux de paiement et le nombre
            d'adhérents sur plusieurs années.
          </p>
          <p>
            • <strong>Exports</strong> : Téléchargez les données en CSV ou PDF pour analyse
            externe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
