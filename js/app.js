const audio = new Audio();

let tracks = [];
let likedTrackIds = JSON.parse(localStorage.getItem('vibe-player-likes') || '[]');

let state = {
  category: "jazz",
  trackId: null,
  isPlaying: false,
  volume: 0.7,
  muted: false,
  previousVolume: 0.7,
  repeat: false,
  shuffle: false
};

const categoryNames = {
  jazz: "Jazz",
  classic: "Classic",
  blues: "Blues",
  favorites: "Избранное"
};

const categoryColors = {
  jazz: "#7c3aed",
  classic: "#c45a00",
  blues: "#2458d5",
  favorites: "#e11d48"
};

const els = {
  categoryCards: [...document.querySelectorAll(".category-card")],
  counts: document.querySelectorAll("[data-count]"),
  playlistTitle: document.querySelector("#playlistTitle"),
  heroCover: document.querySelector("#heroCover"),
  miniCover: document.querySelector("#miniCover"),
  trackList: document.querySelector("#trackList"),
  currentTitle: document.querySelector("#currentTitle"),
  currentArtist: document.querySelector("#currentArtist"),
  mainPlayButton: document.querySelector("#mainPlayButton"),
  mainPlayIcon: document.querySelector("#mainPlayIcon"),
  playButton: document.querySelector("#playButton"),
  playIcon: document.querySelector("#playIcon"),
  prevButton: document.querySelector("#prevButton"),
  nextButton: document.querySelector("#nextButton"),
  progressTrack: document.querySelector("#progressTrack"),
  progressFill: document.querySelector("#progressFill"),
  progressThumb: document.querySelector("#progressThumb"),
  currentTime: document.querySelector("#currentTime"),
  duration: document.querySelector("#duration"),
  volumeSlider: document.querySelector("#volumeSlider"),
  muteButton: document.querySelector("#muteButton"),
  volumeIcon: document.querySelector("#volumeIcon"),
  themeToggle: document.querySelector("#themeToggle"),
  shuffleButton: document.querySelector("#shuffleButton"),
  shuffleBottom: document.querySelector("#shuffleBottom"),
  repeatButton: document.querySelector("#repeatButton"),
  favoriteButton: document.querySelector("#favoriteButton")
};

audio.volume = state.volume;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function getCurrentTrack() {
  return tracks.find(track => track.id === state.trackId) || null;
}

function getCategoryTracks() {
  if (state.category === "favorites") {
    return tracks.filter(track => likedTrackIds.includes(track.id));
  }
  return tracks.filter(track => track.category === state.category);
}

function getCategoryCount(category) {
  if (category === "favorites") {
    return likedTrackIds.length;
  }
  return tracks.filter(track => track.category === category).length;
}

function renderCounts() {
  els.counts.forEach(node => {
    node.textContent = getCategoryCount(node.dataset.count);
  });
}

function renderCategories() {
  els.categoryCards.forEach(button => {
    const active = button.dataset.category === state.category;
    button.classList.toggle("is-active", active);

    const sound = button.querySelector(".category-sound");
    if (sound) sound.textContent = active && state.isPlaying ? "◖" : "";
  });
}

function renderHero() {
  const color = categoryColors[state.category];
  els.playlistTitle.textContent = categoryNames[state.category];
  els.heroCover.style.background = color;
  els.heroCover.textContent = state.category === "favorites" ? "♥" : "♫";
  els.miniCover.style.background = color;
}

function updateFavoriteButtonState() {
  const current = getCurrentTrack();
  if (!current) {
    els.favoriteButton.classList.remove("is-liked");
    els.favoriteButton.textContent = "♡";
    return;
  }
  
  const isLiked = likedTrackIds.includes(current.id);
  els.favoriteButton.classList.toggle("is-liked", isLiked);
  els.favoriteButton.textContent = isLiked ? "♥" : "♡";
}

function renderPlayerInfo() {
  const current = getCurrentTrack();

  if (!current) {
    els.currentTitle.textContent = "Выберите трек";
    els.currentArtist.textContent = "—";
    updateFavoriteButtonState();
    return;
  }

  els.currentTitle.textContent = current.title;
  els.currentArtist.textContent = current.artist;
  els.miniCover.style.background = categoryColors[current.category] || categoryColors.jazz;
  els.miniCover.textContent = current.category === "favorites" ? "♥" : "♫";

  updateFavoriteButtonState();
}

function renderPlayButtons() {
  const icon = state.isPlaying ? "Ⅱ" : "▶";
  els.playIcon.textContent = icon;
  els.mainPlayIcon.textContent = icon;
  els.playButton.setAttribute("aria-label", state.isPlaying ? "Пауза" : "Воспроизвести");
  els.mainPlayButton.setAttribute("aria-label", state.isPlaying ? "Пауза" : "Воспроизвести");
}

