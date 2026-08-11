// ============ STATE ============
let activeCategory = "All";
let searchTerm = "";
let watchlist = JSON.parse(localStorage.getItem("cineverse_watchlist") || "[]");
let heroMovies = MOVIES.filter(m => m.featured);
let heroIndex = 0;
let heroTimer = null;

// ============ DOM REFS ============
const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileNav = document.getElementById("mobileNav");
const mobileNavOverlay = document.getElementById("mobileNavOverlay");
const mobileNavCloseBtn = document.getElementById("mobileNavCloseBtn");
const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");

const searchToggleBtn = document.getElementById("searchToggleBtn");
const searchBar = document.getElementById("searchBar");
const searchInput = document.getElementById("searchInput");
const searchCloseBtn = document.getElementById("searchCloseBtn");

const watchlistBtn = document.getElementById("watchlistBtn");
const watchlistBadge = document.getElementById("watchlistBadge");
const watchlistSection = document.getElementById("watchlistSection");
const watchlistGrid = document.getElementById("watchlistGrid");
const watchlistEmpty = document.getElementById("watchlistEmpty");

const heroBg = document.getElementById("heroBg");
const heroTag = document.getElementById("heroTag");
const heroTitle = document.getElementById("heroTitle");
const heroDesc = document.getElementById("heroDesc");
const heroMeta = document.getElementById("heroMeta");
const heroDots = document.getElementById("heroDots");
const heroDetailsBtn = document.getElementById("heroDetailsBtn");
const heroWatchlistBtn = document.getElementById("heroWatchlistBtn");

const chipRow = document.getElementById("chipRow");
const trendingRow = document.getElementById("trendingRow");
const trendingSkeleton = document.getElementById("trendingSkeleton");

const browseGrid = document.getElementById("browseGrid");
const browseSkeleton = document.getElementById("browseSkeleton");
const browseHeading = document.getElementById("browseHeading");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const modalOverlay = document.getElementById("modalOverlay");
const modal = document.getElementById("modal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalPoster = document.getElementById("modalPoster");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalDesc = document.getElementById("modalDesc");
const modalWatchlistBtn = document.getElementById("modalWatchlistBtn");

let currentModalMovieId = null;

// ============ INIT ============
document.getElementById("year").textContent = new Date().getFullYear();

function init(){
  renderChips();
  initHero();
  updateWatchlistBadge();

  // simulate a brief loading state for a premium feel
  setTimeout(() => {
    trendingSkeleton.remove();
    browseSkeleton.remove();
    renderTrending();
    renderBrowse();
    renderWatchlist();
  }, 600);
}
init();

// ============ HERO ============
function initHero(){
  if (heroMovies.length === 0) heroMovies = MOVIES.slice(0,3);
  renderHero();
  heroDots.innerHTML = heroMovies.map((_,i) =>
    `<span class="dot ${i===0?'active':''}" data-i="${i}"></span>`).join("");
  heroDots.querySelectorAll(".dot").forEach(dot => {
    dot.addEventListener("click", () => { heroIndex = +dot.dataset.i; renderHero(); resetHeroTimer(); });
  });
  resetHeroTimer();
}
function resetHeroTimer(){
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % heroMovies.length;
    renderHero();
  }, 6000);
}
function renderHero(){
  const m = heroMovies[heroIndex];
  heroBg.style.backgroundImage = `url('${m.backdrop}')`;
  heroTag.textContent = "Featured";
  heroTitle.textContent = m.title;
  heroDesc.textContent = m.desc;
  heroMeta.innerHTML = `<span>⭐ ${m.rating}</span><span>${m.year}</span><span>${m.genre}</span><span>${m.duration}</span>`;
  heroDots.querySelectorAll(".dot").forEach((d,i) => d.classList.toggle("active", i===heroIndex));
  heroDetailsBtn.onclick = () => openModal(m.id);
  heroWatchlistBtn.textContent = isInWatchlist(m.id) ? "✓ In Watchlist" : "+ Watchlist";
  heroWatchlistBtn.onclick = () => { toggleWatchlist(m.id); heroWatchlistBtn.textContent = isInWatchlist(m.id) ? "✓ In Watchlist" : "+ Watchlist"; };
}

// ============ CATEGORY CHIPS ============
function renderChips(){
  chipRow.innerHTML = CATEGORIES.map(cat =>
    `<button class="chip ${cat===activeCategory?'active':''}" data-cat="${cat}">${cat}</button>`).join("");
  chipRow.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.cat;
      renderChips();
      renderBrowse();
    });
  });
}

