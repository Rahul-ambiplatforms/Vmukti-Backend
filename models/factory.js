const mongoose = require("mongoose");

// Import schemas without binding to model names, so we can create tenant-specific models
const UserSchema = require("./User").schema || require("./User");
const BlogSchema = require("./Blog").schema || require("./Blog");
const JobSchema = require("./Job").schema || require("./Job");

// Cache per-tenant models to avoid recompilation warnings
const modelCache = new Map(); // key: `${tenant}:${name}` => model

function getTenantPrefix(tenant) {
  return tenant === "arcis" ? "Arcis_" : ""; 
}

function getOrCreateModel(tenant, name, schema) {
  const key = `${tenant}:${name}`;
  if (modelCache.has(key)) return modelCache.get(key);

  const prefix = getTenantPrefix(tenant);
  const modelName = `${prefix}${name}`; // model name also used as collection base unless overriden

  // If model already compiled globally (e.g., existing Vmukti models), reuse where appropriate
  let model;
  try {
    model = mongoose.model(modelName);
  } catch {
    model = mongoose.model(modelName, schema, undefined); // let mongoose derive collection from modelName
  }

  modelCache.set(key, model);
  return model;
}

module.exports = {
  userModel: (tenant = "vmukti") => getOrCreateModel(tenant, "User", UserSchema),
  blogModel: (tenant = "vmukti") => getOrCreateModel(tenant, "Blog", BlogSchema),
  jobModel: (tenant = "vmukti") => getOrCreateModel(tenant, "Job", JobSchema),
};


