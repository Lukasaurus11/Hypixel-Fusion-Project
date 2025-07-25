from sqlite3 import connect as sqlite_connect, Connection

from backend.scripts.build_database import fetch_and_process_information, store_data_in_database
from backend.scripts.calculate_profits import calculate_accurate_profit
from backend.scripts.fetch_info import get_bazaar_information, json_to_dict

rows = fetch_and_process_information()

shards_cleaned_data: dict = json_to_dict("shards_cleaned.json")
store_data_in_database(rows, shards_cleaned_data)

sqlite_connection: Connection = sqlite_connect('shard_recipes.db')

bazaar_data = get_bazaar_information(sqlite_connection)

calculate_accurate_profit(sqlite_connection, bazaar_data)
sqlite_connection.close()
