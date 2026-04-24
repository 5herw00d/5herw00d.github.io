// year
document.getElementById('year').textContent = new Date().getFullYear();

// active nav link on scroll — IntersectionObserver is cheaper than scroll math
const links = document.querySelectorAll('.nav__link');
const linkById = new Map(
  [...links].map((a) => [a.getAttribute('href').slice(1), a])
);

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = linkById.get(entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
);

document.querySelectorAll('section[id]').forEach((s) => io.observe(s));
