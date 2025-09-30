const fs = require("fs");
const path = require("path");

// Load mapping from JSON (supports hundreds of entries)
// JSON format: { "/old/path": "/new/path", "/solutions?slider=ems": "/solution/enterprise-management-system" }
let redirectMap = {};
try {
  const mapPath = path.join(__dirname, "redirects.map.json");
  if (fs.existsSync(mapPath)) {
    const raw = fs.readFileSync(mapPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      redirectMap = parsed;
    }
  }
} catch (e) {
  console.error("Failed to load redirects.map.json:", e);
}

function redirectLinks(req, res, next) {
  try {
    // Build absolute URL for reliable parsing (host required by WHATWG URL)
    const absoluteUrl = new URL(req.originalUrl, `http://${req.headers.host}`);

    // Normalize: decode and lowercase pathname, strip trailing slash (except root)
    let pathname = decodeURIComponent(absoluteUrl.pathname).toLowerCase();
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.replace(/\/+$/, "");
    }

    const searchParams = absoluteUrl.searchParams;

    // Build canonical key: pathname[?sortedQuery]
    const entries = Array.from(searchParams.entries())
      .map(([k, v]) => [k.toLowerCase(), (v || "").toLowerCase()])
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1].localeCompare(b[1])));
    const queryString = entries.length
      ? entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
      : "";
    const canonicalKey = queryString ? `${pathname}?${queryString}` : pathname;

    // Direct match on full canonical key
    if (redirectMap[canonicalKey]) {
      console.log(`Redirecting 301 from ${req.originalUrl} -> ${redirectMap[canonicalKey]}`);
      return res.redirect(301, redirectMap[canonicalKey]);
    }

    // Fallback: match on pathname only (ignore query)
    if (redirectMap[pathname]) {
      console.log(`Redirecting 301 from ${req.originalUrl} -> ${redirectMap[pathname]}`);
      return res.redirect(301, redirectMap[pathname]);
    }

    return next();
  } catch (err) {
    // If URL parsing fails for any reason, do not block request handling
    console.error("Redirect middleware error:", err);
    return next();
  }
}

module.exports = redirectLinks;
