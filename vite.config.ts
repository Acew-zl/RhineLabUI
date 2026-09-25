import { defineConfig } from "vite";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

// Keep Blender's stable source/export paths, while production URLs identify
// exact bytes and can be cached without revalidation across deployments.
const models = ["archive-cassette", "archive-assembly"].map(name => {
  const source = readFileSync(`public/assets/${name}.glb`);
  const hash = createHash("sha256").update(source).digest("hex").slice(0,16);
  return { key:`assets/${name}.glb`, fileName:`assets/${name}.${hash}.glb`, source };
});
const hasNovecento = ["Normal", "DemiBold", "Bold"].every(weight =>
  existsSync(`public/fonts/novecento/webFonts/NovecentoSansWide${weight}/font.woff2`),
);
export default defineConfig(({ mode }) => ({
  resolve: { alias: { '@search-provider': fileURLToPath(new URL(mode === 'extension-chrome' ? './src/bookmark-search-provider.chrome.ts' : './src/bookmark-search-provider.ts', import.meta.url)) } },
  base: mode === "wallpaper" || mode === "extension" || mode === "extension-chrome" ? "./" : "/",
  build: { copyPublicDir: mode !== "extension" && mode !== "extension-chrome" },
  define: {
    __RHINE_MODELS__: JSON.stringify(Object.fromEntries(models.map(model => [model.key,model.fileName]))),
    __RHINE_NOVECENTO__: JSON.stringify(hasNovecento && mode !== "extension" && mode !== "extension-chrome"),
  },
  plugins: [{
    name: "versioned-model-assets", apply: "build",
    buildStart() { for (const model of models) this.emitFile({type:"asset",fileName:model.fileName,source:model.source}); },
  }, ...(mode === "extension" || mode === "extension-chrome" ? [{
    name: "extension-host",
    transformIndexHtml(html: string) {
      return html.replace(/\s*<link rel="(?:manifest|apple-touch-icon)"[^>]*>/g, "")
        .replace('href="/favicon.svg"', 'href="./favicon.svg"');
    },
  }] : []), ...(mode === "wallpaper" ? [{
    name: "wallpaper-host",
    transformIndexHtml(html: string) {
      return { html: html.replace(/\s*<link rel="manifest"[^>]*>/, ""), tags: [{
        tag: "script", children: readFileSync("wallpaper/host.js", "utf8"), injectTo: "head-prepend" as const,
      }] };
    },
  }] : [])],
}));
