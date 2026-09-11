import { defineApp } from "convex/server";
import convexSupermemory from "../../src/component/convex.config.js";

const app = defineApp();
app.use(convexSupermemory);

export default app;
