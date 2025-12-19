/**
 * TRPC Client Utility
 * أداة عميل TRPC
 * 
 * This file sets up the type-safe client for tRPC, which is used by the TRPCProvider.
 */
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers"; // Assuming the server router is still in server/routers.ts

export const trpc = createTRPCReact<AppRouter>();
