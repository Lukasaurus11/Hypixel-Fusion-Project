import { NextResponse } from "next/server";
import { getTaskStatus } from "../../lib/fetchPriceHistory";

export async function GET() {
  const status = getTaskStatus();
  return NextResponse.json({
    isRunning: status.isRunning,
    progress: status.progress,
    total: status.total,
    message: status.message,
  });
}
