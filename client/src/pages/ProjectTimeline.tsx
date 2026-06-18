import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";

interface GanttTask {
  id: number;
  title: string;
  projectId: number;
  projectName: string;
  startDate: Date;
  dueDate: Date;
  status: string;
  assignee?: string;
  progress: number;
}

interface GanttProject {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  tasks: GanttTask[];
}

function ProjectTimelineComponent() {
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<GanttProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch projects
  const { data: projectsData, isLoading } = trpc.projects.list.useQuery({});

  // Process projects data
  useEffect(() => {
    if (projectsData && Array.isArray(projectsData)) {
      const processedProjects: GanttProject[] = (projectsData as any[]).map((project) => ({
        id: project.id,
        name: project.name,
        startDate: new Date(project.startDate || new Date()),
        endDate: new Date(project.endDate || new Date()),
        status: project.status || "draft",
        tasks: (project.tasks || []).map((task: any) => ({
          id: task.id,
          title: task.title,
          projectId: project.id,
          projectName: project.name,
          startDate: new Date(task.startDate || new Date()),
          dueDate: new Date(task.dueDate || new Date()),
          status: task.status || "pending",
          assignee: task.assignee,
          progress: task.progress || 0,
        })),
      }));

      setProjects(processedProjects);
    }
  }, [projectsData]);

  // Filter projects
  useEffect(() => {
    let filtered = projects;

    if (selectedProject !== "all") {
      filtered = filtered.filter((p) => p.id.toString() === selectedProject);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tasks.some((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProjects(filtered);
  }, [projects, selectedProject, selectedStatus, searchTerm]);

  // Draw Gantt chart
  useEffect(() => {
    if (!canvasRef.current || filteredProjects.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 20;
    const headerHeight = 40;
    const rowHeight = 40;
    const cellWidth = 20 * zoomLevel;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get date range
    let minDate = new Date();
    let maxDate = new Date();

    filteredProjects.forEach((project) => {
      project.tasks.forEach((task) => {
        if (task.startDate < minDate) minDate = task.startDate;
        if (task.dueDate > maxDate) maxDate = task.dueDate;
      });
    });

    const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    // Draw header (dates)
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, headerHeight);
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    for (let i = 0; i <= daysDiff; i += 7) {
      const date = new Date(minDate);
      date.setDate(date.getDate() + i);
      const x = padding + 150 + i * cellWidth;
      ctx.fillText(date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }), x, 25);
    }

    // Draw grid lines
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= daysDiff; i += 7) {
      const x = padding + 150 + i * cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, headerHeight);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw tasks
    let yOffset = headerHeight + padding;

    filteredProjects.forEach((project) => {
      // Project header
      ctx.fillStyle = "#2e7d32";
      ctx.fillRect(padding, yOffset, 150, rowHeight);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText(project.name, padding + 10, yOffset + 25);
      yOffset += rowHeight;

      // Tasks
      project.tasks.forEach((task) => {
        const taskStartDays = Math.ceil(
          (task.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const taskDurationDays = Math.ceil(
          (task.dueDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Task label
        ctx.fillStyle = "#333";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(task.title.substring(0, 20), padding + 10, yOffset + 25);

        // Task bar
        const barX = padding + 150 + taskStartDays * cellWidth;
        const barWidth = Math.max(taskDurationDays * cellWidth, 2);

        // Color based on status
        const statusColors: Record<string, string> = {
          pending: "#ffc82e",
          "in-progress": "#2196f3",
          completed: "#4caf50",
          blocked: "#f44336",
        };

        ctx.fillStyle = statusColors[task.status] || "#999";
        ctx.fillRect(barX, yOffset + 5, barWidth, 20);

        // Progress indicator
        if (task.progress > 0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
          ctx.fillRect(barX, yOffset + 5, (barWidth * task.progress) / 100, 20);
        }

        // Border
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, yOffset + 5, barWidth, 20);

        yOffset += rowHeight;
      });

      yOffset += padding;
    });

    // Update canvas height
    canvas.height = Math.max(yOffset, 400);
  }, [filteredProjects, zoomLevel]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.2, 0.5));

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.href = canvasRef.current.toDataURL("image/png");
      link.download = "gantt-chart.png";
      link.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Évolution du Projet</h1>
          <p className="text-gray-600 mt-2">Visualisez la timeline de vos projets avec un diagramme de Gantt</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Recherche</label>
              <Input
                placeholder="Rechercher un projet ou une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Projet</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Statut</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="in-progress">En cours</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleZoomIn} variant="outline" size="sm" title="Zoom avant">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button onClick={handleZoomOut} variant="outline" size="sm" title="Zoom arrière">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm" title="Télécharger">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Gantt Chart */}
        <Card className="p-6 overflow-x-auto">
          {filteredProjects.length > 0 ? (
            <canvas
              ref={canvasRef}
              width={1200}
              height={400}
              className="border border-gray-200 rounded"
              style={{ minWidth: "100%" }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun projet trouvé</p>
            </div>
          )}
        </Card>

        {/* Legend */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Légende</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-yellow-400 border border-gray-400"></div>
              <span className="text-sm">En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-blue-500 border border-gray-400"></div>
              <span className="text-sm">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-green-500 border border-gray-400"></div>
              <span className="text-sm">Complété</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-red-500 border border-gray-400"></div>
              <span className="text-sm">Bloqué</span>
            </div>
          </div>
        </Card>
      </div>
  );
}


export default ProjectTimelineComponent;
