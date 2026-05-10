import { protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { searchMembers, getMemberByMemberId, getAdhesionById } from "../db";

export const searchRouter = {
  searchMembers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .query(async ({ input }: any) => {
      return await searchMembers(input.query);
    }),

  getMemberById: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
      })
    )
    .query(async ({ input }: any) => {
      return await getMemberByMemberId(input.memberId);
    }),

  getAdhesionById: protectedProcedure
    .input(
      z.object({
        adhesionId: z.number(),
      })
    )
    .query(async ({ input }: any) => {
      return await getAdhesionById(input.adhesionId);
    }),
};
