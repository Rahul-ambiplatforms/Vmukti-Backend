module.exports = function tenantMiddleware(req, res, next) {
  const headerTenant = (req.headers["x-tenant"] || "").toString().trim().toLowerCase();
  const queryTenant = (req.query && req.query.tenant ? String(req.query.tenant) : "").trim().toLowerCase();

  let tenant = headerTenant || queryTenant;

  if (!tenant) {
    const host = (req.headers.host || "").toString().toLowerCase();
    if (host.includes("arcis")) tenant = "arcis";
    else tenant = "vmukti"; // default existing site
  }

  // Normalize only supported tenants for now
  if (tenant !== "arcis") tenant = "vmukti";

  req.tenant = tenant;
  next();
}


