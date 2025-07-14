from math import floor
from sqlite3 import Connection, Cursor
from typing import Dict, List


def calculate_accurate_profit(db_connection: Connection, skip_empty_orders: bool = True) -> \
        Dict[str, Dict[str, str or float or List]]:
    """
    Function to calculate the profit for each recipe based on the bazaar data.

    :param db_connection: The connection to the SQLite database containing the shard recipes.
    :param skip_empty_orders: If True, it skips recipes with empty insta buy orders for ingredients.
    :return: Nested dictionary containing profit information for each recipe.
    """
    cursor: Cursor = db_connection.cursor()
    cursor.execute("""
                   SELECT quantity_1,
                          ingredient_1,
                          quantity_2,
                          ingredient_2,
                          output_quantity,
                          output_item
                   FROM shard_recipes_processed
                   """)
    recipes: List = cursor.fetchall()

    profit_data: Dict[str, Dict[str, str or float or List]] = {}

    cursor.execute("SELECT * FROM bazaar_info")
    bazaar_data: Dict[str, Dict[str, int or str or float]] = {row[0]: {
        'buyPrice': row[1],
        'sellPrice': row[2],
        'buyOrders': row[3],
        'sellOrders': row[4],
        'sellVolume': row[5],
        'rarity': row[6]
    } for row in cursor.fetchall()}

    for idx, recipe in enumerate(recipes):
        quantity_1, ingredient_1, quantity_2, ingredient_2, output_quantity, output_item = recipe

        if output_item not in bazaar_data:
            print(f"Output item {output_item} not found in bazaar data. Skipping this recipe.")
            continue

        product_info = bazaar_data[output_item]

        ingredient_1_info: Dict[str, int or str or float] = bazaar_data.get(ingredient_1, {})
        ingredient_2_info: Dict[str, int or str or float] = bazaar_data.get(ingredient_2, {})

        if skip_empty_orders and (ingredient_1_info.get('buyOrders') == 0 or ingredient_2_info.get('buyOrders') == 0):
            print(f"Skipping recipe {idx} for {output_item} due to empty buy orders for ingredients.")
            continue

        cost_ingredient_1: float = ingredient_1_info.get('buyPrice') * quantity_1
        cost_ingredient_2: float = ingredient_2_info.get('buyPrice') * quantity_2

        product_price: float = product_info.get('buyPrice')

        if product_info.get('rarity') in ['Legendary', 'Mythic']:
            profit: float = product_price - (cost_ingredient_1 + cost_ingredient_2)
        else:
            profit: float = (product_price * output_quantity) - (cost_ingredient_1 + cost_ingredient_2)

        profit_data[idx] = {
            'output_item': output_item,
            'demand': floor(product_info.get('sellVolume')),
            'profit': floor(profit),
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

    cursor.execute('''DROP TABLE IF EXISTS shard_profit_data''')

    # Store the profit data in the database
    cursor.execute('''
                   CREATE TABLE IF NOT EXISTS shard_profit_data
                   (
                       recipe_id   INTEGER PRIMARY KEY,
                       output_item TEXT,
                       demand      REAL,
                       profit      REAL,
                       ingredients TEXT
                   )
                   ''')

    # Fetch the data from shard_to_productid to use those product names instead of the ID's
    cursor.execute('''SELECT productID, name 
                      FROM shard_to_productid''')
    product_names: Dict[str, str] = {row[0]: row[1] for row in cursor.fetchall()}

    # Update the output_item in profit_data with the product names
    for idx, data in profit_data.items():
        if data['output_item'] in product_names:
            data['output_item'] = product_names[data['output_item']]
        else:
            print(f"Warning: Output item {data['output_item']} not found in product names mapping.")

        for ingredient in data['ingredients']:
            if ingredient['name'] in product_names:
                ingredient['name'] = product_names[ingredient['name']]
            else:
                print(f"Warning: Ingredient {ingredient['name']} not found in product names mapping.")

    cursor.executemany('''
                       INSERT INTO shard_profit_data (recipe_id, output_item, demand, profit, ingredients)
                       VALUES (?, ?, ?, ?, ?)
                       ''', [
                           (
                               idx,
                               data['output_item'],
                               data['demand'],
                               data['profit'],
                               str(data['ingredients'])  # Convert list of dicts to string for storage
                           )
                           for idx, data in profit_data.items()
                       ])
    db_connection.commit()

    return profit_data


def sort_resulting_data(data: Dict[str, Dict[str, str or float or List]], weights: List[float] = None) -> \
        Dict[str, Dict[str, str or float or List]]:
    """
    Sort the resulting data by profit in descending order.

    :param data: The data to be sorted.
    :param weights: Weights for sorting criteria (first one for the weight profit and then for the buy order values).
    :return: Sorted data.
    """

    if weights is None:
        weights = [1.0, 0.0]

    return dict(sorted(data.items(), key=lambda item: (
            item[1]['profit'] * weights[0] + item[1]['demand'] * weights[1]), reverse=True))
