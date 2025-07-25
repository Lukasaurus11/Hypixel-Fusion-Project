import datetime
import sqlite3
import time
from typing import Dict, List

import requests


def get_product_data(db_connection: sqlite3.Connection) -> None:
    cursor = db_connection.cursor()

    # Select all the product_ids from the shard_to_productid table
    cursor.execute('SELECT productID FROM shard_to_productid')
    product_ids: List[str] = [row[0] for row in cursor.fetchall()]

    cursor.execute('''
                   CREATE TABLE IF NOT EXISTS product_price_history
                   (
                       product_id TEXT,
                       buy_price  REAL,
                       sell_price REAL,
                       timestamp  TEXT,
                       PRIMARY KEY (product_id, timestamp)
                   )
                   ''')

    cursor.execute('''
                   SELECT MAX(timestamp)
                   FROM product_price_history
                   ''')
    last_timestamp = cursor.fetchone()[0]

    if last_timestamp:
        # Parse ISO string and set UTC-6 timezone
        dt = datetime.datetime.fromisoformat(last_timestamp)
        utc_minus_6 = datetime.timezone(datetime.timedelta(hours=-6))
        dt = dt.replace(tzinfo=utc_minus_6)
        last_timestamp_local = int(dt.timestamp())

        # Get current time in UTC-6
        now_utc = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
        now_local = now_utc.astimezone(utc_minus_6)
        current_time_local = int(now_local.timestamp())

        if current_time_local - last_timestamp_local < 7200:
            print("Data is already up to date. Exiting.")
            return

    for product_id in product_ids:
        try:
            product_data = requests.get(
                f'https://sky.coflnet.com/api/bazaar/{product_id}/history/week',
                headers={
                    'accept': 'text/plain'
                }
            ).json()

        except requests.RequestException as e:
            print(f"Error fetching data for product {product_id}: {e}")
            continue

        filtered_data: Dict[str, List[float or str]] = {
            'buy': [],
            'sell': [],
            'timestamp': []
        }

        for entry in product_data:

            if entry.get('buy') is None or entry.get('sell') is None:
                print(
                    f"Skipping entry with missing buy or sell price for product {product_id} at timestamp {entry['timestamp']}")
                continue

            filtered_data['buy'].append(entry['buy'])
            filtered_data['sell'].append(entry['sell'])
            filtered_data['timestamp'].append(entry['timestamp'])

        for i in range(len(filtered_data['timestamp'])):
            cursor.execute('''
                           INSERT OR IGNORE INTO product_price_history (product_id, buy_price, sell_price, timestamp)
                           VALUES (?, ?, ?, ?)
                           ''', (product_id, filtered_data['buy'][i], filtered_data['sell'][i],
                                 filtered_data['timestamp'][i]))

        time.sleep(1)  # To avoid hitting the API too hard

    db_connection.commit()


get_product_data(sqlite3.connect('shard_recipes.db'))
