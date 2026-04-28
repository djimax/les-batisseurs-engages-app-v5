import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { userWidgetPreferences, dashboardWidgets, widgetTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const widgetsRouter = router({
  /**
   * Get all available widget templates
   */
  getTemplates: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const templates = await db.select().from(widgetTemplates).where(eq(widgetTemplates.isActive, true));
    return templates;
  }),

  /**
   * Get user's dashboard widgets
   */
  getUserWidgets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const widgets = await db
      .select()
      .from(dashboardWidgets)
      .where(and(eq(dashboardWidgets.userId, ctx.user.id), eq(dashboardWidgets.isVisible, true)))
      .orderBy(dashboardWidgets.position);

    return widgets;
  }),

  /**
   * Add a new widget to dashboard
   */
  addWidget: protectedProcedure
    .input(
      z.object({
        widgetType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        size: z.enum(["small", "medium", "large"] as const).default("medium"),
        config: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get the next position
      const lastWidget = await db
        .select({ position: dashboardWidgets.position })
        .from(dashboardWidgets)
        .where(eq(dashboardWidgets.userId, ctx.user.id))
        .limit(1);

      const nextPosition = lastWidget.length > 0 ? Math.max(...lastWidget.map((w: any) => w.position)) + 1 : 0;

      await db.insert(dashboardWidgets).values({
        userId: ctx.user.id,
        widgetType: input.widgetType,
        title: input.title,
        description: input.description,
        position: nextPosition,
        size: input.size,
        config: input.config || {},
      });

      return { position: nextPosition };
    }),

  /**
   * Update widget configuration
   */
  updateWidget: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        size: z.enum(["small", "medium", "large"] as const).optional(),
        config: z.record(z.string(), z.any()).optional(),
        isVisible: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: Record<string, any> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.size !== undefined) updateData.size = input.size;
      if (input.config !== undefined) updateData.config = input.config;
      if (input.isVisible !== undefined) updateData.isVisible = input.isVisible;

      await db
        .update(dashboardWidgets)
        .set(updateData)
        .where(and(eq(dashboardWidgets.id, input.id), eq(dashboardWidgets.userId, ctx.user.id)));
      
      return { success: true };
    }),

  /**
   * Reorder widgets
   */
  reorderWidgets: protectedProcedure
    .input(
      z.object({
        widgets: z.array(
          z.object({
            id: z.number(),
            position: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Update all widgets positions
      for (const widget of input.widgets) {
        await db
          .update(dashboardWidgets)
          .set({ position: widget.position })
          .where(and(eq(dashboardWidgets.id, widget.id), eq(dashboardWidgets.userId, ctx.user.id)))
          .limit(1);
      }

      return { success: true };
    }),

  /**
   * Remove widget from dashboard
   */
  removeWidget: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(dashboardWidgets)
        .where(and(eq(dashboardWidgets.id, input.id), eq(dashboardWidgets.userId, ctx.user.id)));

      return { success: true };
    }),

  /**
   * Reset dashboard to default widgets
   */
  resetDashboard: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Delete all user's widgets
    await db.delete(dashboardWidgets).where(eq(dashboardWidgets.userId, ctx.user.id));

    // Add default widgets
    const defaultWidgets = [
      {
        userId: ctx.user.id,
        widgetType: "kpi",
        title: "Statistiques Clés",
        position: 0,
        size: "large" as const,
        config: { metrics: ["members", "finances", "documents"] },
      },
      {
        userId: ctx.user.id,
        widgetType: "chart",
        title: "Graphique Finances",
        position: 1,
        size: "medium" as const,
        config: { type: "bar", period: "month" },
      },
      {
        userId: ctx.user.id,
        widgetType: "activity",
        title: "Activité Récente",
        position: 2,
        size: "medium" as const,
        config: { limit: 10 },
      },
    ];

    await db.insert(dashboardWidgets).values(defaultWidgets);

    return { success: true };
  }),

  /**
   * Get user's widget preferences (new system)
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const preferences = await db
        .select()
        .from(userWidgetPreferences)
        .where(eq(userWidgetPreferences.userId, ctx.user.id))
        .orderBy(userWidgetPreferences.position);

      return preferences;
    } catch (error) {
      console.error("[Widgets] Error getting preferences:", error);
      throw error;
    }
  }),

  /**
   * Save or update widget preferences (new system)
   */
  savePreferences: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.number().optional(),
          widgetId: z.string(),
          widgetType: z.string(),
          title: z.string(),
          position: z.number(),
          isVisible: z.boolean().default(true),
          width: z.number().default(1),
          height: z.number().default(1),
          config: z.record(z.string(), z.any()).optional(),
          refreshInterval: z.number().optional(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Delete existing preferences
        await db
          .delete(userWidgetPreferences)
          .where(eq(userWidgetPreferences.userId, ctx.user.id));

        // Insert new preferences
        const newPreferences = await Promise.all(
          input.map((pref) =>
            db.insert(userWidgetPreferences).values({
              userId: ctx.user.id,
              widgetId: pref.widgetId,
              widgetType: pref.widgetType,
              title: pref.title,
              position: pref.position,
              isVisible: pref.isVisible,
              width: pref.width,
              height: pref.height,
              config: pref.config || {},
              refreshInterval: pref.refreshInterval,
            })
          )
        );

        return { success: true, count: newPreferences.length };
      } catch (error) {
        console.error("[Widgets] Error saving preferences:", error);
        throw error;
      }
    }),

  /**
   * Toggle widget visibility (new system)
   */
  toggleVisibility: protectedProcedure
    .input(
      z.object({
        widgetId: z.string(),
        isVisible: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db
          .update(userWidgetPreferences)
          .set({ isVisible: input.isVisible })
          .where(
            and(
              eq(userWidgetPreferences.userId, ctx.user.id),
              eq(userWidgetPreferences.widgetId, input.widgetId)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("[Widgets] Error toggling visibility:", error);
        throw error;
      }
    }),

  /**
   * Delete a widget preference (new system)
   */
  deleteWidgetPref: protectedProcedure
    .input(z.object({ widgetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .delete(userWidgetPreferences)
          .where(
            and(
              eq(userWidgetPreferences.userId, ctx.user.id),
              eq(userWidgetPreferences.widgetId, input.widgetId)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("[Widgets] Error deleting widget:", error);
        throw error;
      }
    }),

  /**
   * Reset to default widgets for user's role (new system)
   */
  resetToDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Delete existing preferences
      await db
        .delete(userWidgetPreferences)
        .where(eq(userWidgetPreferences.userId, ctx.user.id));

      // Get default widgets based on role
      const defaultWidgets = getDefaultWidgetsForRole(ctx.user.role);

      // Insert default widgets
      await Promise.all(
        defaultWidgets.map((widget, index) =>
          db.insert(userWidgetPreferences).values({
            userId: ctx.user.id,
            widgetId: widget.widgetId,
            widgetType: widget.widgetType,
            title: widget.title,
            position: index,
            isVisible: true,
            width: widget.width,
            height: widget.height,
            config: widget.config || {},
            refreshInterval: 300,
          })
        )
      );

      return { success: true, count: defaultWidgets.length };
    } catch (error) {
      console.error("[Widgets] Error resetting to defaults:", error);
      throw error;
    }
  }),
});

