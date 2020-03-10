from pprint import pprint
import requests
from flask import jsonify, Blueprint
import reverse_geocoder
import pycountry
import gettext
import locale

locale.setlocale(locale.LC_NUMERIC, "sv_SE.UTF-8")
gettext.translation("iso3166", pycountry.LOCALES_DIR, languages=["sv"]).install()

class Urls():
    GET_ALL_WEATHER_STATIONS = "https://apex.oracle.com/pls/apex/raspberrypi/weatherstation/getallstations"
    GET_STATION_LATEST_MEASUREMENTS = "https://apex.oracle.com/pls/apex/raspberrypi/weatherstation/getlatestmeasurements/%s"

apex = Blueprint("apex_oracle", __name__)

def get_location(station):
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

    return station

@apex.route('/api/apex/stations')
def get_stations():
    url = Urls.GET_ALL_WEATHER_STATIONS
    print(f"get_stations: {url}")
    request = requests.get(url)
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
        
        station = get_location(station)

        station_items.append(station)

    return jsonify(station_items)

@apex.route("/api/apex/station/<int:station_id>/measurements")
def get_station_measurements(station_id):
    url = Urls.GET_STATION_LATEST_MEASUREMENTS%(station_id)
    print(f"get_station_measurements: {url}")
    request = requests.get(url)
    data = request.json()
    measurements = None

    for item in data["items"]:
        if item["weather_stn_id"] == station_id:
            measurements = item

    for key in measurements.keys():
        val = measurements[key]
        if isinstance(val, float):
            measurements[key] = f'{val:n}'

    return jsonify(measurements)
