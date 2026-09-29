document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Navbar opacity on scroll ────────────── */

const nav = document.getElementById("nav");

function updateNav() {
  nav.classList.toggle("scrolled", window.scrollY > 20);
}

window.addEventListener("scroll", updateNav, { passive: true });
updateNav();

/* ── Fade in on scroll ───────────────────── */

const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("visible"));
}

/* ── Chaos icons ─────────────────────────── */

const ICON_SIZE = 52;
const MAX_SPEED = 1.6;
const REPEL_RADIUS = 110;
const REPEL_FORCE = 0.9;

const chaos = document.getElementById("chaos");
const iconEls = Array.from(chaos.querySelectorAll(".chaos-icon"));
const mouse = { x: 0, y: 0, active: false };
let bounds = { width: chaos.clientWidth, height: chaos.clientHeight };

function random(min, max) {
  return min + Math.random() * (max - min);
}

const icons = iconEls.map((el) => ({
  el,
  x: random(0, bounds.width - ICON_SIZE),
  y: random(0, bounds.height - ICON_SIZE),
  vx: random(-1, 1),
  vy: random(-1, 1),
  angle: random(-20, 20),
  spin: random(-0.3, 0.3),
  phase: random(0, Math.PI * 2),
}));

function render(icon, time) {
  const scale = 1 + Math.sin(time / 900 + icon.phase) * 0.06;
  icon.el.style.transform = `translate(${icon.x}px, ${icon.y}px) rotate(${icon.angle}deg) scale(${scale})`;
}

function repel(icon) {
  if (!mouse.active) return;
  const dx = icon.x + ICON_SIZE / 2 - mouse.x;
  const dy = icon.y + ICON_SIZE / 2 - mouse.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist > REPEL_RADIUS) return;
  const strength = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
  icon.vx += (dx / dist) * strength;
  icon.vy += (dy / dist) * strength;
}

function bounce(icon) {
  const maxX = bounds.width - ICON_SIZE;
  const maxY = bounds.height - ICON_SIZE;
  if (icon.x < 0 || icon.x > maxX) {
    icon.x = Math.min(Math.max(icon.x, 0), maxX);
    icon.vx *= -1;
    icon.spin *= -1;
  }
  if (icon.y < 0 || icon.y > maxY) {
    icon.y = Math.min(Math.max(icon.y, 0), maxY);
    icon.vy *= -1;
  }
}

function step(icon) {
  repel(icon);

  // Random drift, then ease back toward a calm cruising speed
  icon.vx += random(-0.05, 0.05);
  icon.vy += random(-0.05, 0.05);
  const speed = Math.hypot(icon.vx, icon.vy);
  if (speed > MAX_SPEED) {
    icon.vx *= 0.94;
    icon.vy *= 0.94;
  } else if (speed < 0.3) {
    icon.vx *= 1.1;
    icon.vy *= 1.1;
  }

  icon.x += icon.vx;
  icon.y += icon.vy;
  icon.angle += icon.spin;
  if (Math.abs(icon.angle) > 25) icon.spin *= -1;

  bounce(icon);
}

function animate(time) {
  icons.forEach((icon) => {
    step(icon);
    render(icon, time);
  });
  requestAnimationFrame(animate);
}

chaos.addEventListener("mousemove", (event) => {
  const rect = chaos.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
  mouse.active = true;
});

chaos.addEventListener("mouseleave", () => {
  mouse.active = false;
});

window.addEventListener("resize", () => {
  bounds = { width: chaos.clientWidth, height: chaos.clientHeight };
  icons.forEach(bounce);
});

if (prefersReducedMotion) {
  icons.forEach((icon) => render(icon, 0));
} else {
  requestAnimationFrame(animate);
}

/* ── AI tags demo ────────────────────────── */

const tags = document.querySelectorAll("#ai-tags .tag");

function showTags() {
  tags.forEach((tag, i) => {
    setTimeout(() => tag.classList.add("show"), prefersReducedMotion ? 0 : 400 + i * 220);
  });
}

if ("IntersectionObserver" in window) {
  const tagObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    showTags();
    tagObserver.disconnect();
  }, { threshold: 0.5 });
  tagObserver.observe(document.getElementById("ai-tags"));
} else {
  showTags();
}

/* ── Pricing toggle ──────────────────────── */

const PRICES = {
  monthly: { amount: "$8", per: "/month", note: "Billed monthly. Cancel anytime." },
  yearly: { amount: "$72", per: "/year", note: "Just $6/month, billed yearly." },
};

const billingSwitch = document.getElementById("billing-switch");
const billingOptions = document.querySelectorAll(".billing-option");
const proAmount = document.getElementById("pro-amount");
const proPer = document.getElementById("pro-per");
const proNote = document.getElementById("pro-note");

function setBilling(period) {
  const price = PRICES[period];
  billingSwitch.setAttribute("aria-checked", String(period === "yearly"));
  billingOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.period === period);
  });
  proAmount.textContent = price.amount;
  proPer.textContent = price.per;
  proNote.textContent = price.note;
}

billingSwitch.addEventListener("click", () => {
  const isYearly = billingSwitch.getAttribute("aria-checked") === "true";
  setBilling(isYearly ? "monthly" : "yearly");
});

billingOptions.forEach((option) => {
  option.addEventListener("click", () => setBilling(option.dataset.period));
});

/* ── Footer year ─────────────────────────── */

document.getElementById("year").textContent = new Date().getFullYear();
