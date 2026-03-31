import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  index,
  foreignKey,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * ============================================================================
 * CORE AUTHENTICATION & USERS
 * ============================================================================
 */

/**
 * OAuth users (Manus authentication)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Local authentication users (email/password)
 */
export const usersLocal = mysqlTable(
  "users_local",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    firstName: varchar("firstName", { length: 100 }),
    lastName: varchar("lastName", { length: 100 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn"),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
  })
);

export type UserLocal = typeof usersLocal.$inferSelect;
export type InsertUserLocal = typeof usersLocal.$inferInsert;

/**
 * User sessions for local auth
 */
export const userSessions = mysqlTable(
  "user_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    sessionTokenIdx: index("sessionToken_idx").on(table.sessionToken),
  })
);

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

/**
 * ============================================================================
 * ASSOCIATION SETTINGS & MULTI-TENANT
 * ============================================================================
 */

/**
 * Association settings for branding and configuration
 */
export const associationSettings = mysqlTable("association_settings", {
  id: int("id").autoincrement().primaryKey(),
  associationId: int("associationId").default(1).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  logoKey: varchar("logoKey", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#0066cc"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#00aa00"),
  accentColor: varchar("accentColor", { length: 7 }).default("#ff9900"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 10 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssociationSettings = typeof associationSettings.$inferSelect;
export type InsertAssociationSettings = typeof associationSettings.$inferInsert;

/**
 * ============================================================================
 * MEMBERS & CONTACTS
 * ============================================================================
 */

/**
 * Members of the association
 */
export const members = mysqlTable(
  "members",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    role: varchar("role", { length: 100 }).default("Membre"),
    function: varchar("function", { length: 100 }),
    status: mysqlEnum("status", ["active", "inactive", "pending"]).default("active").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: index("members_email_idx").on(table.email),
    statusIdx: index("members_status_idx").on(table.status),
  })
);

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

/**
 * CRM Contacts
 */
export const contacts = mysqlTable(
  "contacts",
  {
    id: int("id").autoincrement().primaryKey(),
    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    company: varchar("company", { length: 255 }),
    position: varchar("position", { length: 100 }),
    type: mysqlEnum("type", ["prospect", "client", "partner", "supplier"]).default("prospect"),
    status: mysqlEnum("status", ["active", "inactive", "archived"]).default("active"),
    notes: text("notes"),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: index("contacts_email_idx").on(table.email),
    typeIdx: index("contacts_type_idx").on(table.type),
  })
);

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * CRM Activities
 */
export const activities = mysqlTable(
  "activities",
  {
    id: int("id").autoincrement().primaryKey(),
    contactId: int("contactId").notNull(),
    type: mysqlEnum("type", ["call", "email", "meeting", "note", "task"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending"),
    dueDate: timestamp("dueDate"),
    completedAt: timestamp("completedAt"),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index("activities_contactId_idx").on(table.contactId),
    typeIdx: index("activities_type_idx").on(table.type),
  })
);

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * ============================================================================
 * PROJECTS & TASKS
 * ============================================================================
 */

/**
 * Projects
 */
export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["planning", "active", "on-hold", "completed", "cancelled"]).default("planning"),
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
    budget: decimal("budget", { precision: 12, scale: 2 }),
    startDate: timestamp("startDate"),
    endDate: timestamp("endDate"),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    statusIdx: index("projects_status_idx").on(table.status),
  })
);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Tasks within projects
 */
export const tasks = mysqlTable(
  "tasks",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["todo", "in-progress", "review", "completed"]).default("todo"),
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
    assignedTo: int("assignedTo"),
    dueDate: timestamp("dueDate"),
    completedAt: timestamp("completedAt"),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("tasks_projectId_idx").on(table.projectId),
    statusIdx: index("tasks_status_idx").on(table.status),
  })
);

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * ============================================================================
 * FINANCES
 * ============================================================================
 */

/**
 * Budgets
 */
export const budgets = mysqlTable(
  "budgets",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    year: int("year").notNull(),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["draft", "approved", "active", "closed"]).default("draft"),
    description: text("description"),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    yearIdx: index("budgets_year_idx").on(table.year),
  })
);

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Budget lines
 */
export const budgetLines = mysqlTable(
  "budget_lines",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetId: int("budgetId").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    description: varchar("description", { length: 255 }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    spent: decimal("spent", { precision: 12, scale: 2 }).default("0"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    budgetIdIdx: index("budgetLines_budgetId_idx").on(table.budgetId),
  })
);

export type BudgetLine = typeof budgetLines.$inferSelect;
export type InsertBudgetLine = typeof budgetLines.$inferInsert;

/**
 * Invoices
 */
