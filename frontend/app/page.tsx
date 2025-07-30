"use client";

import { useEffect, useState } from "react";
import ItemGrid from "../components/ItemGrid";
import { Item } from "../types/items";
import Footer from "../components/Footer";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchData = async (forceUpdate = false, priceSettings?: any) => {
    try {
      setLoading(true);
      setError(null);

      if (forceUpdate) {
        // Update data with price settings
        const updateResponse = await fetch("/api/update-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priceSettings }),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to update data");
        }

        const data = await updateResponse.json();
        setLastUpdate(data.lastUpdate);
      } else {
        // Just get last update time
        const lastUpdateResponse = await fetch("/api/last-update");
        const { lastUpdate } = await lastUpdateResponse.json();
        setLastUpdate(lastUpdate);
      }

      // Fetch items
      const itemsResponse = await fetch("/api/items");
      const data = await itemsResponse.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Convert grouped items to flat array
      const flatItems = Object.values(data.items).flat() as Item[];
      setItems(flatItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData(false);
  }, []);

  const handleRefresh = async (priceSettings?: any) => {
    try {
      await fetchData(true, priceSettings);
    } catch (error) {
      console.error("Error refreshing data:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-center text-gray-300">Loading items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-center text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="h-screen bg-gray-900 p-8 overflow-hidden flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-100">
        Shard Fusion Profit Website
      </h1>
      <ItemGrid items={items} onDataRefresh={handleRefresh} />
      <Footer lastUpdated={lastUpdate || "Never"} onRefresh={handleRefresh} />
    </main>
  );
}
