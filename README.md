## Project to try to create a simple calculator for the Shard Fusion (introduced with the Foraging Update)

The project builds on top of two files collected from the community + Bazaar data from the API itself.
-
`Full Fusion List - Hypixel SkyBlock - List.csv` [source](https://docs.google.com/spreadsheets/d/1yI5CLNYY2h_yzKaB0cFDUZQ_BdKQg8UUsjEDYCqV7Po/edit?usp=sharing):
A CSV file containing all the fusion recipes. Credit to HsFearless, MaxLunar & WhatYouThing for the data. Sheet created
by @lunaynx.

- `shards_cleaned.json` [source](https://github.com/Dazzlepuff/HypixelShardOptimizer/blob/main/shards_cleaned.json),
  although a version with a fixed typo can be
  found [here](https://github.com/Lukasaurus11/HypixelShardOptimizer/blob/main/shards_cleaned.json), contains all the
  relevant information for shards (as well as their Bazaar product IDs). Credit to Dazzlepuff for the data.
- The Bazaar data can be obtained from the Hypixel API using the `fetch_info.py` directly, or executing the code from
  `main.py`. While having an API key is not necessary, it allows for more constant data updates.
    - Information about the Hypixel API can be
      found [here](https://api.hypixel.net/#tag/SkyBlock/paths/~1v2~1skyblock~1auctions_ended/get)
    - To generate an API key, you can get them [here](https://developer.hypixel.net/)

### Project structure

- `main.py`: The main file that runs the program. It will build the database if necessary, fetch the Bazaar data, and
  then generate the JSON with the calculations.
- `fetch_info.py`: A file that fetches the Bazaar data from the Hypixel API and saves it to a JSON file as well as
  containing a helper function to load JSON files.
- `calculate_profits.py`: A file that will calculate and return all the profits for each of the recipes registered in
  the database. It returns the information as a dictionary for ease of processing.
- `build_database.py`: A file that builds the database from the CSV and JSON files. It will create an SQLite database
  with all the relevant information with three relevant tables:
    - `shard_recipes`: Contains the recipes for the shards gathered directly from the CSV file (Currently might contain
      some duplicates).
    - `shard_to_productid`: Contains processed information about the shards gathered only from the `shards_cleaned.json`
      file.
    - `shard_recipes_processed`: Contains the recipe information processed to use the Bazaar product IDs instead of the
      shard names. This is used to calculate the prices of the shards.

### How to run the project

1. Make sure you have Pyton 3.9 or higher installed.
2. Install the required packages by running:
   ```bash
   pip install -r requirements.txt
   ```
3. Make sure you have the required files:
    - `Full Fusion List - Hypixel SkyBlock - List.csv` in the same directory as the project.
    - `shards_cleaned.json` in the same directory as the project.
    - The structure of the project should look like this:
   ```
    |
    ├── Full Fusion List - Hypixel SkyBlock - List.csv
    ├── shards_cleaned.json
    ├── main.py
    ├── fetch_info.py
    ├── calculate_profits.py
    ├── build_database.py
    ├── requirements.txt
    ├── bazaar.json (will be created when running the project -> no longer will be created)
    └── shard_recipes.db (will be created when running the project)
    ```
4. Run the `main.py` file:
   ```bash
    python main.py
    ```

### Tasks TODO or in progress

- [x] Move from JSON to SQLite for Bazaar data.
- [x] Move from JSON to SQLite for Shard Profits while keeping a temporary JSON file as the output.
- [ ] Add a frontend to display the information as reading JSON files ain't pretty (partially done but still working on
  it).