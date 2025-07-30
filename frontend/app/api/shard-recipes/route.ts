import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

export async function GET(request: Request) {
  try {
    // Get the shard name and pagination params from the URL parameters
    const { searchParams } = new URL(request.url);
    const shardName = searchParams.get("shard");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    if (!shardName) {
      return NextResponse.json(
        { error: "Shard name is required" },
        { status: 400 }
      );
    }

    // Open the database from the data directory
    const db = new Database(
      path.join(process.cwd(), "data", "shard_recipes.db")
    );

    // Check if cost column exists in shard_profit_data
    const tableInfo = db.prepare("PRAGMA table_info(shard_profit_data)").all();
    const hasCostColumn = tableInfo.some(
      (column: any) => column.name === "cost"
    );

    // Get the productID for this shard name
    const shardInfo = db
      .prepare("SELECT productID FROM shard_to_productid WHERE name = ?")
      .get(shardName);

    if (!shardInfo) {
      db.close();
      return NextResponse.json({ recipes: [], shardName });
    }

    const shardProductId = shardInfo.productID;

    // Step 1: Find recipes that use this specific shard as an ingredient
    const recipeQuery = `
      SELECT 
        quantity_1,
        ingredient_1,
        quantity_2,
        ingredient_2,
        output_quantity,
        output_item
      FROM shard_recipes_processed 
      WHERE ingredient_1 = ? OR ingredient_2 = ?
    `;

    const matchingRecipes = db
      .prepare(recipeQuery)
      .all(shardProductId, shardProductId);

    if (matchingRecipes.length === 0) {
      db.close();
      console.log(
        `No recipes found that use ${shardName} (${shardProductId}) as ingredient`
      );
      return NextResponse.json({ recipes: [], shardName });
    }

    // Step 2: Create a lookup map for productID to name conversion
    const allProductIds = [
      ...new Set([
        ...matchingRecipes.map((r) => r.output_item),
        ...matchingRecipes.map((r) => r.ingredient_1),
        ...matchingRecipes.map((r) => r.ingredient_2),
      ]),
    ];

    const productLookup = {};
    const lookupQuery = db.prepare(
      "SELECT productID, name FROM shard_to_productid WHERE productID = ?"
    );
    allProductIds.forEach((productId) => {
      const result = lookupQuery.get(productId);
      productLookup[productId] = result ? result.name : productId;
    });

    // Step 3: For each matching recipe, find its corresponding profit data
    // We need to match by ingredients to ensure we get the exact recipe that uses our shard
    const recipeMatches = [];

    for (const recipe of matchingRecipes) {
      const outputName = productLookup[recipe.output_item];
      if (!outputName) continue;

      // Find profit data entries for this output item
      const profitQuery = hasCostColumn
        ? `
        SELECT 
          recipe_id,
          output_item,
          demand,
          profit,
          cost,
          ingredients,
          id
        FROM shard_profit_data 
        WHERE output_item = ?
      `
        : `
        SELECT 
          recipe_id,
          output_item,
          demand,
          profit,
          0 as cost,
          ingredients,
          id
        FROM shard_profit_data 
        WHERE output_item = ?
      `;

      const potentialMatches = db.prepare(profitQuery).all(outputName);

      // Find the profit entry that matches this specific recipe's ingredients
      for (const profitEntry of potentialMatches) {
        try {
          const profitIngredients = JSON.parse(profitEntry.ingredients);

          // Check if this profit entry's ingredients match our recipe
          const matches = profitIngredients.some(
            (ing: any) =>
              (ing.name === productLookup[recipe.ingredient_1] &&
                ing.amount === recipe.quantity_1) ||
              (ing.name === productLookup[recipe.ingredient_2] &&
                ing.amount === recipe.quantity_2)
          );

          if (matches && profitIngredients.length === 2) {
            // Verify both ingredients match (in any order)
            const ing1Match = profitIngredients.some(
              (ing: any) =>
                ing.name === productLookup[recipe.ingredient_1] &&
                ing.amount === recipe.quantity_1
            );
            const ing2Match = profitIngredients.some(
              (ing: any) =>
                ing.name === productLookup[recipe.ingredient_2] &&
                ing.amount === recipe.quantity_2
            );

            if (ing1Match && ing2Match) {
              recipeMatches.push({
                ...profitEntry,
                quantity_1: recipe.quantity_1,
                ingredient_1: productLookup[recipe.ingredient_1],
                quantity_2: recipe.quantity_2,
                ingredient_2: productLookup[recipe.ingredient_2],
                output_quantity: recipe.output_quantity,
              });
              break; // Found the match, move to next recipe
            }
          }
        } catch (e) {
          // Skip entries with invalid JSON
          continue;
        }
      }
    }

    // Sort by profit and apply pagination
    recipeMatches.sort((a, b) => b.profit - a.profit);
    const totalRecipes = recipeMatches.length;
    const recipes = recipeMatches.slice(offset, offset + limit);

    // Close the database connection
    db.close();

    console.log(
      `Shard ${shardName}: ${
        recipes.length
      }/${totalRecipes} recipes (page ${page}/${Math.ceil(
        totalRecipes / limit
      )})`
    );

    return NextResponse.json({
      recipes,
      shardName,
      pagination: {
        page,
        limit,
        total: totalRecipes,
        totalPages: Math.ceil(totalRecipes / limit),
        hasMore: page * limit < totalRecipes,
      },
    });
  } catch (error) {
    console.error("Error fetching shard recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch shard recipes" },
      { status: 500 }
    );
  }
}
