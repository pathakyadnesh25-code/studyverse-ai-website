
/* =====================================
   STUDYVERSE AI - WEBSITE FUNCTIONALITY
===================================== */

document.addEventListener("DOMContentLoaded", function () {

  // ELEMENTS
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  const loginModal = document.getElementById("loginModal");
  const modalClose = document.getElementById("modalClose");

  const loginButtons = document.querySelectorAll("[data-open-login]");
  const loginForm = document.getElementById("loginForm");

  const courseSearch = document.getElementById("courseSearch");
  const examFilter = document.getElementById("examFilter");

  const courseCards = document.querySelectorAll(".course-card");
  const emptyState = document.getElementById("emptyState");

  const toast = document.getElementById("toast");


  // COPYRIGHT YEAR
  document.getElementById("year").textContent =
    new Date().getFullYear();


  // NOTIFICATION SYSTEM
  let toastTimeout;

  function showToast(message) {

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(function () {
      toast.classList.remove("show");
    }, 3000);
  }


  // MOBILE NAVIGATION
  if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", function () {

      const isOpen = navLinks.classList.toggle("open");

      menuToggle.setAttribute("aria-expanded", String(isOpen));

    });

    navLinks.querySelectorAll("a").forEach(function (link) {

      link.addEventListener("click", function () {

        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");

      });

    });

  }


  // LOGIN MODAL
  function openLogin() {

    loginModal.classList.add("show");
    loginModal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    const emailInput = document.getElementById("studentEmail");

    setTimeout(function () {
      emailInput.focus();
    }, 100);

  }


  function closeLogin() {

    loginModal.classList.remove("show");
    loginModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");

  }


  loginButtons.forEach(function (button) {

    button.addEventListener("click", openLogin);

  });


  modalClose.addEventListener("click", closeLogin);


  loginModal.addEventListener("click", function (event) {

    if (event.target === loginModal) {
      closeLogin();
    }

  });


  document.addEventListener("keydown", function (event) {

    if (event.key === "Escape" && loginModal.classList.contains("show")) {
      closeLogin();
    }

  });


  // DEMO LOGIN FORM
  if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

      event.preventDefault();

      const email = document.getElementById("studentEmail").value.trim();

      const exam = document.getElementById("studentExam").value;

      if (!email || !exam) {

        showToast("Please enter your email and select your examination.");

        return;

      }

      showToast("Demo only! Student registration will be activated soon.");

      loginForm.reset();

      setTimeout(closeLogin, 1500);

    });

  }


  // COURSE SEARCH AND FILTER
  function filterCourses() {

    const searchText = courseSearch.value.toLowerCase().trim();

    const selectedExam = examFilter.value.toLowerCase();

    let visibleCount = 0;

    courseCards.forEach(function (card) {

      const searchData =
        card.dataset.search.toLowerCase() + " " +
        card.textContent.toLowerCase();

      const examData = card.dataset.exam.toLowerCase();

      const matchesSearch = searchData.includes(searchText);

      const matchesExam =
        selectedExam === "all" ||
        examData.split(" ").includes(selectedExam);

      if (matchesSearch && matchesExam) {

        card.style.display = "";

        visibleCount++;

      } else {

        card.style.display = "none";

      }

    });

    emptyState.hidden = visibleCount !== 0;

  }


  if (courseSearch) {

    courseSearch.addEventListener("input", filterCourses);

  }


  if (examFilter) {

    examFilter.addEventListener("change", filterCourses);

  }


  // EXAMINATION AND SUBJECT SELECTION
  document.querySelectorAll("[data-exam]").forEach(function (button) {

    button.addEventListener("click", function () {

      const selected = button.dataset.exam;

      showToast(selected + " learning library will be available soon.");

    });

  });


  // SMOOTH NAVIGATION FOR INTERNAL LINKS
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {

    link.addEventListener("click", function (event) {

      const targetId = link.getAttribute("href");

      if (targetId === "#") {

        event.preventDefault();

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }

    });

  });


  // INITIAL MESSAGE IN CONSOLE
  console.log("STUDYVERSE AI: Website initialized successfully!");

});
