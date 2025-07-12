from typing import Dict


def calculate_accurate_profit(db_connection, bazaar_data) -> Dict[str, Dict[str, str or float or list]]:
    """
    Function to calculate the profit for each recipe based on the bazaar data.

    :param db_connection: The connection to the SQLite database containing the shard recipes.
    :param bazaar_data: The bazaar data contains item prices and other relevant information.
    :return: Nested dictionary containing profit information for each recipe.
    """
    cursor = db_connection.cursor()
    cursor.execute(
        "SELECT quantity_1, ingredient_1, quantity_2, ingredient_2, output_quantity, output_item FROM shard_recipes_processed")
    recipes = cursor.fetchall()

    profit_data = {}

    for idx, recipe in enumerate(recipes):
        quantity_1, ingredient_1, quantity_2, ingredient_2, output_quantity, output_item = recipe

        if output_item not in bazaar_data:
            print(f"Output item {output_item} not found in bazaar data. Skipping this recipe.")
            continue

        product_info = bazaar_data[output_item]

        ingredient_1_info = bazaar_data.get(ingredient_1, {})
        ingredient_2_info = bazaar_data.get(ingredient_2, {})

        cost_ingredient_1 = ingredient_1_info.get('buyPrice') * quantity_1
        cost_ingredient_2 = ingredient_2_info.get('buyPrice') * quantity_2

        product_price = product_info.get('buyPrice')

        # Check to see if any price is missing
        if product_price is None or cost_ingredient_1 is None or cost_ingredient_2 is None:
            print(f"Missing price data for {output_item}, {ingredient_1}, or {ingredient_2}. Skipping this recipe.")
            continue

        if product_info.get('rarity') in ['Legendary', 'Mythic']:
            profit = product_price - (cost_ingredient_1 + cost_ingredient_2)
        else:
            profit = (product_price * output_quantity) - (cost_ingredient_1 + cost_ingredient_2)

        profit_data[idx] = {
            'output_item': output_item,
            'profit': profit,
            'ingredients': [
                {
                    'name': ingredient_1,
                    'amount': quantity_1,
                },
                {
                    'name': ingredient_2,
                    'amount': quantity_2,
                }
            ]
        }

    return profit_data
