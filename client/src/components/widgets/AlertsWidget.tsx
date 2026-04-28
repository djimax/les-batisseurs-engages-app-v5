import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "error" | "success";
}

interface AlertsWidgetProps {
  title: string;
  alerts: AlertItem[];
}

const severityConfig = {
  info: { icon: AlertCircle, color: "text-blue-600", bgColor: "bg-blue-50" },
  warning: { icon: AlertTriangle, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  error: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50" },
  success: { icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50" },
};

export function AlertsWidget({ title, alerts }: AlertsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune alerte</p>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <div key={alert.id} className={`p-3 rounded-lg ${config.bgColor}`}>
                <div className="flex gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${config.color}`}>{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
