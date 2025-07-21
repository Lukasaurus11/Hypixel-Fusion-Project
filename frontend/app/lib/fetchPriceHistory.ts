import Database from "better-sqlite3";
import { PriceHistoryEntry } from "./types";
import path from "path";

let taskStatus = {
  isRunning: false,
  progress: 0,
  total: 0,
  lastUpdate: null as string | null,
  error: null as string | null,
  message: null as string | null,
};

function updateStatus(newMessage: string) {
  taskStatus.message = newMessage;
}

function logStatus(message: string) {
  console.log(message);
}

export function getTaskStatus() {
  if (taskStatus.isRunning && taskStatus.total > 0) {
    const percentComplete = Math.round(
      (taskStatus.progress / taskStatus.total) * 100
    );
    const message = `Updating price history: ${taskStatus.progress} of ${taskStatus.total} shards processed (${percentComplete}% complete)`;
    taskStatus.message = message;
  } else if (!taskStatus.isRunning && taskStatus.error) {
    taskStatus.message = `Error updating price history: ${taskStatus.error}`;
  } else if (!taskStatus.isRunning && taskStatus.lastUpdate) {
    taskStatus.message = `Price history last updated at ${taskStatus.lastUpdate}`;
  } else {
    taskStatus.message = null;
  }
  return { ...taskStatus };
}

function convertToUTCMinus6(date: Date): Date {
  return new Date(date.getTime() - 6 * 60 * 60 * 1000);
}

function getUTCMinus6ISOString(): string {
  return convertToUTCMinus6(new Date()).toISOString();
}

function shouldUpdatePriceHistory(lastUpdateTimestamp: string | null): boolean {
  if (!lastUpdateTimestamp) {
    console.log("No previous update found in database");
    return true;
  }

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  // Log the max timestamp from database (already in UTC-6)
  console.log("Max timestamp from database (UTC-6):", lastUpdateTimestamp);

  // Current time calculations
  const currentTime = new Date();
  console.log("Current time:", currentTime.toISOString());

  // Convert only current time to UTC-6
  const currentTimeUTC6 = convertToUTCMinus6(currentTime);
  console.log("Current time (UTC-6):", currentTimeUTC6.toISOString());

  // Use database timestamp directly since it's already UTC-6
  const lastUpdateDate = new Date(lastUpdateTimestamp);

  // Calculate time difference
  const timeDiffMs = currentTimeUTC6.getTime() - lastUpdateDate.getTime();
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60); // Convert to hours

  console.log("Time difference:", {
    milliseconds: timeDiffMs,
    hours: timeDiffHours.toFixed(2),
    needsUpdate: timeDiffMs >= TWO_HOURS_MS,
  });

  return timeDiffMs >= TWO_HOURS_MS;
}

export async function fetchProductPriceHistory(): Promise<void> {
  if (taskStatus.isRunning) {
    logStatus("Price history update is already running");
    return;
  }

  let db: Database.Database | null = null;

  try {
    taskStatus = {
      isRunning: true,
      progress: 0,
      total: 0,
      lastUpdate: null,
      error: null,
      message: null,
    };
    const initMessage = "Initializing price history update...";
    updateStatus(initMessage);
    logStatus(initMessage);

    // Open our own database connection
    db = new Database(path.join(process.cwd(), "data", "shard_recipes.db"));

    // Select all product_ids
    const productIds = db
      .prepare("SELECT productID FROM shard_to_productid")
      .all()
      .map((row: any) => (row as { productID: string }).productID);

    taskStatus.total = productIds.length;
    const startMessage = `Starting to update ${productIds.length} shards...`;
    updateStatus(startMessage);
    logStatus(startMessage);

    // Create table if not exists
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS product_price_history (
        product_id TEXT,
        buy_price REAL,
        sell_price REAL,
        timestamp TEXT,
        PRIMARY KEY (product_id, timestamp)
      )
    `
    ).run();

    // Check last update time
    const lastUpdate = db
      .prepare(
        "SELECT MAX(timestamp) as last_update FROM product_price_history"
      )
      .get() as { last_update: string | null };

    if (!shouldUpdatePriceHistory(lastUpdate?.last_update)) {
      const upToDateMessage =
        "Price history data is already up to date (less than 2 hours old)";
      logStatus(upToDateMessage);
      taskStatus.isRunning = false;
      taskStatus.progress = productIds.length;
      taskStatus.lastUpdate = lastUpdate.last_update;
      if (db) {
        db.close();
      }
      return;
    }

    logStatus("Data needs to be updated");

    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO product_price_history (
        product_id, buy_price, sell_price, timestamp
      ) VALUES (?, ?, ?, ?)
    `);

    // Process each product
    for (const [index, productId] of productIds.entries()) {
      try {
        const updateMessage = `Updating shard ${index + 1} of ${
          productIds.length
        }: ${productId}`;
        updateStatus(updateMessage);
        logStatus(updateMessage);

        const response = await fetch(
          `https://sky.coflnet.com/api/bazaar/${productId}/history/week`,
          {
            headers: {
              accept: "text/plain",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as PriceHistoryEntry[];

        // Filter and insert valid entries
        const transaction = db.transaction(() => {
          for (const entry of data) {
            if (entry.buy != null && entry.sell != null) {
              insertStmt.run(productId, entry.buy, entry.sell, entry.timestamp);
            } else {
              console.log(
                `Skipping entry with missing buy or sell price for product ${productId} at timestamp ${entry.timestamp}`
              );
            }
          }
        });

        transaction();

        // Update progress
        taskStatus.progress = index + 1;
        getTaskStatus(); // Only updates the message, no logging

        // Sleep for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMessage = `Error processing shard ${productId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        logStatus(errorMessage);
        updateStatus(errorMessage);
        // Continue with next product
      }
    }

    // Update last update time with UTC-6 timestamp
    taskStatus.lastUpdate = getUTCMinus6ISOString();
    const completionMessage = `Successfully updated ${productIds.length} shards at ${taskStatus.lastUpdate}`;
    updateStatus(completionMessage);
    logStatus(completionMessage);
  } catch (error) {
    console.error("Error in fetchProductPriceHistory:", error);
    taskStatus.error = error instanceof Error ? error.message : "Unknown error";
    const errorMessage = `Error updating price history: ${taskStatus.error}`;
    updateStatus(errorMessage);
    logStatus(errorMessage);
  } finally {
    // Close our database connection
    if (db) {
      db.close();
    }
    taskStatus.isRunning = false;
  }
}
