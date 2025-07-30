export interface BazaarProduct {
  productId: string;
  sellPrice: number;
  sellVolume: number;
  sellMovingWeek: number;
  sellOrders: number;
  buyPrice: number;
  buyVolume: number;
  buyMovingWeek: number;
  buyOrders: number;
}

export interface BazaarData {
  [key: string]: BazaarProduct;
}

export interface Recipe {
  quantity_1: number;
  ingredient_1: string;
  quantity_2: number;
  ingredient_2: string;
  output_quantity: number;
  output_item: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  cost: number;
}

export interface ProfitData {
  output_item: string;
  demand: number;
  profit: number;
  cost: number;
  ingredients: Ingredient[];
  product_price: number;
  ID: string;
}

export interface PriceSettings {
  ingredientPriceType: "buyPrice" | "sellPrice";
  outputPriceType: "buyPrice" | "sellPrice";
}

export interface ProductInfo {
  name: string;
  rarity: string;
  craftingID: string;
  family: string;
}

export interface ProductData {
  [key: string]: ProductInfo;
}

export interface PriceHistoryStatus {
  isRunning: boolean;
  progress: number;
  total: number;
  lastUpdate: string | null;
  error: string | null;
}

export interface PriceHistoryEntry {
  buy: number;
  sell: number;
  timestamp: string;
}

export interface Shard {
  name: string;
  productID: string;
  rarity: string;
  family: string;
  craftingID: string;
}

export interface ShardRecipe {
  recipe_id: number;
  output_item: string;
  demand: number;
  profit: number;
  cost: number;
  ingredients: string;
  id: string;
  quantity_1: number;
  ingredient_1: string;
  quantity_2: number;
  ingredient_2: string;
  output_quantity: number;
}
