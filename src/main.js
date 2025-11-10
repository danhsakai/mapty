'use strict';

// prettier-ignore
const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
let inputDistance = document.querySelector('.form__input--distance');
let inputDuration = document.querySelector('.form__input--duration');
let inputCadence = document.querySelector('.form__input--cadence');
let inputElevation = document.querySelector('.form__input--elevation');
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
  constructor() {
    this.#getPosition();
    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationField);
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
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(e) {
    e.preventDefault();
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation =
        '';
    const { lat, lng } = this.#mapEvent.latlng;
    // Display maker
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent(`Vi khi sau khi click`)
      .openPopup();
    form.classList.add('hidden');
  }
}

const app = new App();