function renderVolume() {
  els.volumeSlider.value = Math.round(state.volume * 100);
  els.volumeIcon.textContent = state.muted || state.volume === 0 ? "⊘" : "◖";
  els.muteButton.setAttribute(
    "aria-label",
    state.muted || state.volume === 0 ? "Включить звук" : "Выключить звук"
  );
}

function renderProgress() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  const percent = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  els.progressFill.style.width = `${percent}%`;
  els.progressThumb.style.left = `${percent}%`;
  els.currentTime.textContent = formatTime(current);
  els.duration.textContent = formatTime(duration);
  els.progressTrack.setAttribute("aria-valuenow", String(Math.round(percent)));
}

function renderTracks() {
  const categoryTracks = getCategoryTracks();

  els.trackList.innerHTML = `
    <div class="track-head">
      <span>#</span>
      <span>Название</span>
      <span style="text-align:center">♥</span>
      <span style="text-align:right">◷</span>
    </div>
  `;

  if (!categoryTracks.length) {
    els.trackList.insertAdjacentHTML(
      "beforeend", 
      `<div class="empty-state">${state.category === "favorites" ? "Вы пока не добавили ни одного трека в избранное." : "В этой категории пока нет треков."}</div>`
    );
    return;
  }

  categoryTracks.forEach((track, index) => {
    const row = document.createElement("div");
    row.className = "track-row";
    row.dataset.id = track.id;
    row.style.animationDelay = `${index * 35}ms`;

    if (track.id === state.trackId) {
      row.classList.add("is-current");
    }

    const isPlayingCurrent = track.id === state.trackId && state.isPlaying;
    const isLiked = likedTrackIds.includes(track.id);

    row.innerHTML = `
      <span class="track-number">${isPlayingCurrent ? "▮▮" : index + 1}</span>
      <span class="track-main">
        <span class="track-art">${isPlayingCurrent ? "▮▮" : "♫"}</span>
        <span class="track-meta">
          <span class="track-title">${escapeHtml(track.title)}</span>
          <span class="track-artist">${escapeHtml(track.artist)}</span>
        </span>
      </span>
      <button class="track-like-btn ${isLiked ? 'is-liked' : ''}" data-like-id="${track.id}" type="button" title="${isLiked ? 'Убрать из избранного' : 'Добавить в избранное'}">
        ${isLiked ? '♥' : '♡'}
      </button>
      <span class="track-duration">${track.id === state.trackId ? formatTime(audio.duration) : "—"}</span>
    `;

    row.addEventListener("click", (e) => {
      if (e.target.closest('.track-like-btn')) return;
      handleTrackClick(track);
    });

    const likeBtn = row.querySelector('.track-like-btn');
    likeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTrackLike(track.id);
    });

    els.trackList.appendChild(row);
  });
}

function toggleTrackLike(trackId) {
  const index = likedTrackIds.indexOf(trackId);
  if (index === -1) {
    likedTrackIds.push(trackId);
  } else {
    likedTrackIds.splice(index, 1);
  }

  localStorage.setItem('vibe-player-likes', JSON.stringify(likedTrackIds));
  
  renderCounts();
  updateFavoriteButtonState();
  renderTracks();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setCategory(category) {
  if (!["jazz", "classic", "blues", "favorites"].includes(category)) return;
  state.category = category;

  renderCategories();
  renderHero();
  renderTracks();
}

function selectTrack(track) {
  state.trackId = track.id;
  state.isPlaying = true;

  audio.src = track.file;
  audio.volume = state.volume;
  audio.play().catch(() => {
    state.isPlaying = false;
    renderPlayButtons();
    renderCategories();
  });

  renderPlayerInfo();
  renderPlayButtons();
  renderCategories();
  renderTracks();
}

function togglePlay() {
  const current = getCurrentTrack();

  if (!current) {
    const first = getCategoryTracks()[0];
    if (first) selectTrack(first);
    return;
  }

  if (state.isPlaying) {
    audio.pause();
  } else {
    audio.play().catch(() => {});
  }
}

function handleTrackClick(track) {
  if (track.id === state.trackId) {
    togglePlay();
  } else {
    selectTrack(track);
  }
}

/* Правка 4: Переключение треков с учетом режима Shuffle (разнобойный выбор) */
function getRandomTrackFromCategory() {
  const categoryTracks = getCategoryTracks();
  if (!categoryTracks.length) return null;
  if (categoryTracks.length === 1) return categoryTracks[0];

  const available = categoryTracks.filter(track => track.id !== state.trackId);
  return available[Math.floor(Math.random() * available.length)];
}

function playRelative(step) {
  const categoryTracks = getCategoryTracks();
  if (!categoryTracks.length) return;

  // Если включен режим Shuffle — при нажатии следующая/предыдущая выбирается случайный трек
  if (state.shuffle) {
    const randomTrack = getRandomTrackFromCategory();
    if (randomTrack) {
      selectTrack(randomTrack);
      return;
    }
  }

  let index = categoryTracks.findIndex(track => track.id === state.trackId);

  if (index === -1) {
    index = step > 0 ? 0 : categoryTracks.length - 1;
  } else {
    index = (index + step + categoryTracks.length) % categoryTracks.length;
  }

  selectTrack(categoryTracks[index]);
}

function playNextTrack() {
  if (state.repeat && getCurrentTrack()) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return;
  }

  // При окончании песни или переходе вперед с удержанием режима shuffle
  if (state.shuffle) {
    const randomTrack = getRandomTrackFromCategory();
    if (randomTrack) {
      selectTrack(randomTrack);
      return;
    }
  }

  playRelative(1);
}