/**
 * Get default widgets based on user role
 */
function getDefaultWidgetsForRole(
  role: string
): Array<{
  widgetId: string;
  widgetType: string;
  title: string;
  width: number;
  height: number;
  config?: Record<string, any>;
}> {
  const baseWidgets = [
    {
      widgetId: "stats-members",
      widgetType: "stats",
      title: "Membres Actifs",
      width: 1,
      height: 1,
      config: { dataKey: "activeMembers" },
    },
    {
      widgetId: "stats-documents",
      widgetType: "stats",
      title: "Documents",
      width: 1,
      height: 1,
      config: { dataKey: "totalDocuments" },
    },
    {
      widgetId: "stats-projects",
      widgetType: "stats",
      title: "Projets",
      width: 1,
      height: 1,
      config: { dataKey: "activeProjects" },
    },
    {
      widgetId: "chart-finances",
      widgetType: "chart",
      title: "Finances",
      width: 2,
      height: 2,
      config: { type: "line" },
    },
    {
      widgetId: "alerts-system",
      widgetType: "alerts",
      title: "Alertes",
      width: 2,
      height: 1,
      config: {},
    },
  ];

  if (role === "admin" || role === "gestionnaire") {
    return [
      ...baseWidgets,
      {
        widgetId: "list-recent-activity",
        widgetType: "list",
        title: "Activité Récente",
        width: 2,
        height: 1,
        config: {},
      },
    ];
  }

  return baseWidgets;
}
