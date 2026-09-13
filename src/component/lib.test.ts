import { describe, expect, test } from "vitest";
import { initConvexTest } from "./setup.test.js";
import { api } from "./_generated/api.js";

describe("memories", () => {
  test("recordMemory inserts then updates the same memoryId", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordMemory, {
      memoryId: "mem_1",
      containerTag: "user_1",
      content: "Prefers dark mode",
      isStatic: true,
    });

    let memory = await t.query(api.lib.getMemory, { memoryId: "mem_1" });
    expect(memory?.forgotten).toBe(false);

    await t.mutation(api.lib.markMemoryForgotten, { memoryId: "mem_1" });

    memory = await t.query(api.lib.getMemory, { memoryId: "mem_1" });
    expect(memory?.forgotten).toBe(true);
  });

  test("listMemories scopes by containerTag", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordMemory, {
      memoryId: "mem_a",
      containerTag: "user_a",
      content: "fact a",
      isStatic: false,
    });
    await t.mutation(api.lib.recordMemory, {
      memoryId: "mem_b",
      containerTag: "user_b",
      content: "fact b",
      isStatic: false,
    });

    const results = await t.query(api.lib.listMemories, { containerTag: "user_a" });
    expect(results).toHaveLength(1);
    expect(results[0].memoryId).toBe("mem_a");
  });
});

describe("documents", () => {
  test("recordDocument upserts and deleteDocument removes it", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordDocument, {
      documentId: "doc_1",
      containerTag: "user_1",
      status: "queued",
    });

    let doc = await t.query(api.lib.getDocument, { documentId: "doc_1" });
    expect(doc?.status).toBe("queued");

    await t.mutation(api.lib.recordDocument, {
      documentId: "doc_1",
      containerTag: "user_1",
      status: "done",
      title: "My Document",
    });

    doc = await t.query(api.lib.getDocument, { documentId: "doc_1" });
    expect(doc?.status).toBe("done");
    expect(doc?.title).toBe("My Document");

    await t.mutation(api.lib.deleteDocument, { documentId: "doc_1" });
    doc = await t.query(api.lib.getDocument, { documentId: "doc_1" });
    expect(doc).toBe(null);
  });
});

describe("stats", () => {
  test("getStats counts memories and documents", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordMemory, {
      memoryId: "mem_1",
      containerTag: "user_1",
      content: "fact",
      isStatic: true,
    });
    await t.mutation(api.lib.recordDocument, {
      documentId: "doc_1",
      containerTag: "user_1",
      status: "queued",
    });

    const stats = await t.query(api.lib.getStats, {});
    expect(stats).toEqual({ memories: 1, documents: 1 });
  });
});

describe("recent history", () => {
  test("listRecentMemories and listRecentDocuments return newest first across containers", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordMemory, {
      memoryId: "mem_a",
      containerTag: "user_a",
      content: "first",
      isStatic: false,
    });
    await t.mutation(api.lib.recordMemory, {
      memoryId: "mem_b",
      containerTag: "user_b",
      content: "second",
      isStatic: false,
    });
    await t.mutation(api.lib.recordDocument, {
      documentId: "doc_a",
      containerTag: "user_a",
      status: "done",
    });

    const memories = await t.query(api.lib.listRecentMemories, {});
    expect(memories.map((m) => m.memoryId)).toEqual(["mem_b", "mem_a"]);

    const documents = await t.query(api.lib.listRecentDocuments, { limit: 1 });
    expect(documents).toHaveLength(1);
    expect(documents[0].documentId).toBe("doc_a");
  });
});
