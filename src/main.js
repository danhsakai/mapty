'use strict';

// prettier-ignore

const workoutContainer = document.querySelector('.workouts');
const form = document.querySelector('.form');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sortDropdown = document.querySelector('.sort-dropdown');
const btnDeleteAll = document.querySelector('.btn-delete-all');

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
  #markers = [];
  #editMode = false;
  #editId = null;
  workouts = [];
  constructor() {
    this._getLocalStorage();
    this.#getPosition();
    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationField.bind(this));
    // Sync field visibility with current selection on load
    this.#toggleElevationField();
    workoutContainer.addEventListener(
      'click',
      this.#handleWorkoutClick.bind(this)
    );
    sortDropdown.addEventListener('change', this.#sortWorkouts.bind(this));
    btnDeleteAll.addEventListener('click', this.#deleteAllWorkouts.bind(this));
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
    // Render markers for any workouts loaded from localStorage
    this.workouts.forEach((work) => this.#renderWorkoutMarker(work));
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

    // check valid data
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const isPositiveInput = (...inputs) => inputs.every((inp) => inp > 0);

    // If in edit mode, update existing workout
    if (this.#editMode) {
      const workout = this.workouts.find((work) => work.id === this.#editId);
      if (!workout) return;

      // Validate inputs
      if (type === 'running') {
        const cadence = +inputCadence.value;
        if (
          !validInputs(duration, distance, cadence) ||
          !isPositiveInput(duration, distance, cadence)
        )
          return alert('Vui lòng nhập giá trị không âm!');

        // Update workout properties
        workout.distance = distance;
        workout.duration = duration;
        workout.cadence = cadence;
        workout.pace = (duration / distance).toFixed(2);
      } else {
        const elevation = +inputElevation.value;
        if (
          !validInputs(duration, distance, elevation) ||
          !isPositiveInput(duration, distance)
        )
          return alert('Vui lòng nhập giá trị không âm!');

        // Update workout properties
        workout.distance = distance;
        workout.duration = duration;
        workout.elevation = elevation;
        workout.speed = (distance / (duration / 60)).toFixed(2);
      }

      workout.setDescription();

      // Update DOM
      const workoutEl = document.querySelector(`[data-id="${this.#editId}"]`);
      if (workoutEl) workoutEl.remove();
      this.#renderWorkout(workout);

      // Update marker popup
      const markerObj = this.#markers.find((m) => m.id === this.#editId);
      if (markerObj) {
        markerObj.marker.setPopupContent(
          `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
        );
      }

      // Exit edit mode
      this.#editMode = false;
      this.#editId = null;
      form.querySelector('.form__btn').textContent = 'Xong';
    } else {
      // Create new workout
      const { lat, lng } = this.#mapEvent.latlng;
      let workout;

      if (type === 'running') {
        const cadence = +inputCadence.value;
        if (
          !validInputs(duration, distance, cadence) ||
          !isPositiveInput(duration, distance, cadence)
        )
          return alert('Vui lòng nhập giá trị không âm!');
        workout = new Running([lat, lng], distance, duration, cadence);
      }

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
      // Display marker
      this.#renderWorkoutMarker(workout);
      // add workout to the list
      this.#renderWorkout(workout);
    }

    // Clear inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    inputType.value = 'running';
    this.#toggleElevationField();
    this._setLocalStorage();
  }

  #renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
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

    // Store marker reference with workout id
    this.#markers.push({ id: workout.id, marker });

    if (!this.#editMode) this.#hideForm();
  }

  #renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__actions">
          <button class="workout__btn workout__btn--edit" data-action="edit">✏️</button>
          <button class="workout__btn workout__btn--delete" data-action="delete">🗑️</button>
        </div>
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
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _getLocalStorage() {
    const data = localStorage.getItem('workouts');
    if (!data) return;

    try {
      const items = JSON.parse(data);
      this.workouts = items.map((obj) => {
        if (obj.type === 'running') {
          const run = new Running(
            obj.coords,
            obj.distance,
            obj.duration,
            obj.cadence
          );
          run.id = obj.id;
          run.date = new Date(obj.date);
          run.setDescription();
          return run;
        }

        const cyc = new Cycling(
          obj.coords,
          obj.distance,
          obj.duration,
          obj.elevation
        );
        cyc.id = obj.id;
        cyc.date = new Date(obj.date);
        cyc.setDescription();
        return cyc;
      });

      // Render workout list entries (markers will be rendered after map loads)
      this.workouts.forEach((w) => this.#renderWorkout(w));
    } catch (err) {
      console.error('Failed to parse workouts from localStorage', err);
    }
  }
  #handleWorkoutClick(e) {
    const action = e.target.dataset.action;
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.workouts.find(
      (work) => work.id == workoutEl.dataset.id
    );

    if (action === 'delete') {
      this.#deleteWorkout(workout.id);
    } else if (action === 'edit') {
      this.#editWorkout(workout.id);
    } else {
      // Pan to workout on map
      this.#map.setView(workout.coords, 14, {
        animate: true,
        pan: { duration: 1 },
      });
    }
  }

  #deleteWorkout(id) {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;

    // Remove from workouts array
    this.workouts = this.workouts.filter((work) => work.id !== id);

    // Remove marker from map
    const markerObj = this.#markers.find((m) => m.id === id);
    if (markerObj) {
      this.#map.removeLayer(markerObj.marker);
      this.#markers = this.#markers.filter((m) => m.id !== id);
    }

    // Remove from DOM
    const workoutEl = document.querySelector(`[data-id="${id}"]`);
    if (workoutEl) workoutEl.remove();

    // Update localStorage
    this._setLocalStorage();
  }

  #editWorkout(id) {
    const workout = this.workouts.find((work) => work.id === id);
    if (!workout) return;

    // Enter edit mode
    this.#editMode = true;
    this.#editId = id;

    // Show form with workout data
    form.classList.remove('hidden');
    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;

    if (workout.type === 'running') {
      inputCadence.value = workout.cadence;
    } else {
      inputElevation.value = workout.elevation;
    }

    this.#toggleElevationField();
    inputDistance.focus();

    // Change form button text
    const formBtn = form.querySelector('.form__btn');
    formBtn.textContent = 'Cập nhật';
  }

  #deleteAllWorkouts() {
    if (!this.workouts.length) return;
    if (!confirm('Bạn có chắc muốn xóa tất cả bài tập?')) return;

    // Remove all markers
    this.#markers.forEach(({ marker }) => this.#map.removeLayer(marker));
    this.#markers = [];

    // Remove all workouts from DOM
    document.querySelectorAll('.workout').forEach((el) => el.remove());

    // Clear workouts array
    this.workouts = [];

    // Clear localStorage
    localStorage.removeItem('workouts');

    // Reset sort dropdown
    sortDropdown.value = '';
  }

  #sortWorkouts(e) {
    const sortBy = e.target.value;
    if (!sortBy) return;

    // Sort workouts array
    this.workouts.sort((a, b) => {
      if (sortBy === 'distance') return b.distance - a.distance;
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      return 0;
    });

    // Re-render workout list
    document.querySelectorAll('.workout').forEach((el) => el.remove());
    this.workouts.forEach((workout) => this.#renderWorkout(workout));

    // Update localStorage
    this._setLocalStorage();
  }
}

const app = new App();
