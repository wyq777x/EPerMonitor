const { rm } = require("fs/promises");
const path = require("path");

async function clean() {
  const distPath = path.resolve(__dirname, "..", "dist");
  await rm(distPath, { recursive: true, force: true });
}

clean().catch((err) => {
  console.error("Failed to clean dist directory:", err);
  process.exitCode = 1;
});