function seekFromPointer(event) {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const rect = els.progressTrack.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  audio.currentTime = ratio * audio.duration;
}

function toggleMute() {
  if (state.muted || audio.volume === 0) {
    state.muted = false;
    state.volume = state.previousVolume || 0.7;
    audio.volume = state.volume;
  } else {
    state.previousVolume = audio.volume;
    state.muted = true;
    audio.volume = 0;
  }

  renderVolume();
}

function setVolume(value) {
  const volume = Math.min(1, Math.max(0, Number(value) / 100));
  state.volume = volume;
  audio.volume = volume;

  if (volume > 0) {
    state.previousVolume = volume;
    state.muted = false;
  } else {
    state.muted = true;
  }

  renderVolume();
}

/* Правка 4: Переключение состояния Shuffle с анимацией */
function toggleShuffle() {
  state.shuffle = !state.shuffle;
  
  [els.shuffleButton, els.shuffleBottom].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle("is-active", state.shuffle);
    btn.classList.add("is-animating");
    setTimeout(() => btn.classList.remove("is-animating"), 400);
  });
}

function toggleRepeat() {
  state.repeat = !state.repeat;
  els.repeatButton.classList.toggle("is-active", state.repeat);
}

function toggleFavorite() {
  const current = getCurrentTrack();
  if (!current) return;
  toggleTrackLike(current.id);
}

function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset.theme === "dark";
  root.dataset.theme = dark ? "light" : "dark";
  els.themeToggle.querySelector(".theme-icon").textContent = dark ? "☾" : "☀";
  localStorage.setItem("vibe-player-theme", root.dataset.theme);
}

function loadTheme() {
  const saved = localStorage.getItem("vibe-player-theme");
  const theme = saved === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  els.themeToggle.querySelector(".theme-icon").textContent = theme === "dark" ? "☀" : "☾";
}

function bindEvents() {
  els.categoryCards.forEach(button => {
    button.addEventListener("click", () => setCategory(button.dataset.category));
  });

  els.playButton.addEventListener("click", togglePlay);
  els.mainPlayButton.addEventListener("click", togglePlay);
  els.prevButton.addEventListener("click", () => playRelative(-1));
  els.nextButton.addEventListener("click", playNextTrack);

  els.progressTrack.addEventListener("click", seekFromPointer);
  els.progressTrack.addEventListener("keydown", event => {
    if (!Number.isFinite(audio.duration)) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + direction * 5));
    }
  });

  els.volumeSlider.addEventListener("input", event => setVolume(event.target.value));
  els.muteButton.addEventListener("click", toggleMute);
  els.themeToggle.addEventListener("click", toggleTheme);
  els.shuffleButton.addEventListener("click", toggleShuffle);
  els.shuffleBottom.addEventListener("click", toggleShuffle);
  els.repeatButton.addEventListener("click", toggleRepeat);
  els.favoriteButton.addEventListener("click", toggleFavorite);

  audio.addEventListener("loadedmetadata", () => {
    renderProgress();
    renderTracks();
  });

  audio.addEventListener("timeupdate", renderProgress);

  audio.addEventListener("play", () => {
    state.isPlaying = true;
    renderPlayButtons();
    renderCategories();
    renderTracks();
  });

  audio.addEventListener("pause", () => {
    state.isPlaying = false;
    renderPlayButtons();
    renderCategories();
    renderTracks();
  });

  // При завершении воспроизведения песни
  audio.addEventListener("ended", playNextTrack);

  audio.addEventListener("error", () => {
    state.isPlaying = false;
    renderPlayButtons();
    renderCategories();
  });
}

async function init() {
  loadTheme();
  bindEvents();
  renderVolume();

  try {
    const response = await fetch("./tracks.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    tracks = await response.json();

    renderCounts();
    renderCategories();
    renderHero();
    renderPlayerInfo();
    renderPlayButtons();
    renderTracks();
  } catch (error) {
    console.error("Не удалось загрузить tracks.json:", error);
    els.trackList.innerHTML = `
      <div class="empty-state">
        Не удалось загрузить список треков.<br>
        Запустите проект через локальный сервер (например, VS Code Live Server).
      </div>
    `;
  }
}

init();
