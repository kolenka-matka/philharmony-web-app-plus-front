const state = {
  events: [],
  filter: { type: "ALL", search: "", date: null, featured: false },
  cart: [],
  bought: [],
  carIndex: 0,
  profile: { name: "Иван Иванов", email: "ivan@mail.ru", phone: "+7 999 111-22-33" }
};

const TYPE_LABEL = {
  CONCERT: "Концерт",
  CINEMA: "Кино",
  THEATER: "Театр",
  STANDUP: "Стендап",
  SPORT: "Спорт",
  MASTERCLASS: "Мастер-класс",
  FESTIVAL: "Фестиваль"
};

const $ = (id) => document.getElementById(id);

function dateLabel(iso) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(iso));
}
function timeLabel(iso) {
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function dayKey(iso) {
  const d = new Date(iso);
  return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
}

function setImage(el, url, label) {
  if (!url) { el.textContent = label; return; }
  const img = new Image();
  img.onload = () => { el.style.backgroundImage = 'url("' + url + '")'; el.textContent = ""; };
  img.onerror = () => { el.textContent = label; };
  img.src = url;
}

function getById(id) {
  return state.events.find((e) => String(e.id) === String(id));
}

function getVisible() {
  return state.events.filter((e) => {
    if (state.filter.featured && !e.featured) return false;
    if (!state.filter.featured && state.filter.type !== "ALL" && e.eventType !== state.filter.type) return false;
    if (state.filter.search && !e.title.toLowerCase().includes(state.filter.search.toLowerCase())) return false;
    if (state.filter.date && dayKey(e.dateTime) !== state.filter.date) return false;
    return true;
  });
}

function renderCarousel() {
  const track = $("car-track");
  let featured = state.events.filter((e) => e.featured);
  if (!featured.length) featured = state.events.slice(0, 5);
  track.innerHTML = featured.map((e) =>
    '<button class="car-card" data-id="' + e.id + '" type="button">' +
      '<div class="ph"></div>' +
      '<div class="car-meta">' +
        '<div class="car-title">' + e.title + '</div>' +
        '<div class="car-sub">' + dateLabel(e.dateTime) + ' · ' + e.hallName + '</div>' +
      '</div>' +
    '</button>'
  ).join("");
  const cards = track.querySelectorAll(".car-card");
  cards.forEach((c, i) => setImage(c.querySelector(".ph"), featured[i].imageUrl, "картинка мероприятия"));
  state.carIndex = 0;
  updateCarousel();
}

function updateCarousel() {
  const track = $("car-track");
  const cards = track.querySelectorAll(".car-card");
  if (!cards.length) return;
  const cardW = cards[0].getBoundingClientRect().width + 18;
  const perView = window.innerWidth > 980 ? 3 : window.innerWidth > 620 ? 2 : 1;
  const maxIndex = Math.max(0, cards.length - perView);
  if (state.carIndex > maxIndex) state.carIndex = maxIndex;
  if (state.carIndex < 0) state.carIndex = 0;
  track.style.transform = "translateX(" + (-state.carIndex * cardW) + "px)";
}

function renderCalendar() {
  const box = $("calendar");
  const dates = state.events.map((e) => new Date(e.dateTime).getTime()).sort((a, b) => a - b);
  const start = new Date(dates[0]);
  start.setHours(0, 0, 0, 0);
  const eventDays = new Set(state.events.map((e) => dayKey(e.dateTime)));
  let html = "";
  let lastMonth = -1;
  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    if (d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      const m = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(d);
      html += '<span class="cal-month">' + m + '</span>';
    }
    const wd = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(d);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const has = eventDays.has(key);
    const selected = state.filter.date === key;
    html += '<button class="cal-day' +
      (weekend ? " weekend" : "") +
      (has ? " has-event" : "") +
      (selected ? " selected" : "") +
      '" data-key="' + key + '" type="button"' + (has ? "" : " disabled") + ">" +
      '<span class="cal-num">' + d.getDate() + "</span>" +
      '<span class="cal-wd">' + wd + "</span>" +
      "</button>";
  }
  box.innerHTML = html;
}

function renderGrid() {
  const grid = $("event-grid");
  const list = getVisible();
  $("empty-state").hidden = list.length > 0;
  grid.innerHTML = list.map((e) =>
    '<button class="card" data-id="' + e.id + '" type="button">' +
      '<div class="ph">картинка мероприятия</div>' +
      '<div class="card-body">' +
        '<div class="card-date">' + dateLabel(e.dateTime) + ', ' + timeLabel(e.dateTime) + '</div>' +
        '<div class="card-title">' + e.title + '</div>' +
        '<div class="card-sub">' + (TYPE_LABEL[e.eventType] || "") +
          (e.genreName ? " · " + e.genreName : "") + " · " + e.hallName + '</div>' +
        '<div class="card-seats">Свободно мест: ' + e.availableSeats + '</div>' +
      '</div>' +
    '</button>'
  ).join("");
  const cards = grid.querySelectorAll(".card");
  cards.forEach((c, i) => setImage(c.querySelector(".ph"), list[i].imageUrl, "картинка мероприятия"));
  renderFilterLabel(list.length);
}

