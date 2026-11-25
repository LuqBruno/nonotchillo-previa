const motion = matchMedia("(prefers-reduced-motion: reduce)");
const phone = matchMedia("(max-width: 650px)");
const hero = document.querySelector(".hero");
const scene = hero.querySelector(".hero-scene");
const cloth = scene.querySelector(".table-arrival");
const table = document.querySelector(".table-layout");
const plate = table.querySelector(".plate");
const photos = [...plate.querySelectorAll(".plate-image")];
const rows = [...table.querySelectorAll(".menu-row")];
const nav = [...table.querySelectorAll(".menu-nav a")];
const gallery = document.querySelector(".gallery");
const booking = document.querySelector(".booking");
const quick = document.querySelector(".mobile-cta");

let active = -1;
let frame = 0;
let goal = 0;
let position = 0;
let dirty = true;
let lastTime = 0;
let touch = null;
let sizes;
let still = motion.matches;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function showPhoto(index, animate) {
  if (index === active) return;
  const previous = active;
  active = index;
  photos.forEach((photo, i) => {
    photo.className = "plate-image";
    if (i === previous) photo.classList.add("is-base");
    if (i === index) {
      photo.classList.add("is-front");
      if (animate && previous >= 0) photo.classList.add("is-wiping");
    }
  });
  nav.forEach((link, i) => {
    if (i === index) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function measure() {
  const top = (element) => element.getBoundingClientRect().top + scrollY;
  return {
    heroTop: top(hero),
    heroTravel: Math.max(1, hero.offsetHeight - scene.offsetHeight),
    galleryTop: top(gallery),
    bookingTop: top(booking),
    rowStarts: rows.map(top),
    spread: Math.min(cloth.offsetHeight - 14, phone.matches ? 46 : 122),
  };
}

function render(time) {
  frame = 0;
  if (dirty) {
    sizes = measure();
    dirty = false;
  }
  const y = scrollY;
  const viewport = innerHeight;
  if (!still) {
    goal = clamp((y - sizes.heroTop) / sizes.heroTravel, 0, 1);
    const elapsed = clamp(time - lastTime, 10, 45);
    position += (goal - position) * (1 - Math.exp(-elapsed / 43));
    if (Math.abs(goal - position) < .002) position = goal;
    scene.style.setProperty("--spread", `${sizes.spread * position}px`);
    scene.style.setProperty("--zoom", position.toFixed(3));
    if (goal !== position) queue();

    const marker = y + viewport * (phone.matches ? .55 : .48);
    const next = sizes.rowStarts.reduce((result, start, i) => marker >= start ? i : result, 0);
    showPhoto(next, true);
  }
  quick.hidden = !phone.matches || y < sizes.galleryTop || y + viewport >= sizes.bookingTop;
  lastTime = time;
}

function queue() {
  if (!frame && !document.hidden) frame = requestAnimationFrame(render);
}

function refresh() {
  dirty = true;
  queue();
}

function setMotion() {
  still = motion.matches;
  document.documentElement.classList.toggle("enhanced", !still);
  if (still) {
    scene.style.removeProperty("--spread");
    scene.style.removeProperty("--zoom");
    nav.forEach((link) => link.removeAttribute("aria-current"));
    active = -1;
  }
  refresh();
}

nav.forEach((link, i) => {
  link.addEventListener("click", (event) => {
    if (still || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    rows[i].scrollIntoView({ block: "start", behavior: "smooth" });
  });
});

plate.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch" || event.isPrimary === false) return;
  touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
  plate.setPointerCapture(event.pointerId);
});
plate.addEventListener("pointercancel", () => { touch = null; });
plate.addEventListener("pointerup", (event) => {
  if (!touch || touch.id !== event.pointerId) return;
  const dx = event.clientX - touch.x;
  const dy = event.clientY - touch.y;
  touch = null;
  if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * .65) return;
  const next = clamp(active + (dx < 0 ? 1 : -1), 0, rows.length - 1);
  if (next !== active) rows[next].scrollIntoView({ block: "start", behavior: "smooth" });
});

addEventListener("scroll", queue, { passive: true });
addEventListener("resize", refresh, { passive: true });
addEventListener("pageshow", refresh);
document.addEventListener("visibilitychange", refresh);
document.fonts?.ready.then(refresh);
new ResizeObserver(refresh).observe(document.body);
motion.addEventListener("change", setMotion);
setMotion();
if (!still && scrollY < 32) document.documentElement.classList.add("enter");
