/**
 * Song Drawer / Sheet Component
 * Displays 238+ curated Garba songs with search, category filter pills, step tags, and favorites
 */

export class SongDrawer {
  constructor({ songs, onPlayTrack, getCurrentTrack }) {
    this.songs = songs;
    this.onPlayTrack = onPlayTrack;
    this.getCurrentTrack = getCurrentTrack;

    this.isOpen = false;
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.favorites = new Set(JSON.parse(localStorage.getItem('garba_favorites') || '[]'));

    this.el = null;
    this.build();
  }

  build() {
    this.el = document.createElement('div');
    this.el.className = 'song-sheet';
    this.el.id = 'song-sheet';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-hidden', 'true');

    this.el.innerHTML = `
      <div class="sheet-backdrop"></div>
      <div class="sheet-panel">
        <header class="sheet-header">
          <div class="sheet-title-row">
            <div class="title-wrap">
              <span class="sheet-badge-count" id="sheet-count">238 ગરબા</span>
              <h2 class="sheet-title">ગરબા સંગ્રહ <span class="en-sub">The 200+ Garba Vault</span></h2>
            </div>
            <button class="sheet-close-btn" id="sheet-close" aria-label="Close song vault">✕</button>
          </div>

          <!-- Search Box -->
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="sheet-search" placeholder="Search by song, artist (Atul Purohit, Falguni, Kinjal...), Gujarati name, lyrics or step..." />
            <button id="search-clear" class="search-clear" style="display:none;">✕</button>
          </div>

          <!-- Genre Filter Pills -->
          <div class="filter-pills" id="filter-pills">
            <button class="pill active" data-filter="all">તમામ All (238)</button>
            <button class="pill" data-filter="prachin">પ્રાચીન Prachin (25)</button>
            <button class="pill" data-filter="sanedo">સનેડો Sanedo (22)</button>
            <button class="pill" data-filter="khelaiya">ખેલૈયા Khelaiya (25)</button>
            <button class="pill" data-filter="indipop">ઇન્ડિપોપ Indipop (25)</button>
            <button class="pill" data-filter="filmi">ફિલ્મી Filmi (25)</button>
            <button class="pill" data-filter="fusion">ફ્યુઝન Fusion (25)</button>
            <button class="pill" data-filter="gujpop">ગુજરાતી પોપ GujPop (25)</button>
            <button class="pill" data-filter="techno">ટેક્નો Techno (22)</button>
            <button class="pill" data-filter="titodo">તિટોડો Titodo (22)</button>
            <button class="pill" data-filter="aarti">આરતી Aarti (22)</button>
            <button class="pill pill-fav" data-filter="favorites">♥ Favorites (<span id="fav-count">0</span>)</button>
          </div>
        </header>

        <!-- Song List Container -->
        <div class="sheet-body">
          <ul class="song-list" id="sheet-song-list"></ul>
          <div class="empty-state" id="empty-state" style="display:none;">
            <p>કોઈ ગરબો મળ્યો નથી (No garba matches your search)</p>
            <small>Try searching by artist like "Falguni", "Atul", "Kinjal" or "Sanedo"</small>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);

    // Event Bindings
    this.el.querySelector('.sheet-backdrop').addEventListener('click', () => this.close());
    this.el.querySelector('#sheet-close').addEventListener('click', () => this.close());

    const searchInput = this.el.querySelector('#sheet-search');
    const searchClear = this.el.querySelector('#search-clear');

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      searchClear.style.display = this.searchQuery ? 'block' : 'none';
      this.renderList();
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      searchClear.style.display = 'none';
      this.renderList();
    });

    this.el.querySelectorAll('.pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.el.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.renderList();
      });
    });

    this.updateFavCount();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.el.classList.add('show');
    this.el.setAttribute('aria-hidden', 'false');
    this.updateFavCount();
    this.renderList();
    setTimeout(() => this.el.querySelector('#sheet-search').focus(), 150);
  }

  close() {
    this.isOpen = false;
    this.el.classList.remove('show');
    this.el.setAttribute('aria-hidden', 'true');
  }

  updateFavCount() {
    const fc = this.el.querySelector('#fav-count');
    if (fc) fc.textContent = this.favorites.size;
  }

  toggleFavorite(songId, e) {
    if (e) e.stopPropagation();
    if (this.favorites.has(songId)) {
      this.favorites.delete(songId);
    } else {
      this.favorites.add(songId);
    }
    localStorage.setItem('garba_favorites', JSON.stringify([...this.favorites]));
    this.updateFavCount();
    this.renderList();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  renderList() {
    const listEl = this.el.querySelector('#sheet-song-list');
    const emptyEl = this.el.querySelector('#empty-state');
    const countEl = this.el.querySelector('#sheet-count');
    const currentTrack = this.getCurrentTrack();

    // Filter
    let filtered = this.songs.filter((song) => {
      // Category filter
      if (this.activeFilter === 'favorites') {
        if (!this.favorites.has(song.id)) return false;
      } else if (this.activeFilter !== 'all' && song.genre !== this.activeFilter) {
        return false;
      }

      // Search query
      if (this.searchQuery) {
        const q = this.searchQuery;
        const matchTitle = song.title.toLowerCase().includes(q);
        const matchGuj = song.titleGuj && song.titleGuj.toLowerCase().includes(q);
        const matchArtist = song.artist.toLowerCase().includes(q);
        const matchStep = song.steps && song.steps.toLowerCase().includes(q);
        const matchTala = song.tala && song.tala.toLowerCase().includes(q);
        const matchLyrics = song.lyrics && song.lyrics.toLowerCase().includes(q);
        if (!matchTitle && !matchGuj && !matchArtist && !matchStep && !matchTala && !matchLyrics) {
          return false;
        }
      }
      return true;
    });

    countEl.textContent = `${filtered.length} ગરબા`;
    listEl.innerHTML = '';

    if (filtered.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    filtered.forEach((song, idx) => {
      const isCurrent = currentTrack && currentTrack.id === song.id;
      const isFav = this.favorites.has(song.id);

      const li = document.createElement('li');
      li.className = `song-item ${isCurrent ? 'active' : ''}`;

      li.innerHTML = `
        <div class="song-num">${idx + 1}</div>
        <div class="song-cover-wrap">
          <img class="song-cover" src="${song.cover}" alt="${song.title}" loading="lazy" />
          <button class="song-play-icon" aria-label="Play ${song.title}">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
        <div class="song-details">
          <div class="song-titles">
            <span class="guj-title">${song.titleGuj || song.title}</span>
            <span class="en-title">${song.title}</span>
          </div>
          <div class="song-meta-line">
            <span class="artist-name">${song.artist}</span>
            <span class="dot">•</span>
            <span class="step-badge">${song.steps || 'Garba'}</span>
            <span class="dot">•</span>
            <span class="tala-badge">${song.tala || 'Kaharwa'}</span>
          </div>
          ${song.lyrics ? `<p class="lyrics-snippet">"${song.lyrics.slice(0, 75)}..."</p>` : ''}
        </div>
        <div class="song-actions">
          <span class="duration">${this.formatTime(song.duration)}</span>
          <button class="fav-btn ${isFav ? 'fav-active' : ''}" title="Favorite">
            ${isFav ? '♥' : '♡'}
          </button>
          <a class="yt-out-link" href="https://www.youtube.com/watch?v=${song.id}" target="_blank" rel="noopener" title="Watch on YouTube">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      `;

      // Play row click
      li.addEventListener('click', () => {
        this.onPlayTrack(song);
        this.close();
      });

      // Favorite click
      const favBtn = li.querySelector('.fav-btn');
      favBtn.addEventListener('click', (e) => this.toggleFavorite(song.id, e));

      // Avoid triggering play when clicking external youtube link
      const ytLink = li.querySelector('.yt-out-link');
      ytLink.addEventListener('click', (e) => e.stopPropagation());

      listEl.appendChild(li);
    });
  }
}
