/*
 * Portfolio — smooth nav, scroll reveal, active section tracking
 */

(function () {
  var DESKTOP_BP = 993;
  var MOBILE_DOCK_H = 72;
  var DESKTOP_OFFSET = 16;

  var sectionIds = [
    "blueprint",
    "platform-work",
    "proof",
    "experience",
    "principles",
    "skills",
    "earlier-work",
    "contact",
  ];

  function isDesktop() {
    return window.innerWidth >= DESKTOP_BP;
  }

  function scrollOffset() {
    return isDesktop() ? DESKTOP_OFFSET : MOBILE_DOCK_H;
  }

  function scrollToTarget(target) {
    var el = document.querySelector(target);
    if (!el) return;

    var top = el.getBoundingClientRect().top + window.scrollY - scrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });

    if (history.replaceState) {
      history.replaceState(null, "", target);
    }
  }

  function setActiveNav(id) {
    if (!id) return;
    document.querySelectorAll(".site-nav a, .mobile-dock a").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.charAt(0) !== "#") return;
      if (!document.querySelector(href)) return;
      event.preventDefault();
      scrollToTarget(href);
    });
  });

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );
    reveals.forEach(function (section) {
      revealObserver.observe(section);
    });
  } else {
    reveals.forEach(function (section) {
      section.classList.add("is-visible");
    });
  }

  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  function updateActiveFromScroll() {
    var marker = window.scrollY + scrollOffset() + window.innerHeight * 0.25;
    var current = sections[0] ? sections[0].id : null;

    sections.forEach(function (section) {
      if (section.offsetTop <= marker) {
        current = section.id;
      }
    });

    setActiveNav(current);
  }

  var scrollTicking = false;
  document.addEventListener(
    "scroll",
    function () {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        updateActiveFromScroll();
        scrollTicking = false;
      });
    },
    { passive: true, capture: true }
  );

  window.addEventListener("resize", updateActiveFromScroll, { passive: true });
  updateActiveFromScroll();

  var sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    sidebar.addEventListener(
      "wheel",
      function (event) {
        if (!isDesktop()) return;
        window.scrollBy({ top: event.deltaY, left: 0, behavior: "auto" });
        event.preventDefault();
      },
      { passive: false }
    );
  }
})();
