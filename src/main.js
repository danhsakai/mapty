'use strict';

// prettier-ignore

const workoutContainer = document.querySelector('.workouts');
const form = document.querySelector('.form');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// workout class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }

  setDescription() {
    this.description = `${
      this.type[0].toUpperCase() + this.type.slice(1)
    } vào ${this.date.toLocaleDateString('vi-VN', {
      month: 'long',
      day: 'numeric',
    })}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.#calcPace();
    this.setDescription();
  }
  #calcPace() {
    // min/km
    this.pace = (this.duration / this.distance).toFixed(2);
    return this.pace;
  }
  getPace() {
    return this.#calcPace();
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.#calcSpeed();
    this.setDescription();
  }

  #calcSpeed() {
    // km/h
    this.speed = (this.distance / (this.duration / 60)).toFixed(2);
    return this.speed;
  }

  getSpeed() {
    return this.#calcSpeed();
  }
}

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
    workoutContainer.addEventListener('click', this.#toPopup.bind(this));
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

  #hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
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
    // Display maker
    this.#renderWorkoutMarker(workout);

    // add workout to the list
    this.#renderWorkout(workout);
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    inputType.value = 'running';
    this.#toggleElevationField();
  }

  #renderWorkoutMarker(workout) {
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
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
      )
      .openPopup();
    this.#hideForm();
  }

  #renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
      `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.getPace()}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.getSpeed()}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  #toPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);

    if (!workoutEl) return;
    const workout = this.workouts.find(
      (work) => work.id == workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, 14, {
      animate: true,
      pan: { duration: 1 },
    });
  }
}

const app = new App();
