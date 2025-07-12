from json import dump as json_dump
from os.path import exists
from sqlite3 import connect as sqlite_connect

from build_database import fetch_and_process_information, store_data_in_database
from calculate_profits import calculate_accurate_profit
from fetch_info import get_bazaar_information, json_to_dict

# Check to see if the database file exists
if exists('shard_recipes.db'):
    print('Database file already exists. Skipping database creation.')

else:
    print('Database file does not exist. Proceeding with database creation.')
    rows = fetch_and_process_information()
    shards_cleaned_data: dict = json_to_dict("shards_cleaned.json")
    store_data_in_database(rows, shards_cleaned_data)

bazaar_data = get_bazaar_information()

data_to_save = calculate_accurate_profit(sqlite_connect('shard_recipes.db'), bazaar_data)
data_to_save = dict(sorted(data_to_save.items(), key=lambda item: item[1]['profit'], reverse=True))

# Round all the floats to 2 decimal places
for key, value in data_to_save.items():
    value['profit'] = round(value['profit'], 2)

with open('shard_profits.json', 'w') as f:
    json_dump(data_to_save, f, indent=4)
