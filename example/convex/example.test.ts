import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "../../src/component/schema.js";

const modules = import.meta.glob("./**/*.ts");
const componentModules = import.meta.glob("../../src/component/**/*.ts");

function initConvexTest() {
  const t = convexTest(schema, modules);
  t.registerComponent("convexSupermemory", schema, componentModules);
  return t;
}

test("listMemories returns empty array for unknown container", async () => {
  const t = initConvexTest();
  const result = await t.query(api.example.listMemories, { userId: "unknown_user" });
  expect(result).toEqual([]);
});