// ============ CARD BUILDER ============
function createCard(movie){
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-poster" style="background-image:url('${movie.poster}')">
      <span class="card-rating">⭐ ${movie.rating}</span>
      <button class="card-heart ${isInWatchlist(movie.id) ? 'active' : ''}" data-id="${movie.id}" aria-label="Toggle watchlist">
        ${isInWatchlist(movie.id) ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="card-body">
      <div class="card-title">${movie.title}</div>
      <div class="card-sub">${movie.genre} · ${movie.year}</div>
    </div>`;
  card.querySelector(".card-poster").addEventListener("click", (e) => {
    if (e.target.closest(".card-heart")) return;
    openModal(movie.id);
  });
  card.querySelector(".card-body").addEventListener("click", () => openModal(movie.id));
  card.querySelector(".card-heart").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleWatchlist(movie.id);
    renderTrending(); renderBrowse(); renderWatchlist();
  });
  return card;
}

// ============ TRENDING ============
function renderTrending(){
  const list = MOVIES.filter(m => m.trending);
  trendingRow.innerHTML = "";
  list.forEach(m => trendingRow.appendChild(createCard(m)));
}

// ============ BROWSE (search + category) ============
function renderBrowse(){
  let list = MOVIES.filter(m => {
    const matchesCategory = activeCategory === "All" || m.genre === activeCategory;
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.genre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  browseHeading.textContent = searchTerm ? `Results for "${searchTerm}"` : (activeCategory === "All" ? "Popular" : activeCategory);
  resultCount.textContent = `${list.length} title${list.length !== 1 ? "s" : ""}`;

  browseGrid.innerHTML = "";
  if (list.length === 0){
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  list.forEach(m => browseGrid.appendChild(createCard(m)));
}

clearFiltersBtn.addEventListener("click", () => {
  activeCategory = "All";
  searchTerm = "";
  searchInput.value = "";
  renderChips();
  renderBrowse();
});

// ============ SEARCH ============
searchToggleBtn.addEventListener("click", () => {
  searchBar.classList.add("open");
  setTimeout(() => searchInput.focus(), 200);
});
searchCloseBtn.addEventListener("click", () => {
  searchBar.classList.remove("open");
});
let searchDebounce;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchTerm = searchInput.value.trim();
    renderBrowse();
    document.getElementById("browse").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 250);
});

// ============ WATCHLIST LOGIC ============
function isInWatchlist(id){ return watchlist.includes(id); }
function toggleWatchlist(id){
  if (isInWatchlist(id)) watchlist = watchlist.filter(x => x !== id);
  else watchlist.push(id);
  localStorage.setItem("cineverse_watchlist", JSON.stringify(watchlist));
  updateWatchlistBadge();
}
function updateWatchlistBadge(){ watchlistBadge.textContent = watchlist.length; }

function renderWatchlist(){
  const items = MOVIES.filter(m => watchlist.includes(m.id));
  watchlistGrid.innerHTML = "";
  if (items.length === 0){
    watchlistEmpty.style.display = "block";
    return;
  }
  watchlistEmpty.style.display = "none";
  items.forEach(m => watchlistGrid.appendChild(createCard(m)));
}

watchlistBtn.addEventListener("click", () => {
  renderWatchlist();
  watchlistSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ============ MODAL ============
function openModal(id){
  const m = MOVIES.find(x => x.id === id);
  if (!m) return;
  currentModalMovieId = id;
  modalPoster.style.backgroundImage = `url('${m.backdrop}')`;
  modalTitle.textContent = m.title;
  modalMeta.innerHTML = `<span>⭐ ${m.rating}</span><span>${m.year}</span><span>${m.genre}</span><span>${m.duration}</span>`;
  modalDesc.textContent = m.desc;
  modalWatchlistBtn.textContent = isInWatchlist(id) ? "✓ In Watchlist" : "+ Add to Watchlist";
  modalOverlay.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeModal(){
  modalOverlay.classList.remove("show");
  document.body.style.overflow = "";
}
modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
modalWatchlistBtn.addEventListener("click", () => {
  toggleWatchlist(currentModalMovieId);
  modalWatchlistBtn.textContent = isInWatchlist(currentModalMovieId) ? "✓ In Watchlist" : "+ Add to Watchlist";
  renderTrending(); renderBrowse(); renderWatchlist();
});

// ============ MOBILE NAV ============
function openMobileNav(){
  mobileNav.classList.add("open");
  mobileNavOverlay.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeMobileNav(){
  mobileNav.classList.remove("open");
  mobileNavOverlay.classList.remove("show");
  document.body.style.overflow = "";
}
hamburgerBtn.addEventListener("click", openMobileNav);
mobileNavCloseBtn.addEventListener("click", closeMobileNav);
mobileNavOverlay.addEventListener("click", closeMobileNav);
mobileNavLinks.forEach(link => link.addEventListener("click", closeMobileNav));
