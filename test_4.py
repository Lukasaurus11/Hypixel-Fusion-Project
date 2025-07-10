import csv
import json
import re
import sqlite3


def fetch_and_process_information(filename='full_fusion_list.csv'):
    """
    I will eventually use a more efficient approach to read the CSV, but polars was being ass, and I was on a rush.

    :param filename: The filename which contains the fusion list information.
    :return: A list of dictionaries containing all relevant information for fusions.
    """
    processed_rows = []
    with open(filename, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            def split_and_clean(value):
                if not value:
                    return 0, ''
                parts = value.split(' ', 1)
                quantity = int(parts[0].replace('x', '')) if parts[0].replace('x', '').isdigit() else 0
                name = re.sub(r'\s*\(.*\)', '', parts[1]) if len(parts) > 1 else ''
                return quantity, name.strip()

            quantity_1, ingredient_1 = split_and_clean(row.get('Input #1', ''))
            quantity_2, ingredient_2 = split_and_clean(row.get('Input #2', ''))

            outputs = []
            for i in range(1, 4):
                q, n = split_and_clean(row.get(f'Output #{i}', ''))
                if n:
                    outputs.append((q, n))

            for output_quantity, output_item in outputs:
                processed_rows.append({
                    'quantity_1': quantity_1,
                    'ingredient_1': ingredient_1,
                    'quantity_2': quantity_2,
                    'ingredient_2': ingredient_2,
                    'output_quantity': output_quantity,
                    'output_item': output_item
                })
    return processed_rows


def store_data_in_database(processed_rows, cleaned_shards_data):
    """
    Function to store processed rows and cleaned shards data into a SQLite database.
    It will make three tables:
        - `shard_to_productid`: Maps shard names to their product IDs and other relevant information.
        - `shard_recipes`: Contains the recipes for shards.
        - `shard_recipes_processed`: Contains processed recipes with corrected names for easy bazaar lookups.

    :param processed_rows: The data coming from the CSV file which contains the fusion list information.
    :param cleaned_shards_data: A dictionary containing different information about shards
    :return: None
    """
    db_path = 'shard_recipes_2.db'

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS shard_recipes")
    cur.execute("DROP TABLE IF EXISTS shard_to_productid")
    cur.execute("DROP TABLE IF EXISTS shard_recipes_processed")

    name_corrections = {
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


if __name__ == '__main__':
    rows = fetch_and_process_information()
    with open('shards_cleaned.json', 'r') as f:
        cleaned_shards_data = json.load(f)
    store_data_in_database(rows, cleaned_shards_data)
