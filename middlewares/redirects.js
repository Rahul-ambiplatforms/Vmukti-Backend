const fs = require("fs");
const path = require("path");

let redirectMap = {};
try {
  const mapPath = path.join(__dirname, "redirects.map.json");
  if (fs.existsSync(mapPath)) {
    redirectMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  }
} catch (e) {
  console.error("Failed to load redirects.map.json:", e);
}

function redirectLinks(req, res, next) {
  try {
    const absoluteUrl = new URL(req.originalUrl, `http://${req.headers.host}`);

    // Normalize pathname (decode, lowercase, strip trailing slash except root)
    let pathname = decodeURIComponent(absoluteUrl.pathname).toLowerCase();
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    // Canonical query string (sorted, lowercase)
    const queryString = Array.from(absoluteUrl.searchParams.entries())
      .map(([k, v]) => [k.toLowerCase(), (v || "").toLowerCase()])
      .sort()
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const canonicalKey = queryString ? `${pathname}?${queryString}` : pathname;

    const target = redirectMap[canonicalKey] || redirectMap[pathname];
    if (target) {
      console.log(`Redirecting 301 from ${req.originalUrl} -> ${target}`);
      return res.redirect(301, target);
    }

    next();
  } catch (err) {
    console.error("Redirect middleware error:", err);
    next();
  }
}

module.exports = redirectLinks;
