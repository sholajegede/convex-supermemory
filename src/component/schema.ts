import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  memories: defineTable({
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
  })
    .index("by_memoryId", ["memoryId"])
    .index("by_containerTag", ["containerTag"]),

  documents: defineTable({
    documentId: v.string(),
    containerTag: v.string(),
    content: v.optional(v.string()),
    customId: v.optional(v.string()),
    metadata: v.optional(v.string()),
    status: v.union(
      v.literal("unknown"),
      v.literal("queued"),
      v.literal("extracting"),
      v.literal("chunking"),
      v.literal("embedding"),
      v.literal("indexing"),
      v.literal("done"),
      v.literal("failed"),
    ),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_documentId", ["documentId"])
    .index("by_containerTag", ["containerTag"]),
});
