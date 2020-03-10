class StationCoords():
    def __init__(self, lat, long):
        self.lat = lat
        self.long = long

class Station():
    def __init__(self, id, name, coords):
        self.id = id
        self.name = name
        self.coords = coords

    