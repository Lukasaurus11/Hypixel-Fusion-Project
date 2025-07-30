import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET() {
  try {
    // Open the database from the data directory
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Get all shards from shard_to_productid table
    const shards = db
      .prepare(
        `
        SELECT 
          name,
          productID,
          rarity,
          family,
          craftingID
        FROM shard_to_productid
        ORDER BY name ASC
      `
      )
      .all();

    // Close the database connection
    db.close();

    return NextResponse.json({ shards });
  } catch (error) {
    console.error("Error fetching shards:", error);
    return NextResponse.json(
      { error: "Failed to fetch shards" },
      { status: 500 }
    );
  }
}
