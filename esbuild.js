const esbuild = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");

/**
 * @type {import("esbuild").BuildOptions}
 */
const options = {
  entryPoints: ["./src/main.ts"],
  bundle: true,
  platform: "node",
  outfile: "dist/bundle.js",
  plugins: [nodeExternalsPlugin()],
  loader: {
    ".txt": "text",
  },
  minify: true,

  logLevel: "info",
};

void (async function () {
  if (process.argv[2] == "w") {
    const context = await esbuild.context(options);

    await context.watch();
  } else {
    await esbuild.build(options);
  }
})();