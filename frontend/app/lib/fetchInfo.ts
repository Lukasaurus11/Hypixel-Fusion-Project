import { BazaarProduct, BazaarData } from "./types";
import Database from "better-sqlite3";
import path from "path";

export async function getBazaarInformation(
  db: Database.Database
): Promise<void> {
  try {
    // Drop existing table
    db.prepare("DROP TABLE IF EXISTS bazaar_info").run();

    // Create new table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS bazaar_info (
        product_id TEXT PRIMARY KEY,
        sell_price REAL,
        sell_volume INTEGER,
        sell_moving_week INTEGER,
        sell_orders INTEGER,
        buy_price REAL,
        buy_volume INTEGER,
        buy_moving_week INTEGER,
        buy_orders INTEGER
      )
    `
    ).run();

    // Fetch data from Hypixel API
    const response = await fetch("https://api.hypixel.net/v2/skyblock/bazaar", {
      headers: process.env.HYPIXEL_TOKEN
        ? {
            "API-Key": process.env.HYPIXEL_TOKEN,
          }
        : {},
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const products = data.products as {
      [key: string]: { quick_status: BazaarProduct };
    };

    // Prepare the insert statement
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO bazaar_info (
        product_id, sell_price, sell_volume, sell_moving_week, sell_orders,
        buy_price, buy_volume, buy_moving_week, buy_orders
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Start a transaction for better performance
    const transaction = db.transaction(() => {
      for (const [productId, product] of Object.entries(products)) {
        const status = product.quick_status;
        insertStmt.run(
          productId,
          status.sellPrice,
          status.sellVolume,
          status.sellMovingWeek,
          status.sellOrders,
          status.buyPrice,
          status.buyVolume,
          status.buyMovingWeek,
          status.buyOrders
        );
      }
    });

    // Execute the transaction
    transaction();
  } catch (error) {
    console.error("Error in getBazaarInformation:", error);
    throw error;
  }
}
