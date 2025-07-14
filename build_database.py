from __future__ import annotations

from re import sub as re_sub
from sqlite3 import connect, Connection, Cursor
from typing import Dict, Tuple, List, Set

from polars import read_csv, DataFrame


def fetch_and_process_information(filename: str = 'Full Fusion List - Hypixel SkyBlock - List.csv') -> \
        List[Dict[str, int or str]]:
    """
    Uses Polars for efficient CSV parsing and transformation.
    Extracts fusion data from a CSV and returns normalized list of records.

    :param filename: The name of the CSV file containing the fusion list.
    :return: A list of dictionaries, each containing the quantities and names of ingredients and outputs.
    """

    def split_and_clean(value: str) -> Tuple[int, str]:
        """
        Function to split a string into quantity and name, cleaning up the name.

        :param value: The string to be split, expected to be in the format "x quantity name (optional description)".
        :return: A tuple containing the quantity as an integer and the cleaned name as a string.
        """
        if not value:
            return 0, ''
        parts: List[str] = value.split(' ', 1)
        quantity: int = int(parts[0].replace('x', '')) if parts[0].replace('x', '').isdigit() else 0
        name: str = re_sub(r'\s*\(.*\)', '', parts[1]) if len(parts) > 1 else ''
        return quantity, name.strip()

    df: DataFrame = read_csv(filename, skip_rows=1)

    seen_combinations: Set[Tuple[str, str, str]] = set()
    processed_rows: List[Dict[str, int or str]] = []

    for row in df.iter_rows(named=True):
        quantity_1, ingredient_1 = split_and_clean(row.get('Input #1', ''))
        quantity_2, ingredient_2 = split_and_clean(row.get('Input #2', ''))

        for i in range(1, 4):
            output_quantity, output_item = split_and_clean(row.get(f'Output #{i}', ''))
            if output_item:

                input_pair: Tuple[str, ...] = tuple(sorted([ingredient_1, ingredient_2]))
                fusion_key: Tuple[str, str, str] = (input_pair[0], input_pair[1], output_item)

                if fusion_key not in seen_combinations:
                    seen_combinations.add(fusion_key)
                    processed_rows.append({
                        'quantity_1': quantity_1,
                        'ingredient_1': ingredient_1,
                        'quantity_2': quantity_2,
                        'ingredient_2': ingredient_2,
                        'output_quantity': output_quantity,
                        'output_item': output_item
                    })

    return processed_rows


def store_data_in_database(processed_rows: List[Dict[str, int or str]], cleaned_shards_data: Dict[str, int or str]):
    """
    Function to store processed rows and cleaned shards data into an SQLite database.
    It will make three tables:
        - `shard_to_productid`: Maps shard names to their product IDs and other relevant information.
        - `shard_recipes`: Contains the recipes for shards.
        - `shard_recipes_processed`: Contains processed recipes with corrected names for easy bazaar lookups.

    :param processed_rows: The data coming from the CSV file which contains the fusion list information.
    :param cleaned_shards_data: A dictionary containing different information about shards
    :return: None
    """
    db_path: str = 'shard_recipes.db'

    conn: Connection = connect(db_path)
    cur: Cursor = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS shard_recipes")
    cur.execute("DROP TABLE IF EXISTS shard_to_productid")
    cur.execute("DROP TABLE IF EXISTS shard_recipes_processed")

    # Will be deprecated once I updated to using the correct JSON file.
    name_corrections: Dict[str, str] = {
        'Sea Serpant': 'Sea Serpent',
        'Star Centry': 'Star Sentry'
    }

    cur.execute('''
                CREATE TABLE shard_to_productid
                (
                    name       TEXT PRIMARY KEY,
                    productID  TEXT,
                    rarity     TEXT,
                    family     TEXT,
                    craftingID TEXT
                )
                ''')
    cur.executemany('''
                    INSERT INTO shard_to_productid
                        (name, productID, rarity, family, craftingID)
                    VALUES (?, ?, ?, ?, ?)
                    ''', [
                        (
                            name_corrections.get(name, name),
                            info.get('productID'),
                            info.get('rarity'),
                            info.get('family')[0] if info.get('family') else None,
                            info.get('id')
                        )
                        for name, info in cleaned_shards_data['shards'].items()
                    ])
    conn.commit()

    cur.execute('''
                CREATE TABLE shard_recipes
                (
                    quantity_1      INTEGER,
                    ingredient_1    TEXT,
                    quantity_2      INTEGER,
                    ingredient_2    TEXT,
                    output_quantity INTEGER,
                    output_item     TEXT
                )
                ''')
    cur.executemany('''
                    INSERT INTO shard_recipes
                    (quantity_1, ingredient_1, quantity_2, ingredient_2, output_quantity, output_item)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ''', [
                        (
                            row['quantity_1'],
                            row['ingredient_1'],
                            row['quantity_2'],
                            row['ingredient_2'],
                            row['output_quantity'],
                            row['output_item']
                        )
                        for row in processed_rows
                    ])
    conn.commit()

    cur.execute('''
                CREATE TABLE shard_recipes_processed
                (
                    quantity_1      INTEGER,
                    ingredient_1    TEXT,
                    quantity_2      INTEGER,
                    ingredient_2    TEXT,
                    output_quantity INTEGER,
                    output_item     TEXT
                )
                ''')

    name_id_map = {name_corrections.get(info['name'], info['name']): info['productID'] for info in
                   cleaned_shards_data['shards'].values()}

    cur.executemany('''
                    INSERT INTO shard_recipes_processed
                    (quantity_1, ingredient_1, quantity_2, ingredient_2, output_quantity, output_item)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ''', [
                        (
                            row['quantity_1'],
                            name_id_map.get(row['ingredient_1'], row['ingredient_1']),
                            row['quantity_2'],
                            name_id_map.get(row['ingredient_2'], row['ingredient_2']),
                            row['output_quantity'],
                            name_id_map.get(row['output_item'], row['output_item'])
                        )
                        for row in processed_rows
                    ])
    conn.commit()
    conn.close()
