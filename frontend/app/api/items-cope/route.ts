import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET() {
  try {
    // Open the database from the data directory
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Get regular items first
    const items = db
      .prepare(
        `
      SELECT 
        recipe_id,
        output_item,
        demand,
        profit,
        ingredients,
        id
      FROM shard_profit_data
      ORDER BY profit DESC
    `
      )
      .all();

    // Get product family data for COPE calculations
    const productRows = db
      .prepare(
        `
      SELECT productID, family
      FROM shard_to_productid
    `
      )
      .all();

    const familyData = productRows.reduce((acc: any, row) => {
      acc[row.productID] = row.family;
      return acc;
    }, {});

    // Get recipes to check ingredients
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
      .all();

    // Apply COPE adjustments to items
    const copeItems = items.map((item, index) => {
      const recipe = recipes[index];
      if (!recipe) return item;

      // Check if any ingredient is reptile
      const ingredient1IsReptile =
        familyData[recipe.ingredient_1] === "Reptile";
      const ingredient2IsReptile =
        familyData[recipe.ingredient_2] === "Reptile";

      if (ingredient1IsReptile || ingredient2IsReptile) {
        // Parse ingredients to keep original costs
        const ingredients = JSON.parse(item.ingredients);

        // Calculate original revenue and apply 20% bonus
        const totalCost = ingredients.reduce(
          (sum: number, ing: any) => sum + ing.cost,
          0
        );
        const originalRevenue = item.profit + totalCost;
        const bonusRevenue = Math.floor(originalRevenue * 1.2);
        const newProfit = bonusRevenue - totalCost;

        return {
          ...item,
          profit: newProfit,
          ingredients: item.ingredients, // Keep original ingredient costs
        };
      }

      return item;
    });

    // Group items by output_item, keeping all recipes
    const groupedItems = copeItems.reduce((acc: any, item) => {
      if (!acc[item.output_item]) {
        acc[item.output_item] = [];
      }
      acc[item.output_item].push(item);
      return acc;
    }, {});

    // Close the database connection
    db.close();

    return NextResponse.json({ items: groupedItems });
  } catch (error) {
    console.error("Error fetching COPE items:", error);
    return NextResponse.json(
      { error: "Failed to fetch COPE items" },
      { status: 500 }
    );
  }
}
