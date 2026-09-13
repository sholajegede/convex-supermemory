/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      deleteDocument: FunctionReference<
        "mutation",
        "internal",
        { documentId: string },
        null,
        Name
      >;
      getDocument: FunctionReference<
        "query",
        "internal",
        { documentId: string },
        null | {
          _creationTime: number;
          _id: string;
          containerTag: string;
          content?: string;
          createdAt: number;
          customId?: string;
          documentId: string;
          metadata?: string;
          status:
            | "unknown"
            | "queued"
            | "extracting"
            | "chunking"
            | "embedding"
            | "indexing"
            | "done"
            | "failed";
          summary?: string;
          title?: string;
          updatedAt: number;
        },
        Name
      >;
      getMemory: FunctionReference<
        "query",
        "internal",
        { memoryId: string },
        null | {
          _creationTime: number;
          _id: string;
          containerTag: string;
          content: string;
          createdAt: number;
          forgetAfter?: number;
          forgetReason?: string;
          forgotten: boolean;
          isStatic: boolean;
          memoryId: string;
          metadata?: string;
          updatedAt: number;
        },
        Name
      >;
      getStats: FunctionReference<
        "query",
        "internal",
        {},
        { documents: number; memories: number },
        Name
      >;
      listDocuments: FunctionReference<
        "query",
        "internal",
        { containerTag: string; limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          containerTag: string;
          content?: string;
          createdAt: number;
          customId?: string;
          documentId: string;
          metadata?: string;
          status:
            | "unknown"
            | "queued"
            | "extracting"
            | "chunking"
            | "embedding"
            | "indexing"
            | "done"
            | "failed";
          summary?: string;
          title?: string;
          updatedAt: number;
        }>,
        Name
      >;
      listMemories: FunctionReference<
        "query",
        "internal",
        { containerTag: string; limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          containerTag: string;
          content: string;
          createdAt: number;
          forgetAfter?: number;
          forgetReason?: string;
          forgotten: boolean;
          isStatic: boolean;
          memoryId: string;
          metadata?: string;
          updatedAt: number;
        }>,
        Name
      >;
      listRecentDocuments: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          containerTag: string;
          content?: string;
          createdAt: number;
          customId?: string;
          documentId: string;
          metadata?: string;
          status:
            | "unknown"
            | "queued"
            | "extracting"
            | "chunking"
            | "embedding"
            | "indexing"
            | "done"
            | "failed";
          summary?: string;
          title?: string;
          updatedAt: number;
        }>,
        Name
      >;
      listRecentMemories: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          containerTag: string;
          content: string;
          createdAt: number;
          forgetAfter?: number;
          forgetReason?: string;
          forgotten: boolean;
          isStatic: boolean;
          memoryId: string;
          metadata?: string;
          updatedAt: number;
        }>,
        Name
      >;
      markMemoryForgotten: FunctionReference<
        "mutation",
        "internal",
        { memoryId: string },
        null,
        Name
      >;
      recordDocument: FunctionReference<
        "mutation",
        "internal",
        {
          containerTag: string;
          content?: string;
          customId?: string;
          documentId: string;
          metadata?: string;
          status:
            | "unknown"
            | "queued"
            | "extracting"
            | "chunking"
            | "embedding"
            | "indexing"
            | "done"
            | "failed";
          summary?: string;
          title?: string;
        },
        string,
        Name
      >;
      recordMemory: FunctionReference<
        "mutation",
        "internal",
        {
          containerTag: string;
          content: string;
          forgetAfter?: number;
          forgetReason?: string;
          isStatic: boolean;
          memoryId: string;
          metadata?: string;
        },
        string,
        Name
      >;
    };
  };
