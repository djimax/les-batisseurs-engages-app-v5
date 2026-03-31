import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  createLocalUser,
  getLocalUserByEmail,
  getLocalUserById,
  createUserSession,
  getUserSessionByToken,
  deleteUserSession,
  updateLocalUserPassword,
} from "../db";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  validateEmail,
  validatePassword,
} from "../auth-local";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  sessionToken: z.string(),
  currentPassword: z.string(),
  newPassword: z.string(),
});

export const localAuthRouter = router({
  /**
   * Register a new user with email and password
   */
  register: publicProcedure.input(registerSchema).mutation(async ({ input }) => {
    // Validate email
    if (!validateEmail(input.email)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email invalide",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: passwordValidation.errors.join(", "),
      });
    }

    // Check if user already exists
    const existingUser = await getLocalUserByEmail(input.email);
    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Un utilisateur avec cet email existe déjà",
      });
    }

    try {
      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user
      await createLocalUser({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "user",
        isActive: true,
      });

      // Get the created user
      const createdUser = await getLocalUserByEmail(input.email);
      if (!createdUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création de l'utilisateur",
        });
      }

      // Create session
      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await createUserSession({
        userId: createdUser.id,
        sessionToken,
        expiresAt,
      });

      return {
        success: true,
        userId: createdUser.id,
        sessionToken,
        user: {
          id: createdUser.id,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: "user",
        },
      };
    } catch (error) {
      console.error("[Auth] Registration error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de l'enregistrement",
      });
    }
  }),

  /**
   * Login with email and password
   */
  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    try {
      // Find user by email
      const user = await getLocalUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ce compte est désactivé",
        });
      }

      // Verify password
      const passwordMatch = await verifyPassword(input.password, user.passwordHash);
      if (!passwordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      // Create session
      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await createUserSession({
        userId: user.id,
        sessionToken,
        expiresAt,
      });

      return {
        success: true,
        userId: user.id,
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Auth] Login error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la connexion",
      });
    }
  }),

  /**
   * Verify session token
   */
  verifySession: publicProcedure.input(z.object({ sessionToken: z.string() })).query(async ({ input }) => {
    try {
      const session = await getUserSessionByToken(input.sessionToken);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session invalide",
        });
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session expirée",
        });
      }

      return {
        valid: true,
        userId: session.userId,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session invalide",
      });
    }
  }),

  /**
   * Logout (delete session)
   */
  logout: publicProcedure.input(z.object({ sessionToken: z.string() })).mutation(async ({ input }) => {
    try {
      await deleteUserSession(input.sessionToken);
      return { success: true };
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la déconnexion",
      });
    }
  }),

  /**
   * Change password
   */
  changePassword: publicProcedure.input(changePasswordSchema).mutation(async ({ input }) => {
    try {
      // Verify session
      const session = await getUserSessionByToken(input.sessionToken);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session invalide",
        });
      }

      // Get user by session userId
      const user = await getLocalUserById(session.userId);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilisateur non trouvé",
        });
      }

      // Verify current password
      const passwordMatch = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!passwordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Mot de passe actuel incorrect",
        });
      }

      // Validate new password
      const passwordValidation = validatePassword(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.errors.join(", "),
        });
      }

      // Hash and update password
      const newPasswordHash = await hashPassword(input.newPassword);
      await updateLocalUserPassword(user.id, newPasswordHash);

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Auth] Change password error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors du changement de mot de passe",
      });
    }
  }),
});
