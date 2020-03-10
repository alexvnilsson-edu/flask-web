from pprint import pprint
import requests
from flask import jsonify, Blueprint
import reverse_geocoder
import pycountry
import gettext
import locale

locale.setlocale(locale.LC_NUMERIC, "sv_SE.UTF-8")

gettext.translation("iso3166", pycountry.LOCALES_DIR, languages=["sv"]).install()

APP_USER_AGENT = "daodao1a-weather"

class Urls():
    GET_ALL_WEATHER_STATIONS = "https://apex.oracle.com/pls/apex/raspberrypi/weatherstation/getallstations"
    GET_STATION_LATEST_MEASUREMENTS = "https://apex.oracle.com/pls/apex/raspberrypi/weatherstation/getlatestmeasurements/%s"

def get_station_by_coords(stations, coords):
    lat = coords["lat"]
    lon = coords["long"]
    print(f"get_station_by_coords(list, ({lat}, {lon}))")
    for station in stations:
        station_name = station["name"]
        print(f"Looking in {station_name}")
        try:
            if station["location"]["coords"]["lat"] == coords["lat"] and station["location"]["coords"]["long"] == coords["long"]:
                print("Found.")
                return station
        except:
            print("Failed.")

apex = Blueprint("apex_oracle", __name__)

@apex.route('/api/apex/stations')
def get_stations():
    request = requests.get(Urls.GET_ALL_WEATHER_STATIONS)
    data = request.json()

    if data is None:
        raise NameError('EmptyDataResponse')

    station_items = []

    for _station in data["items"]:
        station = {
            "id": _station["weather_stn_id"],
            "name": _station["weather_stn_name"],
            "location": {
                "coords": {
                    "lat": _station["weather_stn_lat"], 
                    "long": _station["weather_stn_long"]
                }
            }
        }
        locations = reverse_geocoder.search((station["location"]["coords"]["lat"], station["location"]["coords"]["long"]), mode=1)
        if len(locations) > 0:
            location = locations[0]
            if location["name"] is not None:
                station["location"]["name"] = location["name"]
            if location["cc"] is not None:
                station["location"]["country_code"] = location["cc"]
                country = pycountry.countries.get(alpha_2=location["cc"])
                if country is not None and country.name is not None:
                    station["location"]["country"] = _(country.name)

        station_items.append(station)

    return jsonify(station_items)

@apex.route("/api/apex/station/<int:station_id>/measurements")
def get_station_measurements(station_id):
    request = requests.get(Urls.GET_STATION_LATEST_MEASUREMENTS%(station_id))
    data = request.json()
    measurements = None

    for item in data["items"]:
        if item["weather_stn_id"] == station_id:
            measurements = item

    for key in item.keys():
        val = item[key]
        val_type = type(val)
        print(f"key: {key}, type: {val_type}, value: {val}")
        if isinstance(val, float):
            print("is float, reformatting")
            item[key] = f'{val:n}'
        else:
            print("is not float")


    #item["air_pressure"] = f'{value:n}' '{:n}'.format(item["air_pressure"])

    return jsonify(measurements)
