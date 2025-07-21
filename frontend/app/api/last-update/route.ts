import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET() {
  try {
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Create the table if it doesn't exist
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS meta_info (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `
    ).run();

    // Get the last update time
    const result = db
      .prepare("SELECT value FROM meta_info WHERE key = ?")
      .get("last_update");

    db.close();

    return NextResponse.json({ lastUpdate: result?.value || null });
  } catch (error) {
    console.error("Error getting last update time:", error);
    return NextResponse.json(
      { error: "Failed to get last update time" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Update the last update time
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT OR REPLACE INTO meta_info (key, value)
      VALUES (?, ?)
    `
    ).run("last_update", now);

    db.close();

    return NextResponse.json({ lastUpdate: now });
  } catch (error) {
    console.error("Error updating last update time:", error);
    return NextResponse.json(
      { error: "Failed to update last update time" },
      { status: 500 }
    );
  }
}
