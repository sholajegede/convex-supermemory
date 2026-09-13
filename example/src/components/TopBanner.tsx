export function TopBanner() {
  return (
    <div className="banner">
      This example logs to Supermemory using <code>SUPERMEMORY_API_KEY</code> (set via{" "}
      <code>npx convex env set</code>). Every memory/document below is scoped to whichever{" "}
      <code>containerTag</code> chip is selected above — switch it to see the same actions land in
      a completely separate memory space.
    </div>
  );
}
