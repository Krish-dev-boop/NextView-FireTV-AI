const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Demo catalog. Replace image URLs and metadata with a licensed content provider in production.
const movies = [
  { id: 1, title: 'Dune: Part Two', year: 2024, rating: 8.5, genres: ['Sci-Fi', 'Action', 'Adventure'], type: 'Movie', runtime: '2h 46m', description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', image: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', accent: '#d9a66b', trending: true },
  { id: 2, title: 'Spider-Man: Across the Spider-Verse', year: 2023, rating: 8.6, genres: ['Action', 'Animation', 'Adventure'], type: 'Movie', runtime: '2h 20m', description: 'Miles Morales swings into the multiverse and meets a team of Spider-People protecting its existence.', image: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj urg9.jpg'.replace(' ', ''), accent: '#ec4268', trending: true },
  { id: 3, title: 'Frieren: Beyond Journey’s End', year: 2023, rating: 9.3, genres: ['Anime', 'Fantasy', 'Adventure'], type: 'Series', runtime: '28 episodes', description: 'An elven mage begins to understand friendship, time, and loss after the hero’s journey has ended.', image: 'https://image.tmdb.org/t/p/w780/8v3Sqv9UcIUC4ebmpKWROqPBINZ.jpg', accent: '#6ca9b8', trending: true },
  { id: 4, title: 'The Batman', year: 2022, rating: 7.8, genres: ['Action', 'Crime', 'Thriller'], type: 'Movie', runtime: '2h 56m', description: 'Batman investigates corruption in Gotham while pursuing a mysterious serial killer.', image: 'https://image.tmdb.org/t/p/w780/74xTEgt7R36Fpooo50r9T25onhq.jpg', accent: '#54718a', trending: false },
  { id: 5, title: 'Interstellar', year: 2014, rating: 8.7, genres: ['Sci-Fi', 'Drama', 'Adventure'], type: 'Movie', runtime: '2h 49m', description: 'A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.', image: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6Mxfm8gL8.jpg', accent: '#bb9a75', trending: false },
  { id: 6, title: 'Spy x Family', year: 2022, rating: 8.3, genres: ['Anime', 'Comedy', 'Action'], type: 'Series', runtime: '37 episodes', description: 'A spy, an assassin, and a telepath form a fake family with secrets of their own.', image: 'https://image.tmdb.org/t/p/w780/3r4LYFuXrg3G8fepysr4xSLWnQL.jpg', accent: '#82a875', trending: true },
  { id: 7, title: 'The Grand Budapest Hotel', year: 2014, rating: 8.1, genres: ['Comedy', 'Adventure', 'Drama'], type: 'Movie', runtime: '1h 39m', description: 'A legendary concierge and his protégé become entangled in a theft and a family fortune.', image: 'https://image.tmdb.org/t/p/w780/eWdyYQreja6JGCzqHwylwZ5e9q.jpg', accent: '#df8da8', trending: false },
  { id: 8, title: 'Arcane', year: 2021, rating: 9.0, genres: ['Animation', 'Action', 'Sci-Fi'], type: 'Series', runtime: '18 episodes', description: 'Two sisters find themselves on opposing sides of a conflict between a wealthy city and its undercity.', image: 'https://image.tmdb.org/t/p/w780/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg', accent: '#a68bdf', trending: true },
  { id: 9, title: 'Your Name.', year: 2016, rating: 8.4, genres: ['Anime', 'Romance', 'Fantasy'], type: 'Movie', runtime: '1h 46m', description: 'Two teenagers mysteriously begin switching bodies and searching for each other across time and distance.', image: 'https://image.tmdb.org/t/p/w780/q719jXXEzOoYaps6judu差oG2VY.jpg'.replace('差',''), accent: '#719cc9', trending: false },
  { id: 10, title: 'Top Gun: Maverick', year: 2022, rating: 8.2, genres: ['Action', 'Drama'], type: 'Movie', runtime: '2h 10m', description: 'Maverick trains a new generation of pilots for a dangerous, specialized mission.', image: 'https://image.tmdb.org/t/p/w780/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', accent: '#d9a76b', trending: true },
  { id: 11, title: 'The Good Place', year: 2016, rating: 8.2, genres: ['Comedy', 'Fantasy'], type: 'Series', runtime: '53 episodes', description: 'A woman finds herself in the afterlife and tries to become a better person.', image: 'https://image.tmdb.org/t/p/w780/qIhsuhoIhH5K4wQ9JxQ2h2z5K9A.jpg', accent: '#76b7a5', trending: false },
  { id: 12, title: 'Blue Lock', year: 2022, rating: 8.1, genres: ['Anime', 'Sports', 'Drama'], type: 'Series', runtime: '38 episodes', description: 'Young strikers compete in an intense program designed to create Japan’s ultimate forward.', image: 'https://image.tmdb.org/t/p/w780/6LwHoX7E8v8V4l6FQXKQ2x7QKx.jpg', accent: '#5594d8', trending: false }
];

const categories = ['Trending', 'Action', 'Sci-Fi', 'Comedy', 'Anime', 'Adventure', 'Romance', 'Animation'];
function scoreMovie(movie, interests = [], history = []) {
  const normalized = interests.map(x => String(x).toLowerCase());
  const watched = new Set(history.map(Number));
  let score = movie.rating * 2 + (movie.trending ? 1.5 : 0);
  score += movie.genres.reduce((sum, genre) => sum + (normalized.includes(genre.toLowerCase()) ? 4 : 0), 0);
  if (watched.has(movie.id)) score -= 100; // Don't recommend titles already watched.
  return score;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'NextView API' }));
app.get('/api/movies', (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  const genre = String(req.query.genre || '').toLowerCase();
  let result = movies.filter(m => (!q || `${m.title} ${m.description} ${m.genres.join(' ')}`.toLowerCase().includes(q)) && (!genre || genre === 'all' || (genre === 'trending' ? m.trending : m.genres.some(g => g.toLowerCase() === genre))));
  res.json({ count: result.length, results: result });
});
app.get('/api/categories', (_req, res) => res.json({ categories }));
app.get('/api/recommendations', (req, res) => {
  const interests = String(req.query.interests || 'Sci-Fi,Anime,Action').split(',').map(x => x.trim()).filter(Boolean);
  const history = String(req.query.history || '').split(',').filter(Boolean);
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
  const results = [...movies].sort((a, b) => scoreMovie(b, interests, history) - scoreMovie(a, interests, history)).filter(m => scoreMovie(m, interests, history) > -50).slice(0, limit);
  res.json({ interests, count: results.length, results });
});
app.get('/api/movies/:id', (req, res) => {
  const movie = movies.find(m => m.id === Number(req.params.id));
  if (!movie) return res.status(404).json({ error: 'Title not found' });
  res.json(movie);
});

// Frontend fallback for direct browser navigation.
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.listen(PORT, () => console.log(`NextView running at http://localhost:${PORT}`));
