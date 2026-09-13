import type { GenericActionCtx, GenericDataModel } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

const SUPERMEMORY_API_BASE = "https://api.supermemory.ai";

export type SupermemoryOptions = {
  apiKey: string;
  baseUrl?: string;
};

export type AddMemoryArgs = {
  containerTag: string;
  content: string;
  isStatic?: boolean;
  metadata?: Record<string, unknown>;
  forgetAfter?: number;
  forgetReason?: string;
};

export type AddDocumentArgs = {
  containerTag: string;
  content: string;
  customId?: string;
  metadata?: Record<string, unknown>;
};

export type SearchArgs = {
  containerTag: string;
  query: string;
  limit?: number;
  rerank?: boolean;
  includeFullDocs?: boolean;
};

export type SearchResult = {
  documentId: string;
  title: string | null;
  score: number;
  summary: string | null;
  content: string | null;
  chunks: Array<{ content: string; score: number; position: number; isRelevant: boolean }>;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
  timing?: number; // ms, when Supermemory reports it
};

export class Supermemory {
  constructor(
    private component: ComponentApi,
    private options: SupermemoryOptions,
  ) {}

  private baseUrl(): string {
    return this.options.baseUrl ?? SUPERMEMORY_API_BASE;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.options.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  /** Store a single fact/memory directly (fast path — no chunking pipeline). */
  async addMemory(
    ctx: GenericActionCtx<GenericDataModel>,
    args: AddMemoryArgs,
  ): Promise<{ memoryId: string }> {
    const res = await fetch(`${this.baseUrl()}/v4/memories`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        containerTag: args.containerTag,
        memories: [
          {
            content: args.content,
            isStatic: args.isStatic ?? false,
            metadata: args.metadata,
            forgetAfter: args.forgetAfter
              ? new Date(args.forgetAfter).toISOString()
              : undefined,
            forgetReason: args.forgetReason,
          },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to add Supermemory memory: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      memories: Array<{ id: string; memory: string; isStatic: boolean; createdAt: string }>;
    };
    const memory = json.memories[0];

    await ctx.runMutation(this.component.lib.recordMemory, {
      memoryId: memory.id,
      containerTag: args.containerTag,
      content: args.content,
      isStatic: args.isStatic ?? false,
      metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
      forgetAfter: args.forgetAfter,
      forgetReason: args.forgetReason,
    });

    return { memoryId: memory.id };
  }

  /** Mark a memory as forgotten. Supermemory may forget it asynchronously. */
  async forgetMemory(
    ctx: GenericActionCtx<GenericDataModel>,
    args: { containerTag: string; memoryId: string },
  ): Promise<{ forgotten: boolean }> {
    const res = await fetch(`${this.baseUrl()}/v4/memories`, {
      method: "DELETE",
      headers: this.headers(),
      // containerTag is required by Supermemory to scope the delete —
      // omitting it makes this a 400, not a silent no-op.
      body: JSON.stringify({ id: args.memoryId, containerTag: args.containerTag }),
    });
    if (!res.ok) {
      throw new Error(`Failed to forget Supermemory memory: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { id: string; forgotten: boolean };

    if (json.forgotten) {
      await ctx.runMutation(this.component.lib.markMemoryForgotten, { memoryId: args.memoryId });
    }

    return { forgotten: json.forgotten };
  }

  /**
   * Ingest a larger piece of content (a document, page, or conversation) through
   * Supermemory's extraction/chunking pipeline. Use `getDocument`/`refreshDocument`
   * to poll processing status.
   */
  async addDocument(
    ctx: GenericActionCtx<GenericDataModel>,
    args: AddDocumentArgs,
  ): Promise<{ documentId: string; status: string }> {
    const res = await fetch(`${this.baseUrl()}/v3/documents`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        content: args.content,
        containerTag: args.containerTag,
        customId: args.customId,
        metadata: args.metadata,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to add Supermemory document: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { id: string; status: string };

    await ctx.runMutation(this.component.lib.recordDocument, {
      documentId: json.id,
      containerTag: args.containerTag,
      content: args.content,
      customId: args.customId,
      metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
      status: (json.status as
        | "unknown"
        | "queued"
        | "extracting"
        | "chunking"
        | "embedding"
        | "indexing"
        | "done"
        | "failed") ?? "queued",
    });

    return { documentId: json.id, status: json.status };
  }

  /** Refresh a document's processing status, title, and summary from Supermemory. */
  async refreshDocument(
    ctx: GenericActionCtx<GenericDataModel>,
    args: { documentId: string },
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl()}/v3/documents/${encodeURIComponent(args.documentId)}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Supermemory document: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      id: string;
      status: string;
      title: string | null;
      summary: string | null;
      content: string | null;
      metadata: Record<string, unknown> | null;
    };

    const existing = await ctx.runQuery(this.component.lib.getDocument, { documentId: args.documentId });

    await ctx.runMutation(this.component.lib.recordDocument, {
      documentId: json.id,
      containerTag: existing?.containerTag ?? "",
      content: json.content ?? existing?.content,
      customId: existing?.customId,
      metadata: json.metadata ? JSON.stringify(json.metadata) : existing?.metadata,
      status: json.status as
        | "unknown"
        | "queued"
        | "extracting"
        | "chunking"
        | "embedding"
        | "indexing"
        | "done"
        | "failed",
      title: json.title ?? undefined,
      summary: json.summary ?? undefined,
    });
  }

  async deleteDocument(
    ctx: GenericActionCtx<GenericDataModel>,
    args: { documentId: string },
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl()}/v3/documents/${encodeURIComponent(args.documentId)}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete Supermemory document: ${res.status} ${await res.text()}`);
    }
    await ctx.runMutation(this.component.lib.deleteDocument, { documentId: args.documentId });
  }

  /** Semantic search over a container's document chunks. Always live — not cached locally. */
  async search(args: SearchArgs): Promise<SearchResponse> {
    const res = await fetch(`${this.baseUrl()}/v3/search`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        q: args.query,
        // Supermemory's /v3/search schema documents singular `containerTag` as
        // valid, but the only worked example in their own docs uses the plural
        // `containerTags` array — and in practice singular reliably returns
        // zero matches even against fully-indexed content. Use the array form.
        containerTags: [args.containerTag],
        limit: args.limit ?? 10,
        rerank: args.rerank ?? false,
        includeFullDocs: args.includeFullDocs ?? false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to search Supermemory: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as SearchResponse;
  }

  async getMemory(ctx: RunQueryCtx, args: { memoryId: string }) {
    return await ctx.runQuery(this.component.lib.getMemory, args);
  }

  async listMemories(ctx: RunQueryCtx, args: { containerTag: string; limit?: number }) {
    return await ctx.runQuery(this.component.lib.listMemories, args);
  }

  async getDocument(ctx: RunQueryCtx, args: { documentId: string }) {
    return await ctx.runQuery(this.component.lib.getDocument, args);
  }

  async listDocuments(ctx: RunQueryCtx, args: { containerTag: string; limit?: number }) {
    return await ctx.runQuery(this.component.lib.listDocuments, args);
  }

  async getStats(ctx: RunQueryCtx) {
    return await ctx.runQuery(this.component.lib.getStats, {});
  }

  async listRecentMemories(ctx: RunQueryCtx, args: { limit?: number } = {}) {
    return await ctx.runQuery(this.component.lib.listRecentMemories, args);
  }

  async listRecentDocuments(ctx: RunQueryCtx, args: { limit?: number } = {}) {
    return await ctx.runQuery(this.component.lib.listRecentDocuments, args);
  }
}

type RunQueryCtx = {
  runQuery: GenericActionCtx<GenericDataModel>["runQuery"];
};
