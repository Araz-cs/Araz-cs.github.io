/*
 * Portfolio interactions — smooth nav + scroll reveal
 */

(function () {
  function scrollToTarget(target) {
    const el = document.querySelector(target);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - 24;
    window.scrollTo({ top, behavior: "smooth" });
    if (history.replaceState) {
      history.replaceState(null, "", target);
    }
  }

  document.querySelectorAll('.site-nav a[href^="#"], a[href="#contact"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      const href = link.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      event.preventDefault();
      scrollToTarget(href);
    });
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (section) {
      observer.observe(section);
    });
  } else {
    reveals.forEach(function (section) {
      section.classList.add("is-visible");
    });
  }

  // Skip legacy sidebar stagger when using upgraded layout
  const sidebarItems = document.querySelectorAll(".sidebar .main-info *");
  sidebarItems.forEach(function (item) {
    item.classList.add("bs");
  });

  const main = document.querySelector(".main-content");
  if (main) {
    main.classList.add("active");
  }
})();
