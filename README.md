# convex-supermemory

**Give your Convex app long-term, semantically searchable memory with Supermemory.** Reactive local memory and document state, direct REST integration.

[![npm version](https://img.shields.io/npm/v/convex-supermemory)](https://www.npmjs.com/package/convex-supermemory)
[![Convex Component](https://www.convex.dev/components/badge/sholajegede/convex-supermemory)](https://www.convex.dev/components/sholajegede/convex-supermemory)
[![npm downloads](https://img.shields.io/npm/dw/convex-supermemory)](https://www.npmjs.com/package/convex-supermemory)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)

```ts
const supermemory = new Supermemory(components.convexSupermemory, {
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});

// Store a fact about a user
const { memoryId } = await supermemory.addMemory(ctx, {
  containerTag: userId,
  content: "Prefers dark mode and terse responses",
});

// Recall it later with semantic search
const { results } = await supermemory.search({
  containerTag: userId,
  query: "how does this user like responses formatted?",
});
```

## What this does

An AI agent is only as good as what it remembers between calls. [Supermemory](https://supermemory.ai) is a memory API purpose-built for this: you write facts and documents into a `containerTag` (typically one per user or agent), and it handles embedding, chunking, and semantic search so you can recall the right context later — without you running your own vector database.

This component wraps Supermemory's REST API directly (no SDK dependency) and mirrors everything you write into Convex tables, so you get:

- **Fast-path memory** — `addMemory()` stores a single fact immediately, no processing pipeline
- **Document ingestion** — `addDocument()` sends larger content through Supermemory's extraction/chunking pipeline, with `refreshDocument()` to poll status
- **Semantic search** — `search()` proxies Supermemory's hybrid RAG + memory search live
- **Reactive local state** — every memory and document is queryable from Convex without an extra API call
- **Forgetting** — `forgetMemory()` / `deleteDocument()` keep local state in sync with what Supermemory actually removes

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Memories vs. Documents](#memories-vs-documents)
- [API Reference](#api-reference)
- [Type Reference](#type-reference)
- [Database Schema](#database-schema)
- [Container Tags](#container-tags)
- [Testing](#testing)
- [Example App](#example-app)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Changelog](#changelog)

## Install

```bash
npm install convex-supermemory
```

**Requirements:** Convex v1.33.1 or later, Node.js 18+, a [Supermemory](https://supermemory.ai) API key

## Quick Start

Three steps to add memory to your Convex app.

### 1. Add the component

In `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import convexSupermemory from "convex-supermemory/convex.config";

const app = defineApp();
app.use(convexSupermemory);

export default app;
```

### 2. Set environment variables

```bash
npx convex env set SUPERMEMORY_API_KEY sm_xxxxxxxxxxxx
```

### 3. Initialize the client

In `convex/memory.ts`:

```ts
import { components } from "./_generated/api";
import { Supermemory } from "convex-supermemory";

export const supermemory = new Supermemory(components.convexSupermemory, {
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});
```

Import `supermemory` from this file in any Convex action that needs to read or write memory.

## Usage

### Remember a fact

```ts
export const remember = action({
  args: { userId: v.string(), fact: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.addMemory(ctx, {
      containerTag: args.userId,
      content: args.fact,
      isStatic: true, // long-term fact, not a fading conversational detail
    });
  },
});
// Returns: { memoryId }
```

### Recall with semantic search

```ts
export const recall = action({
  args: { userId: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.search({
      containerTag: args.userId,
      query: args.query,
      limit: 5,
    });
  },
});
// Returns: { results: [{ documentId, score, summary, chunks, ... }], total }
```

### Forget a memory

`containerTag` is required here too — Supermemory scopes the delete by it, not just by `memoryId`.

```ts
export const forget = action({
  args: { userId: v.string(), memoryId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.forgetMemory(ctx, {
      containerTag: args.userId,
      memoryId: args.memoryId,
    });
  },
});
// Returns: { forgotten: boolean }
```

### List a user's memories reactively

```ts
export const getMemories = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await supermemory.listMemories(ctx, { containerTag: args.userId });
  },
});
```

## Memories vs. Documents

Supermemory exposes two ways to write content, and this component exposes both:

- **`addMemory()`** — for short, discrete facts ("the user is on the Pro plan", "prefers metric units"). No processing delay; usable in search immediately.
- **`addDocument()`** — for longer content (a support transcript, a page of documentation, a whole conversation) that needs to be chunked and embedded. Processing is asynchronous — call `refreshDocument()` to check on `status` (`queued` → `extracting` → `chunking` → `embedding` → `indexing` → `done`).

## API Reference

| Method | Kind | Description |
| --- | --- | --- |
| `addMemory(ctx, args)` | action | Stores a single fact immediately |
| `forgetMemory(ctx, args)` | action | Requests Supermemory forget a memory (scoped by `containerTag`) |
| `addDocument(ctx, args)` | action | Ingests larger content through the chunking pipeline |
| `refreshDocument(ctx, args)` | action | Pulls the latest status/title/summary for a document |
| `deleteDocument(ctx, args)` | action | Deletes a document from Supermemory and locally |
| `search(args)` | plain async | Live semantic search — not cached locally |
| `getMemory(ctx, args)` | query | Fetch one memory by id |
| `listMemories(ctx, args)` | query | List a container's memories, newest first |
| `getDocument(ctx, args)` | query | Fetch one document by id |
| `listDocuments(ctx, args)` | query | List a container's documents, newest first |
| `getStats(ctx)` | query | Aggregate memory/document counts for a small dashboard |
| `listRecentMemories(ctx, args?)` | query | Every memory, newest first, regardless of containerTag |
| `listRecentDocuments(ctx, args?)` | query | Every document, newest first, regardless of containerTag |

## Type Reference

```ts
type AddMemoryArgs = {
  containerTag: string;
  content: string;
  isStatic?: boolean;
  metadata?: Record<string, unknown>;
  forgetAfter?: number;   // ms epoch
  forgetReason?: string;
};

type AddDocumentArgs = {
  containerTag: string;
  content: string;
  customId?: string;
  metadata?: Record<string, unknown>;
};

type SearchArgs = {
  containerTag: string;
  query: string;
  limit?: number;
  rerank?: boolean;
  includeFullDocs?: boolean;
};

type SearchResponse = {
  results: Array<{
    documentId: string;
    title: string | null;
    score: number;
    summary: string | null;
    content: string | null;
    chunks: Array<{ content: string; score: number; position: number; isRelevant: boolean }>;
  }>;
  total: number;
  timing?: number; // ms, when Supermemory reports it
};
```

## Database Schema

```ts
memories: {
  memoryId, containerTag, content, isStatic, metadata?,
  forgetAfter?, forgetReason?, forgotten,
  createdAt, updatedAt,
}

documents: {
  documentId, containerTag, content?, customId?, metadata?, status,
  title?, summary?,
  createdAt, updatedAt,
}
```

`getStats()`, `listRecentMemories()`, and `listRecentDocuments()` read across these tables directly with a full scan — fine for a dashboard or history view, not intended as a high-volume production query path.

## Container Tags

Supermemory scopes everything — writes, search, and profiles — by `containerTag`. Use one per user for personal memory, or one per agent/workspace for shared memory. Search only ever looks within the container tag you pass, so pick a convention early (this component doesn't enforce one).

## Testing

```bash
npm run test
```

Component logic is tested with [`convex-test`](https://www.npmjs.com/package/convex-test) in `src/component/lib.test.ts`. Import `convex-supermemory/test` in your own app to register this component's schema against your test instance.

## Example App

`example/` is a full Vite + React demo that exercises the entire component end to end against your own Supermemory account:

- **Memories** — add a fact with `addMemory()` (with suggestion chips to try), forget it with `forgetMemory()`, all reactive.
- **Documents** — ingest longer content with `addDocument()`, poll status with `refreshDocument()`, remove it with `deleteDocument()`.
- **Search** — run `search()` against whichever containerTag is selected, showing result score, matching chunks, and Supermemory's own reported `total`/`timing`.
- **containerTag switcher** — a row of chips lets you flip between a few demo users live, so you can see the exact same actions land in completely separate memory spaces.
- **History** — every memory and document ever written in the deployment, newest first, across every containerTag. Expand a row for full detail, or hit **Recreate live** to replay it as a brand-new memory/document.
- **Activity console** — a side-docked live log of every call this app makes into the Supermemory client, including real API errors (e.g. Supermemory returns `409` if you try to delete a document that's still processing).

Run it from the repo root:

```bash
npm install --legacy-peer-deps
npx convex env set SUPERMEMORY_API_KEY sm_xxxxxxxxxxxx
npm run dev
```

`npm run dev` starts the Convex backend and the Vite frontend together — there's no need to `cd example` or run either one separately.

## Limitations

- `search()` always calls Supermemory live — results are not cached or mirrored into Convex tables, since they're a ranked view over the underlying memories/documents rather than durable records themselves.
- Document processing is asynchronous; this component does not poll for you. Call `refreshDocument()` on a schedule (e.g. a Convex cron or scheduled function) if you need status without a user-triggered refresh.
- `forgetMemory()` reflects whatever `forgotten` value Supermemory returns — if Supermemory forgets asynchronously, the local record may briefly still show `forgotten: false`.
- `deleteDocument()` throws if Supermemory reports the document is still processing (`409`) — retry after the document reaches a terminal status (`done`/`failed`).

## Troubleshooting

**401/403 from Supermemory** — confirm `SUPERMEMORY_API_KEY` is set and starts with `sm_`.

**Search returns nothing** — confirm you're searching the same `containerTag` you wrote memories/documents into; container tags are exact-match scopes, not fuzzy. If the document was ingested moments ago, give it a few seconds to finish indexing even after `refreshDocument()` reports `done`.

**Document stuck in `queued`/`extracting`** — large documents can take longer to process; call `refreshDocument()` again after a short delay.

**Deleting a document fails with a "still processing" error** — Supermemory returns `409` for a document that hasn't reached a terminal status yet; wait for `refreshDocument()` to report `done` or `failed`, then delete.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
