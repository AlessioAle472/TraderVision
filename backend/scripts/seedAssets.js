require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const FinancialAsset = require('../models/FinancialAsset');
const ASSET_UNIVERSE = require('../seeds/assetUniverse');

/**
 * Seeds the FinancialAsset collection with the curated high-profile asset universe.
 * Uses bulkWrite with upsert to prevent duplicates and keep data current.
 */
async function seedFinancialAssets() {
  console.log(`[SeedAssets] Starting seeding of ${ASSET_UNIVERSE.length} curated assets...`);
  try {
    const operations = ASSET_UNIVERSE.map(asset => ({
      updateOne: {
        filter: { ticker: asset.ticker.toUpperCase() },
        update: { $set: asset },
        upsert: true
      }
    }));

    const result = await FinancialAsset.bulkWrite(operations);
    console.log(`[SeedAssets] ✅ Seeding completed! Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
    return {
      total: ASSET_UNIVERSE.length,
      matched: result.matchedCount,
      upserted: result.upsertedCount,
      modified: result.modifiedCount
    };
  } catch (error) {
    console.error('[SeedAssets] ❌ Error during asset seeding:', error);
    throw error;
  }
}

// If executed directly from CLI (e.g. node scripts/seedAssets.js)
if (require.main === module) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[SeedAssets] FATAL: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      console.log('[SeedAssets] Connected to MongoDB Atlas');
      await seedFinancialAssets();
      await mongoose.disconnect();
      console.log('[SeedAssets] Disconnected from MongoDB. Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SeedAssets] Connection error:', err.message);
      process.exit(1);
    });
}

module.exports = { seedFinancialAssets };
