
function getCurrentLocation() {
  return new Promise(function(resolve, reject) {
    if (!navigator.geolocation) {
      return reject(new Error('GeoLocation not available on Navigator.'));
    }

    navigator.geolocation.getCurrentPosition((position) => resolve(new { lat: position.coords.latitude, long: position.coords.longitude }), reject);
  });
}

class WeatherStation extends React.Component {
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

class WeatherComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      isWeatherDataLoaded: false,
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

        res.items.forEach(station => stations.push({
          id: station.weather_stn_id,
          name: station.weather_stn_name,
          coords: {
            lat: station.weather_stn_lat,
            long: station.weather_stn_long
          }
        }));

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
  }

  showAllStations = (e) => {
    this.setState({
      currentStationId: null
    });
  }

  getCurrentStation = () => this.state.weatherStations.find(station => station.id === this.state.currentStationId);
  
  render() {
    const stationItems = this.state.weatherStations.map((station) => <WeatherStation station={station} click={this.stationClicked} />)

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