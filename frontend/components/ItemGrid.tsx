import { Item } from "@/types/items";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

type SortOption = "profit" | "demand" | "custom";

interface CustomWeights {
  profit: number;
  demand: number;
}

interface ToolbarProps {
  onSortChange: (option: SortOption) => void;
  onCustomWeightsChange: (weights: CustomWeights) => void;
  onSearchChange: (search: string) => void;
  currentSort: SortOption;
  showCustomModal: boolean;
  setShowCustomModal: (show: boolean) => void;
  copeMode: boolean;
  onCopeToggle: (enabled: boolean) => void;
}

const Toolbar = ({
  onSortChange,
  onCustomWeightsChange,
  onSearchChange,
  currentSort,
  showCustomModal,
  setShowCustomModal,
  copeMode,
  onCopeToggle,
}: ToolbarProps) => {
  const [profitWeight, setProfitWeight] = useState<string>("1");
  const [demandWeight, setDemandWeight] = useState<string>("1");

  // Add effect to prevent background scroll when custom modal is open
  useEffect(() => {
    const hasScrollbar =
      document.documentElement.scrollHeight > window.innerHeight;
    if (showCustomModal) {
      document.body.classList.add("modal-open");
      if (hasScrollbar) {
        document.body.style.paddingRight = "17px";
      }
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.paddingRight = "0";
    }
  }, [showCustomModal]);

  // Set initial weights based on current sort when modal opens
  const setInitialWeights = (sortType: SortOption) => {
    switch (sortType) {
      case "profit":
        setProfitWeight("1");
        setDemandWeight("0");
        break;
      case "demand":
        setProfitWeight("0");
        setDemandWeight("1");
        break;
      case "custom":
        // Keep current values
        break;
    }
  };

  const handleInputChange = (
    value: string,
    setter: (value: string) => void
  ) => {
    // Allow empty string, decimal point, and numbers
    if (value === "" || value === "." || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const handleSortChange = (value: SortOption) => {
    if (value === "custom") {
      setInitialWeights(currentSort);
      setShowCustomModal(true);
    }
    onSortChange(value);
  };

  const handleCustomSubmit = () => {
    // Convert empty strings to "0"
    const finalProfitWeight =
      profitWeight.trim() === "" || isNaN(Number(profitWeight))
        ? "0"
        : profitWeight;
    const finalDemandWeight =
      demandWeight.trim() === "" || isNaN(Number(demandWeight))
        ? "0"
        : demandWeight;

    // If both are empty/0, set profit to 1 and demand to 0
    if (Number(finalProfitWeight) === 0 && Number(finalDemandWeight) === 0) {
      onCustomWeightsChange({ profit: 1, demand: 0 });
    } else {
      onCustomWeightsChange({
        profit: Number(finalProfitWeight),
        demand: Number(finalDemandWeight),
      });
    }
    setShowCustomModal(false);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center bg-gray-900 p-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 bg-gray-800 text-gray-200 rounded-md border border-gray-700 hover:bg-gray-700 transition-colors">
            Shard Profits
          </button>
          <button
            className="h-9 px-4 text-gray-400 rounded-md hover:bg-gray-800 transition-colors"
            disabled
          >
            Coming soon...
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopeToggle(!copeMode)}
              className="relative bg-gray-700 rounded-full p-0.5 border border-gray-600 w-32 h-9 hover:bg-gray-600 transition-colors"
            >
              {/* Sliding indicator */}
              <div
                className={`absolute top-0.5 left-0.5 w-[60px] h-8 bg-emerald-400 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                  copeMode ? "translate-x-[62px]" : "translate-x-0"
                }`}
              />

              {/* Text labels */}
              <div className="relative flex h-full text-sm font-medium">
                <div className="w-[62px] flex items-center justify-center relative z-10">
                  <span
                    className={`transition-colors duration-200 ${
                      !copeMode ? "text-black" : "text-gray-300"
                    }`}
                  >
                    Boring
                  </span>
                </div>
                <div className="w-[62px] flex items-center justify-center relative z-10">
                  <span
                    className={`transition-colors duration-200 ${
                      copeMode ? "text-black" : "text-gray-300"
                    }`}
                  >
                    Cope
                  </span>
                </div>
              </div>
            </button>
            <span className="text-gray-400">Sort by:</span>
            <select
              className="h-9 px-3 bg-gray-700 text-gray-200 rounded-md border border-gray-600 focus:outline-none focus:border-gray-500"
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
            >
              <option value="profit">Profit</option>
              <option value="demand">Demand</option>
              <option value="custom">Custom</option>
            </select>
            {currentSort === "custom" && (
              <button
                onClick={() => {
                  setInitialWeights(currentSort);
                  setShowCustomModal(true);
                }}
                className="h-9 px-4 bg-gray-700 text-gray-200 rounded-md border border-gray-600 hover:bg-gray-600"
              >
                Edit Weights
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search items..."
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-9 pr-3 bg-gray-700 text-gray-200 rounded-md border border-gray-600 focus:outline-none focus:border-gray-500 w-64"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">
              Custom Weights
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">
                  Profit Weight
                </label>
                <input
                  type="text"
                  value={profitWeight}
                  onChange={(e) =>
                    handleInputChange(e.target.value, setProfitWeight)
                  }
                  onBlur={() => {
                    if (
                      profitWeight.trim() === "" &&
                      demandWeight.trim() === ""
                    ) {
                      setProfitWeight("1");
                      setDemandWeight("0");
                    }
                  }}
                  className="w-full h-9 px-3 bg-gray-700 text-gray-200 rounded-md border border-gray-600"
                  placeholder="Enter a number"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">
                  Demand Weight
                </label>
                <input
                  type="text"
                  value={demandWeight}
                  onChange={(e) =>
                    handleInputChange(e.target.value, setDemandWeight)
                  }
                  onBlur={() => {
                    if (
                      profitWeight.trim() === "" &&
                      demandWeight.trim() === ""
                    ) {
                      setProfitWeight("1");
                      setDemandWeight("0");
                    }
                  }}
                  className="w-full h-9 px-3 bg-gray-700 text-gray-200 rounded-md border border-gray-600"
                  placeholder="Enter a number"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setInitialWeights(currentSort);
                    setShowCustomModal(false);
                    if (currentSort === "custom") {
                      onSortChange("profit");
                    }
                  }}
                  className="h-9 px-4 text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomSubmit}
                  className="h-9 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RecipeModalProps {
  recipes: Item[];
  onClose: () => void;
}

interface Ingredient {
  name: string;
  amount: number;
  cost: number;
}

const parseIngredients = (ingredientsStr: string): Ingredient[] => {
  try {
    const jsonStr = ingredientsStr
      .replace(/'/g, '"')
      .replace(/\[{/g, "[{")
      .replace(/}]/g, "}]");

    const ingredients = JSON.parse(jsonStr);
    return Array.isArray(ingredients) ? ingredients : [];
  } catch (e) {
    console.error("Failed to parse ingredients:", e);
    return [];
  }
};

interface PriceHistoryChartProps {
  productName: string;
}

const PriceHistoryChart = ({ productName }: PriceHistoryChartProps) => {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [averagePrice, setAveragePrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<{
    isRunning: boolean;
    progress: number;
    total: number;
    message: string | null;
  } | null>(null);

  // Check task status periodically when loading
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkTaskStatus = async () => {
      try {
        const response = await fetch("/api/price-history-status");
        const status = await response.json();
        setTaskStatus(status);

        // If task is not running and we're still loading, try to fetch the data
        if (!status.isRunning && isLoading) {
          fetchPriceHistory();
        }
      } catch (error) {
        console.error("Error checking task status:", error);
      }
    };

    if (isLoading) {
      // Check immediately
      checkTaskStatus();
      // Then check every 2 seconds
      intervalId = setInterval(checkTaskStatus, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, productName]);

  const fetchPriceHistory = async () => {
    try {
      setError(null);

      const response = await fetch(
        `/api/price-history?productName=${encodeURIComponent(productName)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { priceHistory, currentPrice, averagePrice } =
        await response.json();
      setPriceData(priceHistory || []);
      setCurrentPrice(currentPrice);
      setAveragePrice(averagePrice);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching price history:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load price history"
      );
      setIsLoading(false);
    }
  };

  if (isLoading && !taskStatus?.isRunning) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-gray-400">Loading price history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  const chartData = {
    datasets: [
      {
        label: "Sell Offer Price",
        data: priceData.map((point) => ({
          x: new Date(point.timestamp),
          y: point.buy_price,
        })),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        pointRadius: 1,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "hour" as const,
          displayFormats: {
            hour: "MMM d, HH:mm",
          },
        },
        title: {
          display: true,
          text: "Time",
          color: "rgb(156, 163, 175)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
        grid: {
          color: "rgb(55, 65, 81)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Price (coins)",
          color: "rgb(156, 163, 175)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
          callback: (value: number) => value.toLocaleString(),
        },
        grid: {
          color: "rgb(55, 65, 81)",
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgb(156, 163, 175)",
        },
      },
      title: {
        display: true,
        text: "Price over the last week",
        color: "rgb(229, 231, 235)",
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw.y;
            return `Price: ${value.toLocaleString()} coins`;
          },
        },
      },
    },
  };

  // Calculate if price is manipulated (>30% difference from 24h average)
  const isManipulated =
    currentPrice && averagePrice
      ? (currentPrice - averagePrice) / averagePrice > 0.3
      : false;

  return (
    <div className="space-y-4">
      <div className="h-[300px] w-full">
        <Line data={chartData} options={options} />
      </div>
      <div className="space-y-2">
        {currentPrice !== null && priceData.length > 0 && (
          <div className="text-center text-sm text-gray-300">
            {currentPrice !== null && (
              <>
                Current Price: {currentPrice.toLocaleString()} coins
                <br />
              </>
            )}
            {averagePrice !== null && (
              <>24h Average Price: {averagePrice.toLocaleString()} coins</>
            )}
          </div>
        )}
        {taskStatus?.isRunning && (
          <div className="text-center text-sm text-blue-400">
            {taskStatus.message ||
              `Updating price data: ${taskStatus.progress}/${taskStatus.total}`}
          </div>
        )}
        {currentPrice !== null && priceData.length > 0 && (
          <div
            className={`text-center text-sm font-medium ${
              isManipulated ? "text-red-400" : "text-green-400"
            }`}
          >
            {isManipulated
              ? "The product might be manipulated"
              : "The product seems normally priced"}
          </div>
        )}
      </div>
    </div>
  );
};

const RecipeModal = ({ recipes, onClose }: RecipeModalProps) => {
  const sortedRecipes = [...recipes].sort((a, b) => b.profit - a.profit);

  useEffect(() => {
    const hasScrollbar =
      document.documentElement.scrollHeight > window.innerHeight;
    document.body.classList.add("modal-open");
    if (hasScrollbar) {
      document.body.style.paddingRight = "17px";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.paddingRight = "0";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 z-50 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[80vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 z-10">
          <h2 className="text-xl font-semibold text-gray-200 text-center px-8 flex items-center justify-center gap-3">
            <Image
              src={`/shardIcons/${recipes[0].id}.png`}
              alt={recipes[0].id}
              width={32}
              height={32}
              className="rounded"
              style={{ width: "32px", height: "32px" }}
            />
            All Recipes for {recipes[0].output_item}
          </h2>
        </div>
        <div className="flex">
          <div className="w-1/2 border-r border-gray-700">
            <div className="p-6 space-y-4 overflow-y-auto h-[420px] scrollbar-hide">
              {sortedRecipes.map((recipe) => {
                const ingredients = parseIngredients(recipe.ingredients);
                return (
                  <div
                    key={recipe.recipe_id}
                    className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors h-[120px]"
                  >
                    <div className="flex items-center gap-2 mb-1">
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
                        <p className="text-sm font-medium text-gray-200 mb-0.5">
                          {recipe.output_item}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            recipe.profit < 0
                              ? "text-red-400"
                              : "text-green-400"
                          } mb-0.5`}
                        >
                          Profit: {recipe.profit.toLocaleString()} coins
                        </p>
                        <p className="text-xs text-gray-400">
                          Demand: {recipe.demand.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="overflow-y-auto scrollbar-hide h-[40px]">
                      <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                        {ingredients.map((ingredient, index) => (
                          <li
                            key={`${ingredient.name}-${index}`}
                            className="truncate"
                          >
                            {ingredient.amount}x {ingredient.name} - Cost:{" "}
                            {ingredient.cost.toLocaleString()} coins
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="w-1/2 p-6 h-[420px]">
            <PriceHistoryChart productName={recipes[0].output_item} />
          </div>
        </div>
        <div className="sticky bottom-0 bg-gray-800 h-6 border-t border-gray-700"></div>
      </div>
    </div>
  );
};

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

const ItemCard = ({ item, onClick }: ItemCardProps) => {
  const isProfitNegative = item.profit < 0;
  const ingredients = parseIngredients(item.ingredients);

  return (
    <div
      className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-shrink-0">
          <Image
            src={`/shardIcons/${item.id}.png`}
            alt={item.id}
            width={40}
            height={40}
            className="rounded"
            style={{ width: "40px", height: "40px" }}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200 mb-1">
            {item.output_item}
          </p>
          <p
            className={`text-sm font-medium ${
              isProfitNegative ? "text-red-400" : "text-green-400"
            } mb-1`}
          >
            {item.profit.toLocaleString()} coins
          </p>
          <p className="text-xs text-gray-400">
            Demand: {item.demand.toLocaleString()}
          </p>
        </div>
      </div>
      <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
        {ingredients.map((ingredient, index) => (
          <li key={`${ingredient.name}-${index}`} className="truncate">
            {ingredient.amount}x {ingredient.name} - Cost:{" "}
            {ingredient.cost.toLocaleString()} coins
          </li>
        ))}
      </ul>
    </div>
  );
};

interface ItemGridProps {
  items: Item[];
}

export default function ItemGrid({ items }: ItemGridProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("profit");
  const [customWeights, setCustomWeights] = useState<CustomWeights>({
    profit: 1,
    demand: 1,
  });
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copeMode, setCopeMode] = useState(false);
  const [copeItems, setCopeItems] = useState<Item[]>([]);
  const [loadingCope, setLoadingCope] = useState(false);

  // Fetch COPE-adjusted items when COPE mode is toggled
  useEffect(() => {
    const fetchCopeItems = async () => {
      if (copeMode) {
        setLoadingCope(true);
        try {
          const response = await fetch("/api/items-cope");
          const data = await response.json();
          if (data.error) {
            console.error("Error fetching COPE items:", data.error);
            return;
          }
          // Convert grouped items to flat array
          const flatItems = Object.values(data.items).flat() as Item[];
          setCopeItems(flatItems);
        } catch (error) {
          console.error("Error fetching COPE items:", error);
        } finally {
          setLoadingCope(false);
        }
      }
    };

    fetchCopeItems();
  }, [copeMode]);

  // Use COPE items if COPE mode is enabled, otherwise use regular items
  const currentItems = copeMode ? copeItems : items;

  // Group items by output_item
  const itemsByOutput = currentItems.reduce(
    (acc: { [key: string]: Item[] }, item) => {
      if (!acc[item.output_item]) {
        acc[item.output_item] = [];
      }
      acc[item.output_item].push(item);
      return acc;
    },
    {}
  );

  // Get the most profitable recipe for each output_item
  const bestRecipes = Object.values(itemsByOutput).map((recipes) =>
    recipes.reduce((best, current) =>
      current.profit > best.profit ? current : best
    )
  );

  // Filter and sort recipes
  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = [...bestRecipes];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.output_item.toLowerCase().includes(query) ||
          parseIngredients(item.ingredients).some((ing) =>
            ing.name.toLowerCase().includes(query)
          )
      );
    }

    // Sort based on selected option
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "profit":
          return b.profit - a.profit;
        case "demand":
          return b.demand - a.demand;
        case "custom":
          const scoreA =
            a.profit * customWeights.profit + a.demand * customWeights.demand;
          const scoreB =
            b.profit * customWeights.profit + b.demand * customWeights.demand;
          return scoreB - scoreA;
        default:
          return b.profit - a.profit;
      }
    });
  }, [bestRecipes, searchQuery, sortOption, customWeights]);

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  return (
    <>
      <Toolbar
        onSortChange={handleSortChange}
        onCustomWeightsChange={setCustomWeights}
        onSearchChange={setSearchQuery}
        currentSort={sortOption}
        showCustomModal={showCustomModal}
        setShowCustomModal={setShowCustomModal}
        copeMode={copeMode}
        onCopeToggle={setCopeMode}
      />
      {loadingCope && (
        <div className="text-center text-gray-300 mb-4">
          Loading COPE calculations...
        </div>
      )}
      <div className="grid grid-cols-5 gap-2">
        {filteredAndSortedRecipes.map((item) => (
          <ItemCard
            key={item.recipe_id}
            item={item}
            onClick={() => setSelectedItem(item.output_item)}
          />
        ))}
      </div>

      {selectedItem && itemsByOutput[selectedItem] && (
        <RecipeModal
          recipes={itemsByOutput[selectedItem]}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
