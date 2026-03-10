import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Экспорт выписки Ozon Банка",
  version: pkg.version,
  icons: {
    "16": "public/ozon_logo@0.12x.png",
    "32": "public/ozon_logo@0.25x.png",
    "64": "public/ozon_logo@0.5x.png",
    "128": "public/ozon_logo.png",
  },
  action: {
    default_icon: {
      "64": "public/ozon_logo@0.5x.png",
    },
    default_popup: "src/pages/popup/index.html",
  },
  permissions: [
    "sidePanel",
    "contentSettings",
    "tabs",
    "scripting",
    "activeTab",
  ],
});
