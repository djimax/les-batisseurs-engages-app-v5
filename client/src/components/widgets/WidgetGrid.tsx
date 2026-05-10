import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2, Save, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WidgetItem {
  id: string;
  title: string;
  component: ReactNode;
  width?: number;
  height?: number;
  isVisible?: boolean;
}

interface WidgetGridProps {
  widgets: WidgetItem[];
  onWidgetsChange?: (widgets: WidgetItem[]) => void;
  isEditable?: boolean;
  onToggleVisibility?: (widgetId: string) => void;
  onRemove?: (widgetId: string) => void;
}

export function WidgetGrid({
  widgets,
  onWidgetsChange,
  isEditable = false,
  onToggleVisibility,
  onRemove,
}: WidgetGridProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [localWidgets, setLocalWidgets] = useState(widgets);

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;

    const draggedIndex = localWidgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = localWidgets.findIndex(w => w.id === targetId);

    const newWidgets = [...localWidgets];
    [newWidgets[draggedIndex], newWidgets[targetIndex]] = [
      newWidgets[targetIndex],
      newWidgets[draggedIndex],
    ];

    setLocalWidgets(newWidgets);
    onWidgetsChange?.(newWidgets);
    setDraggedWidget(null);
  };

  const handleSave = () => {
    setIsEditMode(false);
    onWidgetsChange?.(localWidgets);
  };

  const visibleWidgets = localWidgets.filter(w => w.isVisible !== false);

  return (
    <div className="space-y-4">
      {isEditable && (
        <div className="flex gap-2">
          {!isEditMode ? (
            <Button
              onClick={() => setIsEditMode(true)}
              variant="outline"
              size="sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Personnaliser
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                onClick={() => setIsEditMode(false)}
                variant="outline"
                size="sm"
              >
                Annuler
              </Button>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleWidgets.map(widget => (
          <div
            key={widget.id}
            draggable={isEditMode}
            onDragStart={e => handleDragStart(e, widget.id)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, widget.id)}
            className={cn(
              "relative",
              isEditMode &&
                "cursor-move opacity-90 hover:opacity-100 transition-opacity"
            )}
            style={{
              gridColumn: `span ${widget.width || 1}`,
              gridRow: `span ${widget.height || 1}`,
            }}
          >
            <Card className="h-full">
              {isEditMode && (
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleVisibility?.(widget.id)}
                    className="h-6 w-6 p-0"
                  >
                    {widget.isVisible === false ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove?.(widget.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="p-4">{widget.component}</div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
