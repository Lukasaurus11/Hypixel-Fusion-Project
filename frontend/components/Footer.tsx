"use client";

import { useEffect, useState } from "react";

interface FooterProps {
  lastUpdated: string;
  onRefresh?: () => Promise<void>;
}

export default function Footer({ lastUpdated, onRefresh }: FooterProps) {
  const [taskStatus, setTaskStatus] = useState<{
    isRunning: boolean;
    progress: number;
    total: number;
    message: string | null;
  } | null>(null);

  // Check task status periodically
  useEffect(() => {
    const checkTaskStatus = async () => {
      try {
        const response = await fetch("/api/price-history-status");
        const status = await response.json();
        setTaskStatus(status);
      } catch (error) {
        console.error("Error checking task status:", error);
      }
    };

    // Check immediately
    checkTaskStatus();

    // Then check every 2 seconds
    const intervalId = setInterval(checkTaskStatus, 2000);

    return () => clearInterval(intervalId);
  }, []);

  // Convert ISO string to a more readable format
  const formattedDate =
    lastUpdated !== "Never"
      ? new Date(lastUpdated).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "medium",
        })
      : "Never";

  const handleRefresh = async () => {
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Failed to update data. Please try again.");
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white py-2 border-t-2 border-gray-600 text-sm z-50">
      <div className="w-full flex justify-between items-center px-6">
        <div className="text-left flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Last updated: {formattedDate}</span>
            <button
              onClick={handleRefresh}
              className="bg-gray-700 p-1.5 rounded hover:bg-gray-600 transition-colors"
              title="Refresh data"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          {taskStatus?.isRunning && (
            <div className="text-blue-400">
              {taskStatus.message ||
                `Updating price data: ${taskStatus.progress}/${taskStatus.total}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Calculator made by Lukasaurus</span>
          <a
            href="https://github.com/Lukasaurus11/Hypixel-Fusion-Project"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 p-1.5 rounded-md hover:bg-gray-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
