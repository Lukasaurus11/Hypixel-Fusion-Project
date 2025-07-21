import { Recipe, ProfitData, ProductData, Ingredient } from "./types";
import Database from "better-sqlite3";

export function calculateAccurateProfit(
  db: Database.Database,
  skipEmptyOrders: boolean = true
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
    const bazaarData = bazaarRows.reduce((acc: any, row) => {
      acc[row.product_id] = {
        sellPrice: row.sell_price,
        sellVolume: row.sell_volume,
        sellOrders: row.sell_orders,
        buyOrders: row.buy_orders,
        buyPrice: row.buy_price,
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

      if (!bazaarData[output_item]) {
        console.log(
          `Output item ${output_item} not found in bazaar data. Skipping this recipe.`
        );
        return;
      }

      const productInfo = bazaarData[output_item];
      const ingredient1Info = bazaarData[ingredient_1] || {};
      const ingredient2Info = bazaarData[ingredient_2] || {};

      if (
        skipEmptyOrders &&
        (ingredient1Info.buyOrders === 0 || ingredient2Info.buyOrders === 0)
      ) {
        console.log(
          `Skipping recipe ${idx} for ${output_item} due to empty buy orders for ingredients.`
        );
        return;
      }

      const costIngredient1 = ingredient1Info.buyPrice * quantity_1;
      const costIngredient2 = ingredient2Info.buyPrice * quantity_2;
      const productPrice = productInfo.buyPrice;
      const profit =
        productPrice * output_quantity - (costIngredient1 + costIngredient2);

      profitData[idx] = {
        output_item,
        demand: Math.floor(productInfo.sellVolume),
        profit: Math.floor(profit),
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
        ingredients TEXT,
        id TEXT,
        current_price REAL
      )
    `
    ).run();

    // Get product mapping data
    const productRows = db
      .prepare(
        `
      SELECT productID, name, rarity, craftingID
      FROM shard_to_productid
    `
      )
      .all();

    const productData = productRows.reduce((acc: ProductData, row) => {
      acc[row.productID] = {
        name: row.name,
        rarity: row.rarity,
        craftingID: row.craftingID,
      };
      return acc;
    }, {});

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
        recipe_id, output_item, demand, profit, ingredients, id, current_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Use a transaction for better performance
    const transaction = db.transaction(() => {
      Object.entries(profitData).forEach(([idx, data]) => {
        insertStmt.run(
          idx,
          data.output_item,
          data.demand,
          data.profit,
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
