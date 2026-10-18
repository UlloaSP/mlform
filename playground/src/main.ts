import "../../brand/typography.css";
import "./styles.css";
import mark from "../../brand/mlform.png?url";
import monaLicense from "../../brand/fonts/mona-sans-LICENSE.txt?url";
import monoLicense from "../../brand/fonts/jetbrains-mono-LICENSE.txt?url";
import { mountDemoShell } from "./demo-shell.ts";
import { mountDemoPreview } from "./demo-preview.ts";

document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href = mark;
for (const href of [monaLicense, monoLicense, "/fonts/quicksand-OFL.txt"]) {
  const link = document.createElement("link");
  link.rel = "license";
  link.href = href;
  document.head.append(link);
}

if (new URLSearchParams(window.location.search).get("preview") === "1") {
  window.mlformPreview = mountDemoPreview();
} else {
  mountDemoShell();
}
