import { CosmosClient } from "@azure/cosmos";

const DATABASE_ID = process.env.COSMOS_DATABASE_ID || "annadatha";
const CLIENT = process.env.COSMOS_CONNECTION_STRING
  ? new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  : null;

const names = {
  profiles: "profiles",
  listings: "listings",
  inquiries: "inquiries",
  orders: "orders",
  notifications: "notifications",
  otpChallenges: "otp-challenges",
  publicData: "public-data",
};

const requireContainer = (name) => {
  if (!CLIENT) {
    throw new Error("COSMOS_CONNECTION_STRING is not configured.");
  }
  return CLIENT.database(DATABASE_ID).container(names[name] || name);
};

const query = async (name, querySpec) => {
  const { resources } = await requireContainer(name).items.query(querySpec).fetchAll();
  return resources;
};

const upsert = async (name, doc) => {
  const { resource } = await requireContainer(name).items.upsert(doc);
  return resource;
};

const read = async (name, id, partitionKey) => {
  const { resource } = await requireContainer(name).item(id, partitionKey).read();
  return resource || null;
};

const patch = async (name, id, partitionKey, operations) => {
  const { resource } = await requireContainer(name).item(id, partitionKey).patch(operations);
  return resource;
};

export const store = { query, upsert, read, patch };
