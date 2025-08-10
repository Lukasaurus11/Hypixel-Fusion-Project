import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { getBazaarInformation } from "../../lib/fetchInfo";
import { calculateAccurateProfit } from "../../lib/calculateProfits";
import { fetchProductPriceHistory } from "../../lib/fetchPriceHistory";
import { PriceSettings } from "../../lib/types";

export async function POST(request: Request) {
  try {
    // Parse request body for price settings and COPE mode
    let priceSettings: PriceSettings = {
      ingredientPriceType: "buyPrice",
      outputPriceType: "buyPrice",
    };
    let copeMode = false;

    try {
      const body = await request.json();
      if (body.priceSettings) {
        priceSettings = body.priceSettings;
      }
      if (body.copeMode !== undefined) {
        copeMode = body.copeMode;
      }
    } catch {
      // If no body or invalid JSON, use default settings
    }

    // Open database connection
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Update bazaar information
    await getBazaarInformation(db);

    // Calculate profits with price settings and COPE mode
    calculateAccurateProfit(db, true, copeMode, priceSettings);

    // Update last update time
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT OR REPLACE INTO meta_info (key, value)
      VALUES (?, ?)
    `
    ).run("last_update", now);

    // Close database connection
    db.close();

    // Start price history update in the background with its own connection
    fetchProductPriceHistory().catch((error) => {
      console.error("Error updating price history:", error);
    });

    return NextResponse.json({ success: true, lastUpdate: now });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json(
      { error: "Failed to update data" },
      { status: 500 }
    );
  }
}
