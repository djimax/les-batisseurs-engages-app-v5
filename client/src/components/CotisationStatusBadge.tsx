import { Badge } from "./ui/badge";
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from "lucide-react";

export type CotisationStatus = "à_jour" | "en_retard" | "impayé" | "exempté";

interface CotisationStatusBadgeProps {
  status: CotisationStatus | null | undefined;
  className?: string;
}

const STATUS_CONFIG: Record<
  CotisationStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
    color: string;
  }
> = {
  à_jour: {
    label: "À jour",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  en_retard: {
    label: "En retard",
    variant: "secondary",
    icon: <AlertCircle className="h-3 w-3" />,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  impayé: {
    label: "Impayé",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  exempté: {
    label: "Exempté",
    variant: "outline",
    icon: <HelpCircle className="h-3 w-3" />,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
};

export function CotisationStatusBadge({
  status,
  className,
}: CotisationStatusBadgeProps) {
  if (!status || !STATUS_CONFIG[status]) {
    return (
      <Badge variant="outline" className={className}>
        Non défini
      </Badge>
    );
  }

  const config = STATUS_CONFIG[status];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.color}`}
      >
        {config.icon}
        <span>{config.label}</span>
      </div>
    </div>
  );
}

export function getCotisationStatusColor(
  status: CotisationStatus | null | undefined
): string {
  if (!status || !STATUS_CONFIG[status]) {
    return "bg-gray-100 text-gray-800";
  }
  return STATUS_CONFIG[status].color;
}

export function getCotisationStatusLabel(
  status: CotisationStatus | null | undefined
): string {
  if (!status || !STATUS_CONFIG[status]) {
    return "Non défini";
  }
  return STATUS_CONFIG[status].label;
}
