const API = '/api';
const state = { interests: ['Sci-Fi', 'Anime', 'Action'], myList: new Set(), activeView: 'home', movies: [], hero: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

async function api(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function movieCard(movie) {
  const saved = state.myList.has(movie.id);
  const image = escapeHTML(movie.image);
  return `<article class="movie-card" tabindex="0" role="button" aria-label="Details for ${escapeHTML(movie.title)}" data-movie-id="${movie.id}">
    <div class="poster-wrap"><img src="${image}" alt="${escapeHTML(movie.title)} artwork" loading="lazy" onerror="this.style.opacity='.15';this.parentElement.style.background='linear-gradient(135deg,#25243b,#172b39)'"><div class="poster-shade"></div><span class="card-score">★ <b>${movie.rating.toFixed(1)}</b></span><button class="card-action" data-save-id="${movie.id}" aria-label="${saved ? 'Remove from' : 'Add to'} My List">${saved ? '✓' : '+'}</button><span class="card-type">${escapeHTML(movie.type.toUpperCase())}</span></div>
    <div class="movie-title">${escapeHTML(movie.title)}</div><div class="movie-meta"><span>${movie.year}</span><span class="meta-dot"></span><span>${escapeHTML(movie.genres[0] || 'Drama')}</span><span class="genre-pill">${escapeHTML(movie.runtime)}</span></div>
  </article>`;
}
function renderRow(id, movies) { const el = document.getElementById(id); if (!el) return; el.innerHTML = movies.length ? movies.map(movieCard).join('') : '<div class="empty-state">No titles found. Try another genre or search.</div>'; }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200); }
function getMovie(id) { return state.movies.find(movie => movie.id === Number(id)); }
function updateListCount() { $('#list-count').textContent = state.myList.size; }
function setHero(movie) {
  if (!movie) return;
  state.hero = movie;
  $('#hero-title').innerHTML = escapeHTML(movie.title.toUpperCase()).replace(': ', ': <em>') + (movie.title.includes(': ') ? '</em>' : '');
  $('#hero-description').textContent = movie.description;
  $('#hero-rating').textContent = movie.rating.toFixed(1);
  $('#hero').style.background = `radial-gradient(ellipse at 75% 35%, ${movie.accent || '#6b4b47'} 0, #282437 30%, #131a28 65%, #10141e 100%)`;
  const backdrop = $('.hero-backdrop'); backdrop.src = movie.image; backdrop.style.display = '';
  $('#hero-details').dataset.movieId = movie.id; $('#hero-list').dataset.saveId = movie.id;
  $('#hero-list').innerHTML = `<span>${state.myList.has(movie.id) ? '✓' : '＋'}</span> ${state.myList.has(movie.id) ? 'In My List' : 'My List'}`;
}
async function loadHome() {
  try {
    const [all, recs, trending, anime] = await Promise.all([
      api('/movies'), api(`/recommendations?interests=${encodeURIComponent(state.interests.join(','))}&history=&limit=8`), api('/movies?genre=trending'), api('/movies?genre=anime')
    ]);
    state.movies = all.results;
    renderRow('personalized-row', recs.results.slice(0, 4));
    renderRow('trending-row', trending.results.slice(0, 4));
    renderRow('anime-row', anime.results.slice(0, 4));
    setHero(state.movies.find(movie => movie.id === 1) || state.movies[0]);
  } catch (error) {
    console.error(error);
    $$('.movie-row').forEach(row => row.innerHTML = '<div class="empty-state">Could not connect to the NextView API. Start the server with <code>npm start</code>.</div>');
  }
}
function openDetails(movie) {
  if (!movie) return;
  $('#dialog-content').innerHTML = `<div class="detail-hero" style="background-image:url('${escapeHTML(movie.image)}')"></div><div class="detail-body"><div class="section-kicker">${escapeHTML(movie.type.toUpperCase())} · ${movie.year} · ${escapeHTML(movie.runtime)}</div><h2>${escapeHTML(movie.title)}</h2><div class="detail-footer"><span>★ ${movie.rating.toFixed(1)} / 10</span><span>·</span><span>${escapeHTML(movie.genres.join(' / '))}</span></div><p>${escapeHTML(movie.description)}</p><div class="detail-genres">${movie.genres.map(genre => `<span>${escapeHTML(genre)}</span>`).join('')}</div><button class="btn-primary" data-save-id="${movie.id}">${state.myList.has(movie.id) ? '✓ In My List' : '＋ Add to My List'}</button></div>`;
  $('#detail-dialog').showModal();
}
function toggleSaved(id) {
  id = Number(id); const movie = getMovie(id); if (!movie) return;
  if (state.myList.has(id)) { state.myList.delete(id); showToast(`Removed ${movie.title} from My List`); }
  else { state.myList.add(id); showToast(`Added ${movie.title} to My List`); }
  updateListCount();
  // Refresh cards so their saved states stay in sync.
  if (state.activeView === 'mylist') renderView('mylist'); else { renderRow('personalized-row', currentRecommendations); renderRow('trending-row', currentTrending); renderRow('anime-row', currentAnime); }
  if (state.hero?.id === id) $('#hero-list').innerHTML = `<span>${state.myList.has(id) ? '✓' : '＋'}</span> ${state.myList.has(id) ? 'In My List' : 'My List'}`;
  if ($('#detail-dialog').open) openDetails(movie);
}
let currentRecommendations = [], currentTrending = [], currentAnime = [];
async function renderView(view, genre = '') {
  state.activeView = view;
  const label = view === 'mylist' ? 'MY LIST' : view === 'trending' ? 'TRENDING' : view === 'search' ? 'SEARCH' : view === 'personalized' ? 'PICKED FOR YOU' : genre ? genre.toUpperCase() : 'HOME';
  $('#page-label').textContent = label;
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view || (genre && item.dataset.genre === genre)));
  if (view === 'home') { $('#hero').hidden = false; $('#interest-panel').hidden = false; $('#personalized-section').hidden = false; $('#trending-section').hidden = false; $('#anime-section').hidden = false; return; }
  $('#hero').hidden = true; $('#interest-panel').hidden = true; $('#personalized-section').hidden = false; $('#trending-section').hidden = true; $('#anime-section').hidden = true;
  const section = $('#personalized-section'); section.querySelector('.section-kicker').textContent = 'YOUR NEXT WATCH'; section.querySelector('h2').innerHTML = `${escapeHTML(label.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))} <em>collection</em>`;
  let results = [];
  if (view === 'mylist') results = state.movies.filter(movie => state.myList.has(movie.id));
  else if (view === 'trending') results = state.movies.filter(movie => movie.trending);
  else if (view === 'search') {
    section.querySelector('h2').innerHTML = 'Find your <em>next favorite</em>';
    section.querySelector('.section-kicker').innerHTML = '<input id="search-input" placeholder="Search titles, genres, vibes…" aria-label="Search titles" style="width:min(400px,70vw);background:#121824;color:white;border:1px solid #343c50;border-radius:6px;padding:10px;font:inherit;letter-spacing:0">';
    section.querySelector('#search-input').addEventListener('input', e => { const q = e.target.value.toLowerCase(); const matches = state.movies.filter(m => `${m.title} ${m.genres.join(' ')} ${m.description}`.toLowerCase().includes(q)); renderRow('personalized-row', matches); });
    results = state.movies;
  } else if (view === 'personalized') results = currentRecommendations;
  else if (genre) results = state.movies.filter(movie => genre.toLowerCase() === 'trending' ? movie.trending : movie.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
  renderRow('personalized-row', results);
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function personalize() {
  state.interests = $$('.interest-chip.selected').map(button => button.dataset.interest);
  if (!state.interests.length) { showToast('Choose at least one interest first'); return; }
  try {
    const response = await api(`/recommendations?interests=${encodeURIComponent(state.interests.join(','))}&limit=8`);
    currentRecommendations = response.results; renderRow('personalized-row', currentRecommendations.slice(0, 4));
    showToast(`Your picks are tuned for ${state.interests.join(', ')}`);
  } catch { showToast('Could not update recommendations'); }
}

document.addEventListener('click', event => {
  const save = event.target.closest('[data-save-id]');
  if (save) { event.stopPropagation(); toggleSaved(save.dataset.saveId); return; }
  const card = event.target.closest('[data-movie-id]');
  if (card) { openDetails(getMovie(card.dataset.movieId)); return; }
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { renderView(viewButton.dataset.view); return; }
  const genreButton = event.target.closest('[data-genre]');
  if (genreButton) { renderView('genre', genreButton.dataset.genre); }
});
document.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.movie-card')) { event.preventDefault(); openDetails(getMovie(event.target.dataset.movieId)); } });
$('#apply-interests').addEventListener('click', personalize);
$$('.interest-chip').forEach(chip => chip.addEventListener('click', () => chip.classList.toggle('selected')));
$('#dialog-close').addEventListener('click', () => $('#detail-dialog').close());
$('#detail-dialog').addEventListener('click', event => { if (event.target === $('#detail-dialog')) $('#detail-dialog').close(); });
$('#hero-details').addEventListener('click', () => openDetails(getMovie($('#hero-details').dataset.movieId)));
$('#hero-list').addEventListener('click', () => toggleSaved($('#hero-list').dataset.saveId));

(async function init() {
  await loadHome();
  currentRecommendations = (await api(`/recommendations?interests=${encodeURIComponent(state.interests.join(','))}&limit=8`)).results;
  currentTrending = (await api('/movies?genre=trending')).results;
  currentAnime = (await api('/movies?genre=anime')).results;
  renderRow('personalized-row', currentRecommendations.slice(0, 4));
  renderRow('trending-row', currentTrending.slice(0, 4));
  renderRow('anime-row', currentAnime.slice(0, 4));
})();
