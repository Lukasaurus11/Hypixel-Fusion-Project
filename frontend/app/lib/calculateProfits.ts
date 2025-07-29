import {
  Recipe,
  ProfitData,
  ProductData,
  Ingredient,
  PriceSettings,
} from "./types";
import Database from "better-sqlite3";

export function calculateAccurateProfit(
  db: Database.Database,
  skipEmptyOrders: boolean = true,
  copeMode: boolean = false,
  priceSettings: PriceSettings = {
    ingredientPriceType: "buyPrice",
    outputPriceType: "buyPrice",
  }
): void {
  try {
    const recipes = db
      .prepare(
        `
      SELECT 
        quantity_1,
        ingredient_1,
        quantity_2,
        ingredient_2,
        output_quantity,
        output_item
      FROM shard_recipes_processed
    `
      )
      .all() as Recipe[];

    const profitData: { [key: number]: ProfitData } = {};

    // Get bazaar data
    const bazaarRows = db.prepare("SELECT * FROM bazaar_info").all();
    const bazaarData = bazaarRows.reduce((acc: any, row: any) => {
      acc[row.product_id] = {
        sellPrice: row.sell_price,
        sellVolume: row.sell_volume,
        sellOrders: row.sell_orders,
        buyOrders: row.buy_orders,
        buyPrice: row.buy_price,
      };
      return acc;
    }, {});

    // Get product mapping data for family checking
    const productRows = db
      .prepare(
        `
      SELECT productID, name, rarity, craftingID, family
      FROM shard_to_productid
    `
      )
      .all();

    const productData = productRows.reduce((acc: ProductData, row: any) => {
      acc[row.productID] = {
        name: row.name,
        rarity: row.rarity,
        craftingID: row.craftingID,
        family: row.family,
      };
      return acc;
    }, {});

    // Calculate profits for each recipe
    recipes.forEach((recipe, idx) => {
      const {
        quantity_1,
        ingredient_1,
        quantity_2,
        ingredient_2,
        output_quantity,
        output_item,
      } = recipe;

      if (!(bazaarData as any)[output_item]) {
        console.log(
          `Output item ${output_item} not found in bazaar data. Skipping this recipe.`
        );
        return;
      }

      const productInfo = (bazaarData as any)[output_item];
      const ingredient1Info = (bazaarData as any)[ingredient_1] || {};
      const ingredient2Info = (bazaarData as any)[ingredient_2] || {};

      if (
        skipEmptyOrders &&
        (ingredient1Info.buyOrders === 0 || ingredient2Info.buyOrders === 0)
      ) {
        return;
      }

      const costIngredient1 =
        ingredient1Info[priceSettings.ingredientPriceType] * quantity_1;
      const costIngredient2 =
        ingredient2Info[priceSettings.ingredientPriceType] * quantity_2;
      const productPrice = productInfo[priceSettings.outputPriceType];

      // Apply COPE mode bonus if enabled and reptile shards are present
      let revenue = productPrice * output_quantity;
      if (copeMode) {
        const ingredient1IsReptile =
          productData[ingredient_1]?.family === "Reptile";
        const ingredient2IsReptile =
          productData[ingredient_2]?.family === "Reptile";

        if (ingredient1IsReptile || ingredient2IsReptile) {
          // Multiply revenue by 1.2 because reptile shards have 20% chance to double output
          revenue = revenue * 1.2;
        }
      }

      const profit = revenue - (costIngredient1 + costIngredient2);
      const totalCost = costIngredient1 + costIngredient2;

      profitData[idx] = {
        output_item,
        demand: Math.floor(productInfo.sellVolume),
        profit: Math.floor(profit),
        cost: Math.floor(totalCost),
        ingredients: [
          {
            name: ingredient_1,
            amount: quantity_1,
            cost: Math.floor(costIngredient1),
          },
          {
            name: ingredient_2,
            amount: quantity_2,
            cost: Math.floor(costIngredient2),
          },
        ],
        product_price: Math.floor(productPrice),
        ID: "", // Will be set later
      };
    });

    // Drop and recreate profit data table
    db.prepare("DROP TABLE IF EXISTS shard_profit_data").run();
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS shard_profit_data (
        recipe_id INTEGER PRIMARY KEY,
        output_item TEXT,
        demand REAL,
        profit REAL,
        cost REAL,
        ingredients TEXT,
        id TEXT,
        current_price REAL
      )
    `
    ).run();

    // Product data is already loaded above for COPE calculations

    // Update names and IDs
    Object.entries(profitData).forEach(([idx, data]) => {
      const productInfo = productData[data.output_item];
      if (productInfo) {
        data.ID = `${productInfo.rarity[0].toUpperCase()}${
          productInfo.craftingID
        }`;
        data.output_item = productInfo.name;
      } else {
        console.log(
          `Warning: Output item ${data.output_item} not found in product names mapping.`
        );
      }

      data.ingredients.forEach((ingredient) => {
        if (productData[ingredient.name]) {
          ingredient.name = productData[ingredient.name].name;
        } else {
          console.log(
            `Warning: Ingredient ${ingredient.name} not found in product names mapping.`
          );
        }
      });
    });

    // Insert profit data
    const insertStmt = db.prepare(`
      INSERT INTO shard_profit_data (
        recipe_id, output_item, demand, profit, cost, ingredients, id, current_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Use a transaction for better performance
    const transaction = db.transaction(() => {
      Object.entries(profitData).forEach(([idx, data]) => {
        insertStmt.run(
          idx,
          data.output_item,
          data.demand,
          data.profit,
          data.cost,
          JSON.stringify(data.ingredients),
          data.ID,
          data.product_price
        );
      });
    });

    // Execute the transaction
    transaction();
  } catch (error) {
    console.error("Error in calculateAccurateProfit:", error);
    throw error;
  }
}
