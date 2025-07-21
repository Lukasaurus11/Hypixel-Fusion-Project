from json import dump as json_dump, load as json_load
from os import getenv
import sqlite3
from sqlite3 import Connection, Cursor
from typing import Dict

from requests import get, Response


def dict_to_json(data: Dict, filename: str) -> None:
    """
    Save a dictionary to a JSON file

    :param data: the dictionary to save
    :param filename: the name of the file to save to
    :return: Nothing (Could change to a bool)
    """
    try:
        with open(filename, "w") as f:
            print(f'Saving data to {filename}')
            json_dump(data, f, indent=4)

    except Exception as e:
        print(f'Error saving data to {filename}\n'
              f'{e}')


def json_to_dict(filename: str) -> Dict:
    """
    Load a dictionary from a JSON file

    :param filename: the name of the file to load from
    :return: The dictionary loaded from the file
    """
    try:
        with open(filename, "r") as f:
            print(f'Loading data from {filename}')
            return json_load(f)

    except Exception as e:
        print(f'Error loading data from {filename}\n'
              f'{e}')
        return {}


def get_bazaar_information(db_connection: Connection):
    """
    Function to fetch and store Bazaar information and store in the database.

    :param db_connection: The SQLite database connection to store the Bazaar information.
    :return: Nothing
    """

    cursor: Cursor = db_connection.cursor()
    cursor.execute("DROP TABLE IF EXISTS bazaar_info")

    hypixel_token: str = getenv('HYPIXEL_TOKEN')
    if not hypixel_token:
        response: Response = get('https://api.hypixel.net/v2/skyblock/bazaar')

    else:
        response: Response = get('https://api.hypixel.net/v2/skyblock/bazaar',
                                 params={
                                     'key': getenv('HYPIXEL_TOKEN'),
                                 })

    if response.status_code == 200:
        data: Dict[str, str or float or int] = response.json()

        data: Dict[str, str or float or int] = data['products']
        for key in data.keys():
            data[key] = data[key]['quick_status']

        cursor.execute("""
                       CREATE TABLE IF NOT EXISTS bazaar_info
                       (
                           product_id       TEXT PRIMARY KEY,
                           sell_price       REAL,
                           sell_volume      INTEGER,
                           sell_moving_week INTEGER,
                           sell_orders      INTEGER,
                           buy_price        REAL,
                           buy_volume       INTEGER,
                           buy_moving_week  INTEGER,
                           buy_orders       INTEGER
                       )
                       """)

        for product in data.values():
            cursor.execute("""
                INSERT OR REPLACE INTO bazaar_info (
                    product_id, sell_price, sell_volume, sell_moving_week, sell_orders,
                    buy_price, buy_volume, buy_moving_week, buy_orders
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                product['productId'],
                product['sellPrice'],
                product['sellVolume'],
                product['sellMovingWeek'],
                product['sellOrders'],
                product['buyPrice'],
                product['buyVolume'],
                product['buyMovingWeek'],
                product['buyOrders']
            ))
        db_connection.commit()

    else:
        print(f'An error occurred with the request\n'
              f'{response.status_code}')
