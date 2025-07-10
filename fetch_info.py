from json import dump as json_dump
from os import getenv

from requests import get, Response


def dictToJSON(data: dict, filename: str) -> None:
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


def getBazaarInformation() -> dict:
    """
    This function makes a request to the Hypixel API to get the current Bazaar information.

    :return: The Bazaar information
    """
    response: Response = get('https://api.hypixel.net/v2/skyblock/bazaar',
                             params={
                                 'key': getenv('HYPIXEL_TOKEN'),
                             })

    if response.status_code == 200:
        data: dict = response.json()

        data: dict = data['products']
        for key in data.keys():
            data[key] = data[key]['quick_status']

        dictToJSON(data, 'bazaar.json')
        return data

    else:
        print(f'An error occurred with the request\n'
              f'{response.status_code}')
        return {}


getBazaarInformation()
