'use strict';

// prettier-ignore
const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map, mapEvent;

// workout class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.#calcePace();
  }
  #calcePace() {
    // min/km
    this.pace = (this.duration / this.distance).toFixed(2);
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.#calcSpeed();
  }

  #calcSpeed() {
    // km/h
    this.speed = (this.distance / (this.duration / 60)).toFixed(2);
    return this.speed;
  }
}

const run1 = new Running([42, -14], 12, 60, 14);
const cicling1 = new Cycling([42, -14], 14, 95, 320);
console.log(run1, cicling1);

// class structure
class App {
  #map;
  #mapEvent;
  workouts = [];
  constructor() {
    this.#getPosition();
    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationField.bind(this));
    // Sync field visibility with current selection on load
    this.#toggleElevationField();
  }

  #getPosition() {
    // geolocation API
    navigator.geolocation.getCurrentPosition(
      this.#loadMap.bind(this),
      function () {
        alert('Không thể lấy vị trí của bạn!');
      }
    );
  }

  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    const currentCoords = [latitude, longitude];
    // API set mark on map
    this.#map = L.map('map').setView(currentCoords, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this.#showForm.bind(this));
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #toggleElevationField() {
    const isRunning = inputType.value === 'running';
    // Show cadence for running; elevation for cycling
    inputCadence
      .closest('.form__row')
      .classList.toggle('form__row--hidden', !isRunning);
    inputElevation
      .closest('.form__row')
      .classList.toggle('form__row--hidden', isRunning);
  }

  #newWorkout(e) {
    e.preventDefault();
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // check valid data
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const isPositiveInput = (...inputs) => inputs.every((inp) => inp > 0);

    // if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(duration, distance, cadence) ||
        !isPositiveInput(duration, distance, cadence)
      )
        return alert('Vui lòng nhập giá trị không âm!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(duration, distance, elevation) ||
        !isPositiveInput(duration, distance)
      )
        return alert('Vui lòng nhập giá trị không âm!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add new object to workout array
    this.workouts.push(workout);
    console.log(workout);
    // Display maker
    this.renderWorkoutMarker(workout);
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    inputType.value = 'running';
    this.#toggleElevationField();
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`Vi khi sau khi click`)
      .openPopup();
    form.classList.add('hidden');
    console.log(workout.type);
  }
}

const app = new App();
