const { cp, mkdir } = require("fs/promises");
const path = require("path");

async function copyAssets() {
  const root = path.resolve(__dirname, "..");
  const srcRenderer = path.join(root, "src", "renderer");
  const distRenderer = path.join(root, "dist", "renderer");
  const cssSrc = path.join(srcRenderer, "css");
  const cssDst = path.join(distRenderer, "css");
  const htmlSrc = path.join(srcRenderer, "index.html");
  const htmlDst = path.join(distRenderer, "index.html");

  await mkdir(distRenderer, { recursive: true });
  await cp(cssSrc, cssDst, { recursive: true });
  await cp(htmlSrc, htmlDst, { recursive: true });
}

copyAssets().catch((err) => {
  console.error("Failed to copy renderer assets:", err);
  process.exitCode = 1;
});
