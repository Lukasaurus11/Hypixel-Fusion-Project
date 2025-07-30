"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Shard, ShardRecipe } from "../app/lib/types";

interface ShardRecipesTabProps {
  isActive: boolean;
}

export default function ShardRecipesTab({ isActive }: ShardRecipesTabProps) {
  const [shards, setShards] = useState<Shard[]>([]);
  const [selectedShard, setSelectedShard] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<ShardRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [shardsLoading, setShardsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shardScrollTop, setShardScrollTop] = useState(0);
  const [shardSearchQuery, setShardSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Virtual scrolling constants for shard list
  const SHARD_ITEM_HEIGHT = 72; // Height of each shard card (includes margin)
  const VISIBLE_SHARD_COUNT = 25; // Number of shards to render (visible + buffer)

  // Fetch shards on component mount
  useEffect(() => {
    if (isActive) {
      fetchShards();
    }
  }, [isActive]);

  const fetchShards = async () => {
    try {
      setShardsLoading(true);
      setError(null);
      const response = await fetch("/api/shards");
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setShards(data.shards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch shards");
    } finally {
      setShardsLoading(false);
    }
  };

  const fetchRecipesByShard = async (shardName: string) => {
    try {
      setLoading(true);
      setRecipes([]);
      setError(null);

      // Fetch ALL recipes at once (no pagination)
      const response = await fetch(
        `/api/shard-recipes?shard=${encodeURIComponent(shardName)}&limit=999999`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setRecipes(data.recipes);
      setPagination(data.pagination);
    } catch (err) {
      console.error(`Error fetching recipes for ${shardName}:`, err);
      setError(err instanceof Error ? err.message : "Failed to fetch recipes");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShardClick = (shardName: string) => {
    setSelectedShard(shardName);
    fetchRecipesByShard(shardName);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.floor(num));
  };

  // Parse ingredients similar to main tab
  const parseIngredients = (ingredientsString: string) => {
    try {
      const parsed = JSON.parse(ingredientsString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "text-gray-300";
      case "uncommon":
        return "text-green-400";
      case "rare":
        return "text-blue-400";
      case "epic":
        return "text-purple-400";
      case "legendary":
        return "text-yellow-400";
      case "mythic":
        return "text-pink-400";
      default:
        return "text-gray-300";
    }
  };

  // Filter shards based on search query
  const filteredShards = shards.filter(
    (shard) =>
      shard.name.toLowerCase().includes(shardSearchQuery.toLowerCase()) ||
      shard.family.toLowerCase().includes(shardSearchQuery.toLowerCase()) ||
      shard.rarity.toLowerCase().includes(shardSearchQuery.toLowerCase())
  );

  // Virtual scrolling calculations for shard list (using filtered shards)
  const shardStartIndex = Math.floor(shardScrollTop / SHARD_ITEM_HEIGHT);
  const shardEndIndex = Math.min(
    shardStartIndex + VISIBLE_SHARD_COUNT,
    filteredShards.length
  );
  const visibleShards = filteredShards.slice(shardStartIndex, shardEndIndex);

  // Calculate spacer heights for shards
  const shardTopSpacer = shardStartIndex * SHARD_ITEM_HEIGHT;
  const shardBottomSpacer =
    (filteredShards.length - shardEndIndex) * SHARD_ITEM_HEIGHT;

  // Handle shard list scroll
  const handleShardScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShardScrollTop(e.currentTarget.scrollTop);
  };

  // Handle shard search change
  const handleShardSearchChange = (query: string) => {
    setShardSearchQuery(query);
    setShardScrollTop(0); // Reset scroll position when search changes
  };

  if (!isActive) {
    return null;
  }

  if (shardsLoading) {
    return (
      <div className="text-center text-gray-300 p-8">Loading shards...</div>
    );
  }

  if (error && shards.length === 0) {
    return <div className="text-center text-red-400 p-8">Error: {error}</div>;
  }

  return (
    <div className="flex flex-1 bg-gray-800 rounded-lg overflow-hidden">
      {/* Shard List - 1/3 width */}
      <div
        className="w-1/3 border-r border-gray-700 h-full overflow-y-auto scrollbar-hide"
        onScroll={handleShardScroll}
      >
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">
            Shards ({filteredShards.length}
            {shardSearchQuery && ` of ${shards.length}`})
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search shards..."
              value={shardSearchQuery}
              onChange={(e) => handleShardSearchChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {shardSearchQuery && (
              <button
                onClick={() => handleShardSearchChange("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                title="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="p-2">
          {/* Top spacer for virtual scrolling */}
          {filteredShards.length > 0 && shardTopSpacer > 0 && (
            <div style={{ height: shardTopSpacer }} />
          )}

          {/* Visible shards only */}
          {filteredShards.length > 0 ? (
            <div className="space-y-1">
              {visibleShards.map((shard) => (
                <button
                  key={shard.name}
                  onClick={() => handleShardClick(shard.name)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selectedShard === shard.name
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300"
                  }`}
                  style={{ height: SHARD_ITEM_HEIGHT - 4 }} // Account for margin
                >
                  <div className="flex items-center gap-3 h-full">
                    <div className="flex-shrink-0">
                      <Image
                        src={`/shardIcons/${
                          shard.rarity?.charAt(0)?.toUpperCase() || "C"
                        }${shard.craftingID}.png`}
                        alt={shard.name}
                        width={32}
                        height={32}
                        className="rounded"
                        style={{ width: "32px", height: "32px" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm ${
                          selectedShard === shard.name
                            ? "text-white"
                            : getRarityColor(shard.rarity)
                        } truncate`}
                      >
                        {shard.name}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          selectedShard === shard.name
                            ? "text-blue-100"
                            : "text-gray-500"
                        } truncate`}
                      >
                        {shard.family} • {shard.rarity}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : shardSearchQuery ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-2xl mb-2">🔍</div>
              <p>No shards found matching "{shardSearchQuery}"</p>
              <button
                onClick={() => handleShardSearchChange("")}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Clear search
              </button>
            </div>
          ) : null}

          {/* Bottom spacer for virtual scrolling */}
          {filteredShards.length > 0 && shardBottomSpacer > 0 && (
            <div style={{ height: shardBottomSpacer }} />
          )}
        </div>
      </div>

      {/* Recipe Display - 2/3 width */}
      <div className="w-2/3 h-full overflow-y-auto scrollbar-hide">
        {!selectedShard ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">🧩</div>
              <p>Select a shard to view recipes that use it</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full text-gray-300">
            Loading recipes...
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <p>No recipes found that use {selectedShard}</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="border-b border-gray-700 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-100">
                Recipes using {selectedShard} ({recipes.length})
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Sorted by profit (highest first) • All recipes loaded
              </p>
            </div>

            {/* All recipes displayed */}
            <div className="grid grid-cols-5 gap-2">
              {recipes.map((recipe) => {
                const isProfitNegative = recipe.profit < 0;
                const ingredients = parseIngredients(recipe.ingredients);

                return (
                  <div
                    key={recipe.recipe_id}
                    className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0">
                        <Image
                          src={`/shardIcons/${recipe.id}.png`}
                          alt={recipe.id}
                          width={40}
                          height={40}
                          className="rounded"
                          style={{ width: "40px", height: "40px" }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200 mb-1">
                          {recipe.output_item}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            isProfitNegative ? "text-red-400" : "text-green-400"
                          } mb-1`}
                        >
                          {formatNumber(recipe.profit)} coins{" "}
                          <span className="text-gray-400">
                            ({formatNumber(recipe.cost)})
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          Demand: {formatNumber(recipe.demand)}
                        </p>
                      </div>
                    </div>
                    <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                      {ingredients.length > 0 ? (
                        ingredients.map((ingredient, index) => (
                          <li
                            key={`${ingredient.name}-${index}`}
                            className="truncate"
                          >
                            {ingredient.amount}x {ingredient.name} - Cost:{" "}
                            {formatNumber(ingredient.cost)} coins
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="truncate">
                            {recipe.quantity_1}x {recipe.ingredient_1}
                          </li>
                          <li className="truncate">
                            {recipe.quantity_2}x {recipe.ingredient_2}
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
