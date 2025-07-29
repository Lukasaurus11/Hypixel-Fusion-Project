import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET() {
  try {
    // Open the database from the data directory
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Check if cost column exists
    const tableInfo = db.prepare("PRAGMA table_info(shard_profit_data)").all();
    const hasCostColumn = tableInfo.some(
      (column: any) => column.name === "cost"
    );

    // Get all items, sorted by profit
    const selectQuery = hasCostColumn
      ? `
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
      : `
      SELECT 
        recipe_id,
        output_item,
        demand,
        profit,
        0 as cost,
        ingredients,
        id
      FROM shard_profit_data
      ORDER BY profit DESC
    `;

    const items = db.prepare(selectQuery).all();

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