export const invoices = mysqlTable(
  "invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
    contactId: int("contactId"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
    invoiceDate: timestamp("invoiceDate").defaultNow(),
    dueDate: timestamp("dueDate"),
    paidDate: timestamp("paidDate"),
    description: text("description"),
    notes: text("notes"),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    statusIdx: index("invoices_status_idx").on(table.status),
    invoiceDateIdx: index("invoices_invoiceDate_idx").on(table.invoiceDate),
  })
);

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Expenses
 */
export const expenses = mysqlTable(
  "expenses",
  {
    id: int("id").autoincrement().primaryKey(),
    description: varchar("description", { length: 255 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "paid", "rejected"]).default("pending"),
    expenseDate: timestamp("expenseDate").defaultNow(),
    createdBy: int("createdBy"),
    approvedBy: int("approvedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("expenses_category_idx").on(table.category),
    statusIdx: index("expenses_status_idx").on(table.status),
  })
);

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Memberships & Contributions
 */
export const memberships = mysqlTable(
  "memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    memberId: int("memberId").notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    startDate: timestamp("startDate").defaultNow(),
    endDate: timestamp("endDate"),
    status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    memberIdIdx: index("memberships_memberId_idx").on(table.memberId),
    statusIdx: index("memberships_status_idx").on(table.status),
  })
);

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;

/**
 * ============================================================================
 * DOCUMENTS
 * ============================================================================
 */

/**
 * Document categories
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#1a4d2e"),
  icon: varchar("icon", { length: 50 }).default("folder"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Documents
 */
export const documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    categoryId: int("categoryId").notNull(),
    status: mysqlEnum("status", ["pending", "in-progress", "completed"]).default("pending"),
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
    fileUrl: text("fileUrl"),
    fileKey: varchar("fileKey", { length: 500 }),
    fileName: varchar("fileName", { length: 255 }),
    fileType: varchar("fileType", { length: 100 }),
    fileSize: int("fileSize"),
    // Removed duplicate fileSize
    createdBy: int("createdBy"),
    updatedBy: int("updatedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    dueDate: timestamp("dueDate"),
    isArchived: boolean("isArchived").default(false),
  },
  (table) => ({
    categoryIdIdx: index("documents_categoryId_idx").on(table.categoryId),
    statusIdx: index("documents_status_idx").on(table.status),
    archivedIdx: index("documents_isArchived_idx").on(table.isArchived),
  })
);

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Document notes/comments
 */
export const documentNotes = mysqlTable(
  "document_notes",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull(),
    userId: int("userId").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    documentIdIdx: index("documentNotes_documentId_idx").on(table.documentId),
  })
);

export type DocumentNote = typeof documentNotes.$inferSelect;
export type InsertDocumentNote = typeof documentNotes.$inferInsert;

/**
 * Document permissions
 */
export const documentPermissions = mysqlTable(
  "document_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull(),
    memberId: int("memberId").notNull(),
    canView: boolean("canView").default(true),
    canEdit: boolean("canEdit").default(false),
    canDelete: boolean("canDelete").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    documentIdIdx: index("documentPermissions_documentId_idx").on(table.documentId),
  })
);

export type DocumentPermission = typeof documentPermissions.$inferSelect;
export type InsertDocumentPermission = typeof documentPermissions.$inferInsert;

/**
 * ============================================================================
 * NOTIFICATIONS & ACTIVITY
 * ============================================================================
 */

/**
 * Notifications
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info"),
    isRead: boolean("isRead").default(false),
    actionUrl: varchar("actionUrl", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    readAt: timestamp("readAt"),
  },
  (table) => ({
    userIdIdx: index("notifications_userId_idx").on(table.userId),
    isReadIdx: index("notifications_isRead_idx").on(table.isRead),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification preferences
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailNotifications: boolean("emailNotifications").default(true),
  inAppNotifications: boolean("inAppNotifications").default(true),
  notificationFrequency: mysqlEnum("notificationFrequency", ["immediate", "daily", "weekly", "never"]).default("immediate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Activity logs
 */
export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entityType", { length: 50 }).notNull(),
    entityId: int("entityId"),
    details: text("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("activityLogs_userId_idx").on(table.userId),
    entityTypeIdx: index("activityLogs_entityType_idx").on(table.entityType),
  })
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * ============================================================================
 * OFFLINE SYNC
 * ============================================================================
 */

/**
 * Offline sync queue
 */
export const offlineSyncQueue = mysqlTable(
  "offline_sync_queue",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    entityType: varchar("entityType", { length: 50 }).notNull(),
    entityId: int("entityId"),
    payload: text("payload"),
    status: mysqlEnum("status", ["pending", "synced", "failed"]).default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    syncedAt: timestamp("syncedAt"),
  },
  (table) => ({
    userIdIdx: index("offlineSyncQueue_userId_idx").on(table.userId),
    statusIdx: index("offlineSyncQueue_status_idx").on(table.status),
  })
);

export type OfflineSyncQueue = typeof offlineSyncQueue.$inferSelect;
export type InsertOfflineSyncQueue = typeof offlineSyncQueue.$inferInsert;
