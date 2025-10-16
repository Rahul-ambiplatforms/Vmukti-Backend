const mongoose = require("mongoose");

// Import schemas without binding to model names, so we can create tenant-specific models
const UserSchema = require("./User").schema || require("./User");
const BlogSchema = require("./Blog").schema || require("./Blog");
const JobSchema = require("./Job").schema || require("./Job");

// Cache per-tenant models to avoid recompilation warnings
const modelCache = new Map(); // key: `${tenant}:${name}` => model

function getNames(tenant, base) {
  if (tenant === "arcis") {
    return { modelName: `Arcis_${base}`, collectionName: `arcis-${base.toLowerCase()}s` };
  }
  return { modelName: base, collectionName: undefined };
}

function getOrCreateModel(tenant, name, schema) {
  const key = `${tenant}:${name}`;
  if (modelCache.has(key)) return modelCache.get(key);

  const { modelName, collectionName } = getNames(tenant, name);

  let model;
  try {
    model = mongoose.model(modelName);
  } catch {
    model = mongoose.model(modelName, schema, collectionName);
  }

  modelCache.set(key, model);
  return model;
}

module.exports = {
  userModel: (tenant = "vmukti") => getOrCreateModel(tenant, "User", UserSchema),
  blogModel: (tenant = "vmukti") => getOrCreateModel(tenant, "Blog", BlogSchema),
  jobModel: (tenant = "vmukti") => getOrCreateModel(tenant, "Job", JobSchema),
};

