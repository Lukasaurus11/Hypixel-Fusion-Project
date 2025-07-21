import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET(request: Request) {
  try {
    // Get the product name from the URL
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get("productName");

    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Open the database
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Get price history and average price for last 24 hours
    const priceHistory = db
      .prepare(
        `
        SELECT a.buy_price, a.timestamp
        FROM product_price_history as a
        JOIN shard_to_productid as b ON a.product_id = b.productID
        WHERE b.name = ?
        AND timestamp >= datetime('now', '-7 days')
        ORDER BY timestamp ASC
      `
      )
      .all(productName);

    // Get average price for last 24 hours
    const avgPriceData = db
      .prepare(
        `
        SELECT AVG(a.buy_price) as avg_price
        FROM product_price_history as a
        JOIN shard_to_productid as b ON a.product_id = b.productID
        WHERE b.name = ?
        AND timestamp >= datetime('now', '-1 day')
      `
      )
      .get(productName) as { avg_price: number } | undefined;

    // Get current price from shard_profit_data
    const currentPriceData = db
      .prepare(
        `
        SELECT current_price
        FROM shard_profit_data
        WHERE output_item = ?
        LIMIT 1
      `
      )
      .get(productName) as { current_price: number } | undefined;

    // Close the database connection
    db.close();

    return NextResponse.json({
      priceHistory,
      currentPrice: currentPriceData?.current_price || null,
      averagePrice: avgPriceData?.avg_price || null,
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}
