import { build } from "https://deno.land/x/dnt@0.5.0/mod.ts";

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  package: {
    name: "jason-validator",
    version: Deno.args[0],
    description:
      "A composable validation library for TypeScript and JavaScript with amazing type support.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/sno2/jason.git",
    },
    bugs: {
      url: "https://github.com/sno2/jason/issues",
    },
  },
});

// post build steps
await Promise.allSettled([
  Deno.copyFile("LICENSE", "npm/LICENSE"),
  Deno.copyFile("README.md", "npm/README.md"),
]);
