import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

const documentStatusValidator = v.union(
  v.literal("unknown"),
  v.literal("queued"),
  v.literal("extracting"),
  v.literal("chunking"),
  v.literal("embedding"),
  v.literal("indexing"),
  v.literal("done"),
  v.literal("failed"),
);

const memoryValidator = v.object({
  _id: v.id("memories"),
  _creationTime: v.number(),
  memoryId: v.string(),
  containerTag: v.string(),
  content: v.string(),
  isStatic: v.boolean(),
  metadata: v.optional(v.string()),
  forgetAfter: v.optional(v.number()),
  forgetReason: v.optional(v.string()),
  forgotten: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const documentValidator = v.object({
  _id: v.id("documents"),
  _creationTime: v.number(),
  documentId: v.string(),
  containerTag: v.string(),
  content: v.optional(v.string()),
  customId: v.optional(v.string()),
  metadata: v.optional(v.string()),
  status: documentStatusValidator,
  title: v.optional(v.string()),
  summary: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// ─── Queries ────────────────────────────────────────────────────────────────

export const getMemory = query({
  args: { memoryId: v.string() },
  returns: v.union(v.null(), memoryValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_memoryId", (q) => q.eq("memoryId", args.memoryId))
      .first();
  },
});

export const listMemories = query({
  args: { containerTag: v.string(), limit: v.optional(v.number()) },
  returns: v.array(memoryValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_containerTag", (q) => q.eq("containerTag", args.containerTag))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

export const getDocument = query({
  args: { documentId: v.string() },
  returns: v.union(v.null(), documentValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .first();
  },
});

export const listDocuments = query({
  args: { containerTag: v.string(), limit: v.optional(v.number()) },
  returns: v.array(documentValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_containerTag", (q) => q.eq("containerTag", args.containerTag))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

export const recordMemory = mutation({
  args: {
    memoryId: v.string(),
    containerTag: v.string(),
    content: v.string(),
    isStatic: v.boolean(),
    metadata: v.optional(v.string()),
    forgetAfter: v.optional(v.number()),
    forgetReason: v.optional(v.string()),
  },
  returns: v.id("memories"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("memories")
      .withIndex("by_memoryId", (q) => q.eq("memoryId", args.memoryId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("memories", {
      ...args,
      forgotten: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const markMemoryForgotten = mutation({
  args: { memoryId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("memories")
      .withIndex("by_memoryId", (q) => q.eq("memoryId", args.memoryId))
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, { forgotten: true, updatedAt: Date.now() });
    return null;
  },
});

export const recordDocument = mutation({
  args: {
    documentId: v.string(),
    containerTag: v.string(),
    content: v.optional(v.string()),
    customId: v.optional(v.string()),
    metadata: v.optional(v.string()),
    status: documentStatusValidator,
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("documents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