function renderFilterLabel(count) {
  const parts = [];
  if (state.filter.featured) parts.push("Подборки");
  else if (state.filter.type !== "ALL") parts.push(TYPE_LABEL[state.filter.type]);
  if (state.filter.search) parts.push('поиск: «' + state.filter.search + '»');
  if (state.filter.date) {
    const [y, m, day] = state.filter.date.split("-").map(Number);
    parts.push(dateLabel(new Date(y, m, day)));
  }
  $("filter-label").textContent = parts.length ? parts.join(" · ") + " — найдено: " + count : "Всего событий: " + count;
}

function applyFilter() {
  renderCalendar();
  renderGrid();
}

function setCategory(cat) {
  document.querySelectorAll(".cat").forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  state.filter.date = null;
  state.filter.search = "";
  $("search-input").value = "";
  if (cat === "FEATURED") {
    state.filter.featured = true;
    state.filter.type = "ALL";
    $("type-select").value = "ALL";
  } else {
    state.filter.featured = false;
    state.filter.type = cat;
    $("type-select").value = TYPE_LABEL[cat] ? cat : "ALL";
  }
  showView("home");
  applyFilter();
}

function showView(name) {
  $("view-home").hidden = name !== "home";
  $("view-details").hidden = name !== "details";
  $("view-cart").hidden = name !== "cart";
  $("profile-card").hidden = true;
  window.scrollTo(0, 0);
}

function openDetails(e) {
  const box = $("view-details");
  box.innerHTML =
    '<button class="back-btn" id="details-back" type="button">‹ К афише</button>' +
    '<div class="details-hero" id="details-hero">' +
      '<div class="hero-inner">' +
        '<h1 class="hero-title">' + e.title + '</h1>' +
        '<div class="hero-row">' +
          '<button class="hero-buy" id="hero-buy" type="button">Билеты</button>' +
          '<span class="hero-fact">' + dateLabel(e.dateTime) + ', ' + timeLabel(e.dateTime) + '</span>' +
          '<span class="hero-fact">' + e.hallName + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="meta-row">' +
      '<span>Тип: <b>' + (TYPE_LABEL[e.eventType] || "") + '</b></span>' +
      (e.genreName ? '<span>Жанр: <b>' + e.genreName + '</b></span>' : "") +
      '<span>Адрес: <b>' + e.hallAddress + '</b></span>' +
      '<span>Свободно мест: <b>' + e.availableSeats + '</b></span>' +
    '</div>' +
    '<h3 class="details-h3">Описание</h3>' +
    '<p class="details-desc">' + e.description + '</p>';

  const hero = $("details-hero");
  if (e.imageUrl) {
    const img = new Image();
    img.onload = () => { hero.style.backgroundImage = 'url("' + e.imageUrl + '")'; };
    img.onerror = () => { hero.classList.add("no-img"); };
    img.src = e.imageUrl;
  } else {
    hero.classList.add("no-img");
  }

  $("details-back").addEventListener("click", () => showView("home"));
  $("hero-buy").addEventListener("click", () => openModal(e));
  showView("details");
}

function openModal(e) {
  $("modal-title").textContent = e.title + ", " + dateLabel(e.dateTime);
  $("f-seats").value = 1;
  $("f-name").value = state.profile.name;
  $("f-email").value = state.profile.email;
  $("f-phone").value = state.profile.phone;
  $("f-comment").value = "";
  $("modal-error").hidden = true;
  $("modal-overlay").hidden = false;
  $("modal-overlay").dataset.eventId = e.id;
}

function closeModal() {
  $("modal-overlay").hidden = true;
}

function confirmBooking() {
  const e = getById($("modal-overlay").dataset.eventId);
  const name = $("f-name").value.trim();
  const email = $("f-email").value.trim();
  if (!name || !email) {
    $("modal-error").hidden = false;
    return;
  }
  const seats = Math.max(1, parseInt($("f-seats").value, 10) || 1);
  state.cart.push({
    eventId: e.id,
    title: e.title,
    dateTime: e.dateTime,
    hallName: e.hallName,
    seats: seats,
    name: name,
    email: email,
    phone: $("f-phone").value.trim(),
    comment: $("f-comment").value.trim()
  });
  updateBadge();
  closeModal();
  renderCart();
  showView("cart");
}

