import { renderLayout } from "./layout.js";
import { PAGES } from "./pages.js";

(async () => {
  try { await renderLayout(); } catch (e) { console.error("layout", e); }
  const page = document.body.dataset.page;
  const init = PAGES[page];
  if (init) { try { await init(); } catch (e) { console.error(page, e); } }
})();
