import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/billar_en_linea";

await mongoose.connect(MONGO_URI);
console.log("Conectado a MongoDB");

const db = mongoose.connection.db;
const collection = db.collection("activitynumbers");

const staleIndexes = [
  "raffle_1_number_1",
  "raffle_1_numericValue_1",
  "raffle_1_status_1_numericValue_1",
];

for (const indexName of staleIndexes) {
  try {
    await collection.dropIndex(indexName);
    console.log(`✓ Índice eliminado: ${indexName}`);
  } catch (err) {
    if (err.codeName === "IndexNotFound") {
      console.log(`— Índice no encontrado (ya no existe): ${indexName}`);
    } else {
      console.error(`✗ Error al eliminar ${indexName}:`, err.message);
    }
  }
}

console.log("\nÍndices actuales en activitynumbers:");
const indexes = await collection.indexes();
for (const idx of indexes) {
  console.log(" -", idx.name, JSON.stringify(idx.key));
}

await mongoose.disconnect();
