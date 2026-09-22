import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
let pathname = "/home-district/roster";
const source = readFileSync("src/components/mobile/MobileAppShell.tsx", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;
const loaded = { exports: {} };
const mockedRequire = (id) => {
  if (id === "next/navigation") return { usePathname: () => pathname };
  if (id === "next/link") return {
    __esModule: true,
    default: ({ children, ...props }) => React.createElement("a", props, children),
  };
  if (id === "@/lib/client-analytics") return { trackRepWatchrEvent: () => {} };
  return require(id);
};
new Function("require", "module", "exports", compiled)(mockedRequire, loaded, loaded.exports);
const MobileAppShell = loaded.exports.default;
const render = () => renderToStaticMarkup(React.createElement(MobileAppShell));
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

try {
  for (const [route, query] of [
    ["/home-district/roster", "?q=Longview&county=Harrison"],
    ["/home-district/roster/city/longview", "?q=old-roster-filter"],
    ["/officials/jay-dean", "?from=roster"],
    ["/news/local-record", "?utm_source=shared"],
    ["/elections/texas/local-race", "?view=sources"],
  ]) {
    pathname = route;
    delete globalThis.window;
    const serverMarkup = render();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { origin: "https://www.repwatchr.com", href: `https://www.repwatchr.com${route}${query}`, search: query } },
    });
    const browserMarkup = render();
    assert.equal(browserMarkup, serverMarkup, `Initial markup must not change when the browser exposes query filters: ${route}`);
    const href = `/submit-source?target=${encodeURIComponent(route)}`;
    assert.ok(browserMarkup.includes(`href="${href}"`), `Source target follows the current pathname: ${route}`);
    assert.ok(!browserMarkup.includes(encodeURIComponent(query)), "Filter and tracking queries must not become source targets");
  }
} finally {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete globalThis.window;
}

console.log("Mobile dock links passed: identical server/browser markup and current pathname targets across route variants.");
