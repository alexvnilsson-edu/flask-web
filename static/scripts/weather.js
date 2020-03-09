
function getCurrentLocation() {
  return new Promise(function(resolve, reject) {
    if (!navigator.geolocation) {
      return reject(new Error('GeoLocation not available on Navigator.'));
    }

    navigator.geolocation.getCurrentPosition((position) => resolve(new { lat: position.coords.latitude, long: position.coords.longitude }), reject);
  });
}

class WeatherStationComponent extends React.Component {
  constructor(props) {
    super(props);

    this.station = props.station;
    this.clickEvent = props.click;
  }

  click = (station, e) => {
    console.log("Clicked station: " + station.id);
  }

  render() {
    return (<button className="list-group-item list-group-item-action border-0" onClick={(e) => this.clickEvent(this.station, e)}>
      <div className="font-weight-bold">{this.station.name}</div>
      <div className="pt-2">
        <small className="text-muted">
          <i className="fas fa-location-arrow mr-2" />
          <span>{this.station.coords.lat}, {this.station.coords.long}</span>
        </small>
      </div>
      </button>);
  }
}

class WeatherStation{
  constructor(station) {
    this.id = station.id;
    this.name = station.name;
    this.coords = station.coords;
    this.measurements = null;
  }

  getLatestMeasurements() {
    console.log("getLatestMeasurements() station.id: " + this.id);
    return new Promise((resolve, reject) => {
      fetch("https://apex.oracle.com/pls/apex/raspberrypi/weatherstation/getlatestmeasurements/" + this.id)
      .then(res => res.json())
      .then((result) => {
        const measurements = result.items.find(r => r.weather_stn_id === this.id);
        this.measurements = measurements;

        return resolve(this);
      });
    });
  }
}

function updateWeatherStation(weatherStations, stationToUpdate) {
  return weatherStations.map(station => station.id === stationToUpdate.id ? stationToUpdate : station);
}

class WeatherComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      isWeatherDataLoaded: false,
      currentStation: null,
      currentStationId: null,
      myLocation: null,
      weatherStations: []
    };
  }

  componentDidMount() {
    fetch("https://apex.oracle.com/pls/apex/raspberrypi/weatherstation/getallstations")
      .then(res => res.json())      
      .then((res) => new Promise((resolve, reject) => {
        const stations = [];

        res.items.forEach(station => stations.push(new WeatherStation({
          id: station.weather_stn_id,
          name: station.weather_stn_name,
          coords: {
            lat: station.weather_stn_lat,
            long: station.weather_stn_long
          }
        })));

        resolve(stations);        
      }))
      .then(
        (result) => {
          this.setState({
            isWeatherDataLoaded: true,
            weatherStations: result
          });
        }
      )
      .catch(err => {
        this.setState({
          error: err
        });
      });
  }

  stationClicked = (station, e) => {
    this.setState({
      currentStationId: station.id,
    });

    station.getLatestMeasurements().then((result) => {
      console.log("getLatestMeasurements() done", result);

      this.setState({
        weatherStations: updateWeatherStation(this.state.weatherStations, result)
      });
    });
  }

  stationChanged() {
    console.log("stationChanged", this.state.currentStation);
    if (this.state.currentStation != null) {
      currentStation.getLatestMeasurements().then(result => {
        console.log(result);
        this.setState({
          weatherStations: this.state.weatherStations.map(station => {
            if (station.id === result.id) {
              return result;
            } else {
              return station;
            }
          })
        });
      });      
    }
  }

  showAllStations = (e) => {
    this.setState({
      currentStationId: null
    });
  }

  getCurrentStation = () => this.state.weatherStations.find(station => station.id === this.state.currentStationId);

  renderCurrentMeasurements()  {
    const UNKNOWN_STRING = "Okänt";
    const LOADING_STRING = "Laddar"

    const currentStation = this.getCurrentStation();
    if (currentStation != null && currentStation.measurements != null) {
      return (<table>
        <tr>
          <th>Temperatur</th>
          <td>{currentStation.measurements.ambient_temp + "°" || UNKNOWN_STRING}</td>
        </tr>
        <tr>
          <th>Lufttryck</th>
          <td>{currentStation.measurements.air_pressure + " hPa" || UNKNOWN_STRING}</td>
        </tr>
        <tr>
          <th>Luftfuktighet</th>
          <td>{currentStation.measurements.humidity + "%" || UNKNOWN_STRING}</td>
        </tr>
        <tr>
          <th>Vindstyrka (riktning)</th>
          <td>{currentStation.measurements.wind_speed + "km/h" + " (" + currentStation.measurements.wind_direction + ")"}</td>
        </tr>
      </table>);
    } else {
      return (<div className="container"><p>{LOADING_STRING}...</p></div>);
    }
  }
  
  render() {
    const stationItems = this.state.weatherStations.map((station) => <WeatherStationComponent station={station} click={this.stationClicked} />)

    if (this.state.currentStationId == null) {
      return (<div className="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb bg-transparent">
            <li class="breadcrumb-item active">Väderstationer</li>
          </ol>
        </nav>
        <ul className="list-group">
          {stationItems}
        </ul>
      </div>);
    } else {
      const currentStation = this.getCurrentStation();

      return (<div className="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb bg-transparent">
            <li class="breadcrumb-item"><a href="#" onClick={(e) => this.showAllStations(e)}>Väderstationer</a></li>
            <li class="breadcrumb-item active">{currentStation.name}</li>
          </ol>
        </nav>
        <div className="container">
          <div className="pb-4">
            <h2>{currentStation.name}</h2>
            <small><i className="fas fa-location-arrow" /> <span>{currentStation.coords.lat}, {currentStation.coords.long}</span></small>
          </div>
          {this.renderCurrentMeasurements()}
        </div>
      </div>)
    }
  }
}

function AppNavbar() {
  return (
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" href="#">Väder</a>
    </nav>
  );
}

function App() {
  return (<div>
    <AppNavbar />
    <WeatherComponent />
    </div>);
}

ReactDOM.render(<App />, document.getElementById('root'));