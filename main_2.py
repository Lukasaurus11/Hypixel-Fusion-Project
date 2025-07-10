import json
import sqlite3


def calculate_accurate_profit(db_connection, bazaar_data):
    # Load the recipe data from the database
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
                },
                {
                    'name': ingredient_2,
                }
            ]
        }

    return profit_data


with open('bazaar.json', 'r') as file:
    data = json.load(file)

data_to_save = calculate_accurate_profit(sqlite3.connect('shard_recipes_2.db'), data)
data_to_save = dict(sorted(data_to_save.items(), key=lambda item: item[1]['profit'], reverse=True))

# Round all the floats to 2 decimal places
for key, value in data_to_save.items():
    value['profit'] = round(value['profit'], 2)

with open('shard_profits_2.json', 'w') as f:
    json.dump(data_to_save, f, indent=4)
