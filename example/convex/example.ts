import { query, action } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { Supermemory } from "../../src/client/index.js";
import { v } from "convex/values";

const supermemory = new Supermemory(components.convexSupermemory, {
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});

// ─── Memories ───────────────────────────────────────────────────────────────

export const remember = action({
  args: {
    userId: v.string(),
    fact: v.string(),
    isStatic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await supermemory.addMemory(ctx, {
      containerTag: args.userId,
      content: args.fact,
      isStatic: args.isStatic,
    });
  },
});

export const forget = action({
  args: { userId: v.string(), memoryId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.forgetMemory(ctx, {
      containerTag: args.userId,
      memoryId: args.memoryId,
    });
  },
});

export const getMemory = query({
  args: { memoryId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.getMemory(ctx, args);
  },
});

export const listMemories = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.listMemories(ctx, { containerTag: args.userId });
  },
});

// ─── Documents ──────────────────────────────────────────────────────────────

export const ingest = action({
  args: {
    userId: v.string(),
    content: v.string(),
    customId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await supermemory.addDocument(ctx, {
      containerTag: args.userId,
      content: args.content,
      customId: args.customId,
    });
  },
});

export const refresh = action({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    await supermemory.refreshDocument(ctx, args);
    return null;
  },
});

export const removeDocument = action({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    await supermemory.deleteDocument(ctx, args);
    return null;
  },
});

export const getDocument = query({
  args: { documentId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.getDocument(ctx, args);
  },
});

export const listDocuments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.listDocuments(ctx, { containerTag: args.userId });
  },
});

// ─── Search ─────────────────────────────────────────────────────────────────

export const recall = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await supermemory.search({
      containerTag: args.userId,
      query: args.query,
      limit: args.limit,
    });
  },
});

// ─── History / dashboard ────────────────────────────────────────────────────

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    return await supermemory.getStats(ctx);
  },
});

export const listRecentMemories = query({
  args: {},
  handler: async (ctx) => {
    return await supermemory.listRecentMemories(ctx, { limit: 30 });
  },
});

export const listRecentDocuments = query({
  args: {},
  handler: async (ctx) => {
    return await supermemory.listRecentDocuments(ctx, { limit: 30 });
  },
});
