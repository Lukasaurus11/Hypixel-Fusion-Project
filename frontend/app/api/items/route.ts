import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET() {
  try {
    // Open the database from the data directory
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Get all items, sorted by profit
    const items = db
      .prepare(
        `
      SELECT 
        recipe_id,
        output_item,
        demand,
        profit,
        ingredients,
        id
      FROM shard_profit_data
      ORDER BY profit DESC
    `
      )
      .all();

    // Group items by output_item, keeping all recipes
    const groupedItems = items.reduce((acc: any, item) => {
      if (!acc[item.output_item]) {
        acc[item.output_item] = [];
      }
      acc[item.output_item].push(item);
      return acc;
    }, {});

    // Close the database connection
    db.close();

    return NextResponse.json({ items: groupedItems });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
