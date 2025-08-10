import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET() {
  try {
    // Open the database from the data directory
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Get regular items first (these should already have COPE mode applied if it was enabled during calculation)
    const items = db
      .prepare(
        `
      SELECT 
        recipe_id,
        output_item,
        demand,
        profit,
        cost,
        ingredients,
        id
      FROM shard_profit_data
      ORDER BY profit DESC
    `
      )
      .all();

    // Group items by output_item, keeping all recipes
    const groupedItems = items.reduce((acc: any, item: any) => {
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
    console.error("Error fetching COPE items:", error);
    return NextResponse.json(
      { error: "Failed to fetch COPE items" },
      { status: 500 }
    );
  }
}
