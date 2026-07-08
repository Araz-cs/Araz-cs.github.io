/*
 * Portfolio interactions — smooth nav, scroll reveal, mobile dock
 */

(function () {
  var sectionIds = ["blueprint", "platform-work", "proof", "experience", "principles", "skills", "earlier-work", "contact"];

  function scrollToTarget(target) {
    var el = document.querySelector(target);
    if (!el) return;
    var offset = window.innerWidth <= 992 ? 72 : 24;
    var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: "smooth" });
    if (history.replaceState) {
      history.replaceState(null, "", target);
    }
  }

  function setActiveNav(id) {
    if (!id) return;
    var selector = 'a[href="#' + id + '"]';
    document.querySelectorAll(".site-nav a, .mobile-dock a").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.charAt(0) !== "#") return;
      var target = document.querySelector(href);
      if (!target) return;
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
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
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

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  document.querySelectorAll(".sidebar .main-info *").forEach(function (item) {
    item.classList.add("bs");
  });

  var main = document.querySelector(".main-content");
  if (main) {
    main.classList.add("active");
  }
})();
