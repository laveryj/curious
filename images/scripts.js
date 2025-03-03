document.addEventListener("DOMContentLoaded", function () {
  var sections = ["features", "footer", "contact", "pricing", "header", "hero", "about1", "about2", "about3", "about4", "about5", "screenshots", "testemonials", "callToAction", "blog", "clients", "faq", "howItWorks"];
  sections.forEach(function (section) {
    fetch("../partials/section-".concat(section, ".html")).then(function (response) {
      return response.text();
    }).then(function (html) {
      document.getElementById("import-partial-".concat(section)).innerHTML = html;
    })["catch"](function (error) {
      return console.error("Error loading ".concat(section, ":"), error);
    });
  });
});

// ==== pricing plan toggler
var togglePlan = document.querySelector("#togglePlan");
var toggle = document.getElementById("togglePlan");
document.querySelector(".monthly").addEventListener("click", function () {
  togglePlan.checked = true;
});
document.querySelector(".yearly").addEventListener("click", function () {
  togglePlan.checked = false;
});
toggle.addEventListener("change", function () {
  document.querySelectorAll(".price-monthly, .monthly-label").forEach(function (el) {
    return el.classList.toggle("hidden");
  });
  document.querySelectorAll(".price-annual, .annual-label").forEach(function (el) {
    return el.classList.toggle("hidden");
  });
});

// ==== for menu scroll
var pageLink = document.querySelectorAll(".menu-scroll");
pageLink.forEach(function (elem) {
  elem.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(elem.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
      offsetTop: 1 - 60
    });
  });
});

// section menu active
function onScroll(event) {
  var sections = document.querySelectorAll(".menu-scroll");
  var scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  for (var i = 0; i < sections.length; i++) {
    var currLink = sections[i];
    var val = currLink.getAttribute("href");
    var refElement = document.querySelector(val);
    var scrollTopMinus = scrollPos + 73;
    if (refElement.offsetTop <= scrollTopMinus && refElement.offsetTop + refElement.offsetHeight > scrollTopMinus) {
      document.querySelector(".menu-scroll").classList.remove("active");
      currLink.classList.add("active");
    } else {
      currLink.classList.remove("active");
    }
  }
}
window.document.addEventListener("scroll", onScroll);
document.addEventListener("DOMContentLoaded", function () {
  var faqButtons = document.querySelectorAll(".faq-btn");
  faqButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var content = this.nextElementSibling;
      var icon = this.querySelector(".faq-icon");

      // Toggle the FAQ content
      content.classList.toggle("hidden");

      // Toggle icon between + and -
      icon.textContent = content.classList.contains("hidden") ? "+" : "−";

      // Set aria-expanded for accessibility
      var isExpanded = content.classList.contains("hidden") ? "false" : "true";
      this.setAttribute("aria-expanded", isExpanded);
    });
  });
});