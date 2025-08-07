"use client";

import React, { useEffect, useState, useRef } from "react";
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
  const [selectedOutputFilter, setSelectedOutputFilter] = useState<
    string | null
  >(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Ref for the dropdown to handle click outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling constants for shard list
  const SHARD_ITEM_HEIGHT = 72; // Height of each shard card (includes margin)
  const VISIBLE_SHARD_COUNT = 25; // Number of shards to render (visible + buffer)

  // Fetch shards on component mount
  useEffect(() => {
    if (isActive) {
      fetchShards();
    }
  }, [isActive]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

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
    setSelectedOutputFilter(null); // Reset filter when selecting a new shard
    setIsFilterDropdownOpen(false); // Close dropdown if open
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

  // Get unique output items from recipes for filtering
  const getUniqueOutputItems = () => {
    const uniqueItems = Array.from(
      new Set(recipes.map((recipe) => recipe.output_item.trim()))
    ).sort((a, b) => a.localeCompare(b));
    return uniqueItems;
  };

  // Filter recipes based on selected output filter
  const filteredRecipes = React.useMemo(() => {
    console.log(
      `🔄 FILTERING: Filter="${selectedOutputFilter}", Recipe count=${recipes.length}`
    );

    if (!selectedOutputFilter) {
      console.log(`✅ No filter - returning all ${recipes.length} recipes`);
      return recipes;
    }

    const filtered = recipes.filter((recipe) => {
      const recipeOutput = recipe.output_item.trim();
      const filterValue = selectedOutputFilter.trim();
      const matches = recipeOutput === filterValue;

      // Log every comparison for debugging
      console.log(
        `🔍 Recipe ${recipe.recipe_id}: "${recipeOutput}" === "${filterValue}" ? ${matches}`
      );

      return matches;
    });

    console.log(
      `✅ Filtered to ${filtered.length} recipes from ${recipes.length} total`
    );
    return filtered;
  }, [recipes, selectedOutputFilter]);

  // Handle output filter selection
  const handleOutputFilterChange = (outputItem: string | null) => {
    setSelectedOutputFilter(outputItem);
    setIsFilterDropdownOpen(false);

    // Debug logging to help identify filtering issues
    if (outputItem) {
      console.log(`\n=== FILTER DEBUG ===`);
      console.log(`Filter set to: "${outputItem}"`);
      console.log(`Filter length: ${outputItem.length}`);
      console.log(`Filter trimmed: "${outputItem.trim()}"`);
      console.log(`Filter trimmed length: ${outputItem.trim().length}`);

      recipes.forEach((recipe, index) => {
        const trimmedOutput = recipe.output_item.trim();
        const trimmedFilter = outputItem.trim();
        const matches = trimmedOutput === trimmedFilter;
        console.log(
          `Recipe ${index}: "${recipe.output_item}" (len: ${recipe.output_item.length}) -> "${trimmedOutput}" (len: ${trimmedOutput.length}) -> Matches: ${matches}`
        );
      });

      const matchingRecipes = recipes.filter(
        (recipe) => recipe.output_item.trim() === outputItem.trim()
      );
      console.log(`Total matching recipes: ${matchingRecipes.length}`);
      console.log("===================\n");
    }
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    Recipes using {selectedShard} ({filteredRecipes.length}
                    {filteredRecipes.length !== recipes.length &&
                      ` of ${recipes.length}`}
                    )
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Sorted by profit (highest first) • All recipes loaded
                    {selectedOutputFilter && (
                      <span className="ml-2">
                        • Filtered by: {selectedOutputFilter}
                      </span>
                    )}
                  </p>
                </div>

                {/* Output Filter Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() =>
                      setIsFilterDropdownOpen(!isFilterDropdownOpen)
                    }
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-sm">
                      {selectedOutputFilter
                        ? selectedOutputFilter
                        : "All Shards"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isFilterDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isFilterDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => handleOutputFilterChange(null)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                          !selectedOutputFilter
                            ? "bg-blue-600 text-white"
                            : "text-gray-200"
                        }`}
                      >
                        All Shards ({recipes.length})
                      </button>
                      {getUniqueOutputItems().map((outputItem) => {
                        const count = recipes.filter(
                          (recipe) =>
                            recipe.output_item.trim() === outputItem.trim()
                        ).length;
                        return (
                          <button
                            key={outputItem}
                            onClick={() => handleOutputFilterChange(outputItem)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                              selectedOutputFilter?.trim() === outputItem.trim()
                                ? "bg-blue-600 text-white"
                                : "text-gray-200"
                            }`}
                          >
                            {outputItem} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* All recipes displayed - One per row */}
            <div className="space-y-3">
              {/* Debug info */}
              <div className="p-2 bg-red-900 border border-red-600 rounded text-xs text-red-200 mb-3">
                <strong>LIVE DEBUG:</strong>
                <br />
                Filter: "{selectedOutputFilter || "NONE"}" | Total Recipes:{" "}
                {recipes.length} | Filtered Recipes: {filteredRecipes.length} |
                Should Show:{" "}
                {selectedOutputFilter
                  ? recipes.filter(
                      (r) =>
                        r.output_item.trim() === selectedOutputFilter.trim()
                    ).length
                  : recipes.length}
                <br />
                Recipes shown:{" "}
                {filteredRecipes
                  .map((r) => `${r.recipe_id}(${r.output_item.trim()})`)
                  .join(", ")
                  .substring(0, 200)}
                ...
              </div>

              {filteredRecipes.map((recipe) => {
                const isProfitNegative = recipe.profit < 0;
                const ingredients = parseIngredients(recipe.ingredients);

                return (
                  <div
                    key={`${recipe.recipe_id}-${selectedOutputFilter || "all"}`}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Shard Icon */}
                      <div className="flex-shrink-0">
                        <Image
                          src={`/shardIcons/${recipe.id}.png`}
                          alt={recipe.id}
                          width={48}
                          height={48}
                          className="rounded"
                          style={{ width: "48px", height: "48px" }}
                        />
                      </div>

                      {/* Recipe Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-medium text-gray-200 mb-1">
                              {recipe.output_item}
                              <div className="text-xs text-gray-500 mt-1">
                                Recipe ID: {recipe.recipe_id} | Output: "
                                {recipe.output_item.trim()}"
                                {selectedOutputFilter && (
                                  <span
                                    className={`ml-2 font-bold ${
                                      recipe.output_item.trim() ===
                                      selectedOutputFilter.trim()
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {recipe.output_item.trim() ===
                                    selectedOutputFilter.trim()
                                      ? "✅ SHOULD SHOW"
                                      : "❌ SHOULD NOT SHOW"}
                                  </span>
                                )}
                              </div>
                            </h4>
                            <div className="flex items-center gap-4">
                              <p
                                className={`text-base font-medium ${
                                  isProfitNegative
                                    ? "text-red-400"
                                    : "text-green-400"
                                }`}
                              >
                                {formatNumber(recipe.profit)} coins profit
                              </p>
                              <p className="text-sm text-gray-400">
                                Cost: {formatNumber(recipe.cost)} coins
                              </p>
                              <p className="text-sm text-gray-400">
                                Demand: {formatNumber(recipe.demand)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Ingredients */}
                        <div>
                          <p className="text-sm font-medium text-gray-300 mb-2">
                            Ingredients:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {ingredients.length > 0 ? (
                              ingredients.map((ingredient, index) => (
                                <div
                                  key={`${ingredient.name}-${index}`}
                                  className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs"
                                >
                                  <span className="text-gray-300">
                                    {ingredient.amount}x {ingredient.name}
                                  </span>
                                  <span className="text-gray-400">
                                    {formatNumber(ingredient.cost)} coins
                                  </span>
                                </div>
                              ))
                            ) : (
                              <>
                                <div className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs">
                                  <span className="text-gray-300">
                                    {recipe.quantity_1}x {recipe.ingredient_1}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs">
                                  <span className="text-gray-300">
                                    {recipe.quantity_2}x {recipe.ingredient_2}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