function renderCart() {
  const active = $("cart-active");
  active.innerHTML = state.cart.map((b, i) =>
    '<div class="cart-item">' +
      '<div>' +
        '<div class="ci-title">' + b.title + '</div>' +
        '<div class="ci-sub">' + dateLabel(b.dateTime) + ', ' + timeLabel(b.dateTime) +
          ' · ' + b.hallName + ' · мест: ' + b.seats + '</div>' +
      '</div>' +
      '<button class="ci-remove" data-i="' + i + '" type="button">Удалить</button>' +
    '</div>'
  ).join("");
  $("cart-active-empty").hidden = state.cart.length > 0;
  $("buy-all").hidden = state.cart.length === 0;

  const bought = $("cart-bought");
  bought.innerHTML = state.bought.map((b) =>
    '<li><span class="bought-badge">Куплено</span> ' + b.title +
    ' — ' + dateLabel(b.dateTime) + ', мест: ' + b.seats + '</li>'
  ).join("");
  $("cart-bought-empty").hidden = state.bought.length > 0;
}

function updateBadge() {
  const badge = $("cart-badge");
  badge.textContent = state.cart.length;
  badge.hidden = state.cart.length === 0;
}

function init() {
  $("pr-name").textContent = state.profile.name;
  $("pr-email").textContent = state.profile.email;
  $("pr-phone").textContent = state.profile.phone;

  $("logo").addEventListener("click", () => {
    state.filter = { type: "ALL", search: "", date: null, featured: false };
    document.querySelectorAll(".cat").forEach((b) => b.classList.remove("active"));
    $("type-select").value = "ALL";
    $("search-input").value = "";
    showView("home");
    applyFilter();
  });

  $("search-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    state.filter.search = $("search-input").value.trim();
    state.filter.featured = false;
    showView("home");
    applyFilter();
  });

  document.querySelectorAll(".cat").forEach((b) =>
    b.addEventListener("click", () => setCategory(b.dataset.cat))
  );

  $("type-select").addEventListener("change", (ev) => {
    state.filter.type = ev.target.value;
    state.filter.featured = false;
    document.querySelectorAll(".cat").forEach((b) =>
      b.classList.toggle("active", b.dataset.cat === ev.target.value));
    applyFilter();
  });

  $("calendar").addEventListener("click", (ev) => {
    const day = ev.target.closest(".cal-day");
    if (!day || day.disabled) return;
    state.filter.date = state.filter.date === day.dataset.key ? null : day.dataset.key;
    applyFilter();
  });

  $("car-prev").addEventListener("click", () => { state.carIndex--; updateCarousel(); });
  $("car-next").addEventListener("click", () => { state.carIndex++; updateCarousel(); });

  $("car-track").addEventListener("click", (ev) => {
    const c = ev.target.closest(".car-card");
    if (c) openDetails(getById(c.dataset.id));
  });

  $("event-grid").addEventListener("click", (ev) => {
    const c = ev.target.closest(".card");
    if (c) openDetails(getById(c.dataset.id));
  });

  $("cart-btn").addEventListener("click", () => { renderCart(); showView("cart"); });
  $("cart-back").addEventListener("click", () => showView("home"));

  $("cart-active").addEventListener("click", (ev) => {
    const b = ev.target.closest(".ci-remove");
    if (!b) return;
    state.cart.splice(Number(b.dataset.i), 1);
    updateBadge();
    renderCart();
  });

  $("buy-all").addEventListener("click", () => {
    state.bought = state.bought.concat(state.cart);
    state.cart = [];
    updateBadge();
    renderCart();
  });

  $("profile-btn").addEventListener("click", (ev) => {
    ev.stopPropagation();
    $("profile-card").hidden = !$("profile-card").hidden;
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".profile-wrap")) $("profile-card").hidden = true;
  });

  $("modal-close").addEventListener("click", closeModal);
  $("modal-confirm").addEventListener("click", confirmBooking);
  $("modal-overlay").addEventListener("click", (ev) => {
    if (ev.target === $("modal-overlay")) closeModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeModal();
  });

  window.addEventListener("resize", updateCarousel);

  fetch("/api/events")
    .then((r) => r.json())
    .then((data) => {
      state.events = data;
      renderCarousel();
      applyFilter();
    })
    .catch(() => {
      $("empty-state").hidden = false;
      $("empty-state").textContent = "Не удалось загрузить события. Откройте страницу через локальный сервер (например, Live Server в VS Code).";
    });
}

init();
