import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color: "blue" | "green" | "red" | "yellow";
  };
}

interface ListWidgetProps {
  title: string;
  items: ListItem[];
  onItemClick?: (item: ListItem) => void;
  actionLabel?: string;
  onAction?: () => void;
}

const badgeColors = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
};

export function ListWidget({
  title,
  items,
  onItemClick,
  actionLabel,
  onAction,
}: ListWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {actionLabel && (
          <Button variant="ghost" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun élément</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className={`text-xs px-2 py-1 rounded ${badgeColors[item.badge.color]}`}>
                    {item.badge.text}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
