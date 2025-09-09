document.addEventListener("DOMContentLoaded", () => {
  // --- GLOBAL STATE & CONSTANTS ---
  const API_KEY = "f95b331e";
  const surpriseMeQueries = [
    "avengers",
    "star wars",
    "matrix",
    "lord of the rings",
    "inception",
    "interstellar",
    "parasite",
    "the godfather",
  ];

  let currentPage = 1;
  let currentSearch = "";
  let totalResults = 0;
  let currentMovies = [];

  // Local storage state
  let favorites = [];
  let recentSearches = [];
  let currentView = "grid"; // 'grid' or 'list'
  let isDarkMode = false;

  // --- DOM ELEMENTS ---
  const elements = {
    loginForm: document.getElementById("loginForm"),
    moviesSection: document.getElementById("moviesSection"),
    logoutBtn: document.getElementById("logoutBtn"),
    favoritesBtn: document.getElementById("favoritesBtn"),
    logo: document.getElementById("logo"),
    searchInput: document.getElementById("searchInput"),
    searchBtn: document.getElementById("searchBtn"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    surpriseBtn: document.getElementById("surpriseBtn"),
    moviesContainer: document.getElementById("moviesContainer"),
    pagination: document.getElementById("pagination"),
    loader: document.getElementById("loader"),
    modal: document.getElementById("modal"),
    modalBody: document.getElementById("modalBody"),
    closeModal: document.getElementById("closeModal"),
    themeCheckbox: document.getElementById("theme-checkbox"),
    viewToggleBtn: document.getElementById("viewToggleBtn"),
    sortOrder: document.getElementById("sortOrder"),
    yearFilter: document.getElementById("yearFilter"),
    typeFilter: document.getElementById("typeFilter"),
    backToTopBtn: document.getElementById("backToTopBtn"),
    contactModal: document.getElementById("contactModal"),
    termsModal: document.getElementById("termsModal"),
    privacyModal: document.getElementById("privacyModal"),
    closeContactModal: document.getElementById("closeContactModal"),
    closeTermsModal: document.getElementById("closeTermsModal"),
    closePrivacyModal: document.getElementById("closePrivacyModal"),
    contactUsLink: document.getElementById("contactUsLink"),
    termsLink: document.getElementById("termsLink"),
    privacyLink: document.getElementById("privacyLink"),
    contactForm: document.getElementById("contactForm"),
  };

  // --- INITIALIZATION ---
  function init() {
    loadTheme();
    loadView();
    loadFavorites();
    loadRecentSearches();
    addEventListeners();

    if (localStorage.getItem("loggedIn")) {
      showMainApp();
    } else {
      showLoginForm();
    }
  }

  // --- EVENT LISTENERS ---
  function addEventListeners() {
    document
      .getElementById("submitLogin")
      .addEventListener("click", handleLogin);
    elements.logoutBtn.addEventListener("click", handleLogout);
    elements.logo.addEventListener("click", () =>
      loadMovies(currentSearch || "movie", 1)
    );
    elements.searchBtn.addEventListener("click", handleSearch);
    elements.searchInput.addEventListener("keyup", (e) => {
      elements.clearSearchBtn.style.display = e.target.value ? "block" : "none";
      if (e.key === "Enter") handleSearch();
    });
    elements.clearSearchBtn.addEventListener("click", clearSearch);
    elements.surpriseBtn.addEventListener("click", handleSurpriseMe);
    elements.pagination.addEventListener("click", handlePagination);
    elements.closeModal.addEventListener(
      "click",
      () => (elements.modal.style.display = "none")
    );
    elements.closeContactModal.addEventListener(
      "click",
      () => (elements.contactModal.style.display = "none")
    );
    elements.closeTermsModal.addEventListener(
      "click",
      () => (elements.termsModal.style.display = "none")
    );
    elements.closePrivacyModal.addEventListener(
      "click",
      () => (elements.privacyModal.style.display = "none")
    );
    window.addEventListener("click", (e) => {
      if (e.target === elements.modal) elements.modal.style.display = "none";
      if (e.target === elements.contactModal)
        elements.contactModal.style.display = "none";
      if (e.target === elements.termsModal)
        elements.termsModal.style.display = "none";
      if (e.target === elements.privacyModal)
        elements.privacyModal.style.display = "none";
    });
    elements.themeCheckbox.addEventListener("change", toggleTheme);
    elements.viewToggleBtn.addEventListener("click", toggleView);
    elements.sortOrder.addEventListener("change", () =>
      renderMovies(currentMovies)
    );
    elements.favoritesBtn.addEventListener("click", displayFavorites);
    window.addEventListener("scroll", handleScroll);
    elements.backToTopBtn.addEventListener("click", scrollToTop);
    elements.contactUsLink.addEventListener(
      "click",
      () => (elements.contactModal.style.display = "block")
    );
    elements.termsLink.addEventListener(
      "click",
      () => (elements.termsModal.style.display = "block")
    );
    elements.privacyLink.addEventListener(
      "click",
      () => (elements.privacyModal.style.display = "block")
    );
    elements.contactForm.addEventListener("submit", handleContactFormSubmit);
  }

  // --- AUTHENTICATION ---
  async function handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const res = await fetch("users.json");
    const users = await res.json();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      localStorage.setItem("loggedIn", "true");
      showMainApp();
    } else {
      document.getElementById("loginError").textContent =
        "Invalid email or password";
    }
  }

  function handleLogout() {
    localStorage.removeItem("loggedIn");
    showLoginForm();
  }

  function showLoginForm() {
    elements.loginForm.style.display = "block";
    elements.moviesSection.style.display = "none";
    elements.logoutBtn.style.display = "none";
    elements.favoritesBtn.style.display = "none";
  }

  function showMainApp() {
    elements.loginForm.style.display = "none";
    elements.moviesSection.style.display = "block";
    elements.logoutBtn.style.display = "inline-block";
    elements.favoritesBtn.style.display = "inline-block";
    if (!currentSearch) {
      loadMovies("movie", 1);
    }
  }

  // --- MOVIE LOADING & RENDERING ---
  function handleSearch() {
    const searchText = elements.searchInput.value.trim();
    if (searchText) {
      addRecentSearch(searchText);
      loadMovies(searchText, 1);
    }
  }

  async function loadMovies(query, page) {
    currentSearch = query;
    currentPage = page;
    elements.loader.style.display = "block";
    elements.moviesContainer.innerHTML = "";
    elements.pagination.innerHTML = "";

    const year = elements.yearFilter.value.trim();
    const type = elements.typeFilter.value;
    let url = `https://www.omdbapi.com/?s=${encodeURIComponent(
      query
    )}&page=${page}&apikey=${API_KEY}`;
    if (year) url += `&y=${year}`;
    if (type) url += `&type=${type}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.Response === "True") {
        totalResults = parseInt(data.totalResults);
        currentMovies = data.Search;
        renderMovies(currentMovies);
        updatePagination();
      } else {
        elements.moviesContainer.innerHTML = `<p>${data.Error}</p>`;
        currentMovies = [];
      }
    } catch (error) {
      elements.moviesContainer.innerHTML =
        "<p>Something went wrong. Please try again later.</p>";
    } finally {
      elements.loader.style.display = "none";
    }
  }

  function renderMovies(movies) {
    elements.moviesContainer.innerHTML = "";
    const moviesWithPosters = movies.filter(
      (movie) =>
        movie.Poster &&
        movie.Poster.trim() !== "" &&
        movie.Poster.toLowerCase() !== "n/a"
    );
    const sortedMovies = sortMovies(moviesWithPosters);
    sortedMovies.forEach((movie) => {
      const isFav = isFavorite(movie.imdbID);
      const card = document.createElement("div");
      card.className = "movie-card";
      card.innerHTML = `
        <img src="${movie.Poster}" alt="${movie.Title}">
        <button class="fav-btn ${isFav ? "favorited" : ""}" data-id="${
        movie.imdbID
      }">♥</button>
        <div class="info">
          <h3>${movie.Title} (${movie.Year})</h3>
          <button class="details-btn" data-id="${
            movie.imdbID
          }">Show Details</button>
        </div>
      `;
      elements.moviesContainer.appendChild(card);
    });

    // Add event listeners to new buttons
    document.querySelectorAll(".details-btn").forEach((btn) => {
      btn.addEventListener("click", () => showDetails(btn.dataset.id));
    });
    document.querySelectorAll(".fav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent modal from opening
        toggleFavorite(btn.dataset.id);
      });
    });
  }

  // --- FEATURES ---
  function sortMovies(movies) {
    const order = elements.sortOrder.value;
    return [...movies].sort((a, b) => {
      switch (order) {
        case "title-asc":
          return a.Title.localeCompare(b.Title);
        case "title-desc":
          return b.Title.localeCompare(a.Title);
        case "year-desc":
          return parseInt(b.Year) - parseInt(a.Year);
        case "year-asc":
          return parseInt(a.Year) - parseInt(b.Year);
        default:
          return 0;
      }
    });
  }

  function handleSurpriseMe() {
    const randomQuery =
      surpriseMeQueries[Math.floor(Math.random() * surpriseMeQueries.length)];
    elements.searchInput.value = randomQuery;
    handleSearch();
  }

  function clearSearch() {
    elements.searchInput.value = "";
    elements.clearSearchBtn.style.display = "none";
  }

  async function showDetails(id) {
    elements.modal.style.display = "block";
    elements.modalBody.innerHTML = '<div class="loader"></div>';
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`
      );
      const movie = await res.json();
      elements.modalBody.innerHTML = `
        <h2>${movie.Title} (${movie.Year})</h2>
        <p><strong>Genre:</strong> ${movie.Genre}</p>
        <p><strong>Director:</strong> ${movie.Director}</p>
        <p><strong>Actors:</strong> ${movie.Actors}</p>
        <p><strong>IMDB Rating:</strong> ${movie.imdbRating}</p>
        <p>${movie.Plot}</p>
        <img src="${
          movie.Poster !== "N/A"
            ? movie.Poster
            : "https://via.placeholder.com/200x300.png?text=No+Image"
        }" style="width:100%;border-radius:10px;">
        <button id="shareBtn" data-id="${movie.imdbID}">Share</button>
      `;
      document.getElementById("shareBtn").addEventListener("click", (e) => {
        navigator.clipboard.writeText(
          `https://www.imdb.com/title/${e.target.dataset.id}/`
        );
        alert("IMDb link copied to clipboard!");
      });
    } catch (error) {
      elements.modalBody.innerHTML = "<p>Could not load movie details.</p>";
    }
  }

  // --- CONTACT FORM ---
  function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    if (!name || !email || !message) {
      alert("Please fill in all fields.");
      return;
    }

    const contactForm = document.getElementById("contactForm");
    const contactModal = document.getElementById("contactModal");

    fetch('https://formspree.io/f/xvgblojz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    })
    .then(() => {
      alert("Message sent successfully!");
      contactModal.style.display = "none";
      contactForm.reset();
    })
    .catch(() => {
      // Fallback to mailto
      const subject = encodeURIComponent(`Contact from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      window.location.href = `mailto:chandan@example.com?subject=${subject}&body=${body}`;
      alert("Opening your email client to send the message.");
      contactModal.style.display = "none";
      contactForm.reset();
    });
  }

  // --- LOCAL STORAGE & PREFERENCES ---
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("light-mode", !isDarkMode);
    saveTheme();
  }

  function saveTheme() {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }
  function loadTheme() {
    isDarkMode = localStorage.getItem("theme") === "dark";
    document.body.classList.toggle("light-mode", !isDarkMode);
    elements.themeCheckbox.checked = isDarkMode;
  }

  function toggleView() {
    currentView = currentView === "grid" ? "list" : "grid";
    elements.moviesContainer.className = `${currentView}-view`;
    elements.viewToggleBtn.textContent =
      currentView === "grid" ? "List View" : "Grid View";
    saveView();
  }

  function saveView() {
    localStorage.setItem("view", currentView);
  }
  function loadView() {
    currentView = localStorage.getItem("view") || "grid";
    toggleView(); // Set initial state
    toggleView(); // Toggle back to set text correctly without changing state
  }

  function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(id);
    }
    saveFavorites();
    renderMovies(currentMovies); // Re-render to update favorite status
  }

  function isFavorite(id) {
    return favorites.includes(id);
  }
  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
  function loadFavorites() {
    favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  }

  async function displayFavorites() {
    elements.moviesContainer.innerHTML = "";
    elements.pagination.innerHTML = "";
    if (favorites.length === 0) {
      elements.moviesContainer.innerHTML =
        "<p>You have no favorite movies yet.</p>";
      return;
    }
    elements.loader.style.display = "block";
    const favoriteMovies = [];
    for (const id of favorites) {
      const res = await fetch(
        `https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`
      );
      const movie = await res.json();
      favoriteMovies.push(movie);
    }
    elements.loader.style.display = "none";
    currentMovies = favoriteMovies;
    renderMovies(favoriteMovies);
  }

  function addRecentSearch(term) {
    if (!term) return;
    // Remove existing entry for this term to move it to the top
    recentSearches = recentSearches.filter((s) => s.term !== term);
    recentSearches.unshift({ term: term, timestamp: Date.now() });
    recentSearches = recentSearches.slice(0, 5); // Keep last 5
    saveRecentSearches();
  }

  function saveRecentSearches() {
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  }
  function loadRecentSearches() {
    recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes in milliseconds
    recentSearches = recentSearches.filter((s) => s.timestamp > fiveMinutesAgo);
    saveRecentSearches(); // Save filtered list back to localStorage
  }

  // --- UTILITY FUNCTIONS ---
  function handlePagination(e) {
    if (e.target.id === "prevBtn") loadMovies(currentSearch, currentPage - 1);
    if (e.target.id === "nextBtn") loadMovies(currentSearch, currentPage + 1);
  }

  function updatePagination() {
    const totalPages = Math.ceil(totalResults / 10);
    elements.pagination.innerHTML = "";
    if (totalPages > 1) {
      let html = "";
      if (currentPage > 1) html += `<button id="prevBtn">Previous</button>`;
      html += `<span>Page ${currentPage} of ${totalPages}</span>`;
      if (currentPage < totalPages)
        html += `<button id="nextBtn">Next</button>`;
      elements.pagination.innerHTML = html;
    }
  }

  function handleScroll() {
    elements.backToTopBtn.style.display =
      window.scrollY > 200 ? "block" : "none";
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- START THE APP ---
  init();
});
