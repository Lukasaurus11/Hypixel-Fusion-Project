from json import dump as json_dump, load as json_load
from os import getenv
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


def get_bazaar_information() -> Dict[str, Dict[str, str or float or int]]:
    """
    This function makes a request to the Hypixel API to get the current Bazaar information.

    :return: The Bazaar information
    """
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

        dict_to_json(data, 'bazaar.json')
        return data

    else:
        print(f'An error occurred with the request\n'
              f'{response.status_code}')
        return {}
