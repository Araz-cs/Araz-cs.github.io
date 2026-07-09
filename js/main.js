/*
 * Portfolio — smooth nav, scroll reveal, active section tracking
 */

(function () {
  var DESKTOP_BP = 993;
  var MOBILE_CLEARANCE = 12;
  var DESKTOP_OFFSET = 16;

  var sectionIds = [
    "signal",
    "platform-work",
    "principles",
    "platform",
    "experience",
    "proof",
    "skills",
    "earlier-work",
    "contact",
  ];

  function isDesktop() {
    return window.innerWidth >= DESKTOP_BP;
  }

  function getMobileDockHeight() {
    var dock = document.querySelector(".mobile-dock");
    if (!dock || getComputedStyle(dock).display === "none") return 0;
    return dock.offsetHeight;
  }

  function getSignalHeight() {
    var signal = document.getElementById("signal");
    if (!signal || !isDesktop()) return 0;
    var style = getComputedStyle(signal);
    if (style.position !== "sticky") return 0;
    return signal.offsetHeight;
  }

  function scrollOffset() {
    if (isDesktop()) return getSignalHeight() + DESKTOP_OFFSET;
    return getMobileDockHeight() + MOBILE_CLEARANCE;
  }

  function revealSection(el) {
    if (el) el.classList.add("is-visible");
  }

  function scrollToTarget(target) {
    var el = document.querySelector(target);
    if (!el) return;

    revealSection(el);

    var offset = scrollOffset();
    var top = el.getBoundingClientRect().top + window.scrollY - offset;

    if (!isDesktop()) {
      var doc = document.documentElement;
      var maxScroll = doc.scrollHeight - window.innerHeight;
      top = Math.min(top, maxScroll);
    }

    window.scrollTo({
      top: Math.max(0, top),
      behavior: isDesktop() ? "smooth" : "instant",
    });

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
      if (isDesktop()) {
        revealObserver.observe(section);
      } else {
        section.classList.add("is-visible");
      }
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
    var marker = window.scrollY + scrollOffset() + window.innerHeight * 0.2;
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
