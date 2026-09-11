import { query, action } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { Supermemory } from "../../src/client/index.js";
import { v } from "convex/values";

const supermemory = new Supermemory(components.convexSupermemory, {
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});

export const remember = action({
  args: { userId: v.string(), fact: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.addMemory(ctx, {
      containerTag: args.userId,
      content: args.fact,
    });
  },
});

export const recall = action({
  args: { userId: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.search({
      containerTag: args.userId,
      query: args.query,
    });
  },
});

export const forget = action({
  args: { memoryId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.forgetMemory(ctx, args);
  },
});

export const listMemories = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.listMemories(ctx, { containerTag: args.userId });
  },
});
