
/* =========================================================
   STUDYVERSE AI — MAIN WEBSITE ENGINE
   Complete replacement | Version 7.0
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  /* -------------------------------------------------------
     1. SUPABASE CONFIGURATION
  ------------------------------------------------------- */

  const SUPABASE_URL = "https://mtxkvupfczhglaqghcbc.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

  let supabaseClient = null;
  let currentStudent = null;
  let isRegisterMode = false;
  let selectedExam = null;
  let selectedSubject = null;
  let studySeconds = 0;
  let studyTimer = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const elements = {
    menuToggle: $("#menuToggle"),
    navLinks: $("#navLinks"),
    loginBtn: $("#loginBtn"),
    getStartedBtn: $("#getStartedBtn"),
    profileBtn: $("#profileBtn"),
    logoutBtn: $("#logoutBtn"),
    ctaLogin: $("#ctaLogin"),

    loginModal: $("#loginModal"),
    modalClose: $("#modalClose"),
    loginForm: $("#loginForm"),
    loginTitle: $("#loginTitle"),
    authModeText: $("#authModeText"),
    authSubmitBtn: $("#authSubmitBtn"),
    authMessage: $("#authMessage"),
    authSwitchBtn: $("#authSwitchBtn"),
    authSwitchLabel: $("#authSwitchLabel"),

    nameFieldGroup: $("#nameFieldGroup"),
    targetExamGroup: $("#targetExamGroup"),
    academicLevelGroup: $("#academicLevelGroup"),
    preferredLanguageGroup: $("#preferredLanguageGroup"),
    confirmPasswordGroup: $("#confirmPasswordGroup"),

    studentName: $("#studentName"),
    studentEmail: $("#studentEmail"),
    studentPassword: $("#studentPassword"),
    confirmPassword: $("#confirmPassword"),
    targetExam: $("#targetExam"),
    academicLevel: $("#academicLevel"),
    preferredLanguage: $("#preferredLanguage"),

    profileModal: $("#profileModal"),
    profileModalClose: $("#profileModalClose"),
    profileStudentName: $("#profileStudentName"),
    profileStudentEmail: $("#profileStudentEmail"),
    profileAccountStatus: $("#profileAccountStatus"),
    profileCreatedAt: $("#profileCreatedAt"),
    profileDashboardBtn: $("#profileDashboardBtn"),

    examLoading: $("#sv-exam-loading"),
    examCards: $("#sv-exam-cards"),
    selectedExam: $("#sv-selected-exam"),
    subjectCards: $("#sv-subject-cards"),
    selectedSubject: $("#sv-selected-subject"),
    chapterCards: $("#sv-chapter-cards"),
    dashboardMessage: $("#sv-dashboard-message"),

    homeClock: $("#sv-home-clock"),
    homeDate: $("#sv-home-date"),
    homeStudyTime: $("#sv-home-study-time"),

    courseSearch: $("#courseSearch"),
    courseGrid: $("#courseGrid"),
    emptyState: $("#emptyState"),
    year: $("#year"),
    toast: $("#toast")
  };

  /* -------------------------------------------------------
     2. GENERAL HELPERS
  ------------------------------------------------------- */

  function log(...args) {
    console.log("STUDYVERSE AI:", ...args);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function showToast(message) {
    if (!elements.toast) return;

    elements.toast.textContent = message;
    elements.toast.classList.add("show");

    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
      elements.toast.classList.remove("show");
    }, 3200);
  }

  function setAuthMessage(message, success = false) {
    if (!elements.authMessage) return;

    elements.authMessage.textContent = message;
    elements.authMessage.classList.toggle("success", success);
  }

  function showModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function hideModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes} min`;
    return `${seconds} sec`;
  }

  /* -------------------------------------------------------
     3. INDIA CLOCK
  ------------------------------------------------------- */

  function updateClock() {
    const now = new Date();

    if (elements.homeClock) {
      elements.homeClock.textContent = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(now);
    }

    if (elements.homeDate) {
      elements.homeDate.textContent = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(now);
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  if (elements.year) {
    elements.year.textContent = new Date().getFullYear();
  }

  /* -------------------------------------------------------
     4. DAILY STUDY TIMER
     Browser-local timer; not a Supabase-synced statistic.
  ------------------------------------------------------- */

  function getTodayKey() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata"
    }).format(new Date());
  }

  function loadStudyTime() {
    const key = `sv-study-${getTodayKey()}`;
    const saved = Number(localStorage.getItem(key) || 0);

    studySeconds = Number.isFinite(saved) ? saved : 0;
    updateStudyTimeDisplay();
  }

  function updateStudyTimeDisplay() {
    if (elements.homeStudyTime) {
      elements.homeStudyTime.textContent = formatDuration(studySeconds);
    }
  }

  function saveStudyTime() {
    const key = `sv-study-${getTodayKey()}`;
    localStorage.setItem(key, String(studySeconds));
    updateStudyTimeDisplay();
  }

  function startStudyTimer() {
    if (studyTimer) return;

    studyTimer = setInterval(() => {
      studySeconds++;
      saveStudyTime();
    }, 1000);
  }

  function stopStudyTimer() {
    if (studyTimer) {
      clearInterval(studyTimer);
      studyTimer = null;
      saveStudyTime();
    }
  }

  loadStudyTime();
  startStudyTimer();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopStudyTimer();
    } else {
      loadStudyTime();
      startStudyTimer();
    }
  });

  window.addEventListener("beforeunload", saveStudyTime);

  /* -------------------------------------------------------
     5. SUPABASE INITIALIZATION
  ------------------------------------------------------- */

  function initializeSupabase() {
    if (!window.supabase || !window.supabase.createClient) {
      log("ERROR: Supabase library could not be loaded.");
      if (elements.examLoading) {
        elements.examLoading.textContent =
          "Unable to load the Supabase library. Please refresh the page.";
      }
      return false;
    }

    try {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

      window.studyverseSupabase = supabaseClient;

      log("Supabase client initialized.");
      return true;
    } catch (error) {
      log("Supabase initialization error:", error);
      return false;
    }
  }

  /* -------------------------------------------------------
     6. MOBILE NAVIGATION
  ------------------------------------------------------- */

  if (elements.menuToggle && elements.navLinks) {
    elements.menuToggle.addEventListener("click", () => {
      const opened = elements.navLinks.classList.toggle("open");

      elements.menuToggle.setAttribute(
        "aria-expanded",
        String(opened)
      );

      elements.menuToggle.textContent = opened ? "✕" : "☰";
    });

    $$("#navLinks a").forEach(link => {
      link.addEventListener("click", () => {
        elements.navLinks.classList.remove("open");
        elements.menuToggle.setAttribute("aria-expanded", "false");
        elements.menuToggle.textContent = "☰";
      });
    });
  }

  /* -------------------------------------------------------
     7. LOGIN / REGISTRATION MODAL
  ------------------------------------------------------- */

  function openLoginModal() {
    isRegisterMode = false;
    updateAuthMode();
    setAuthMessage("");
    showModal(elements.loginModal);
  }

  function updateAuthMode() {
    if (!elements.loginModal) return;

    const groups = [
      elements.nameFieldGroup,
      elements.targetExamGroup,
      elements.academicLevelGroup,
      elements.preferredLanguageGroup,
      elements.confirmPasswordGroup
    ];

    groups.forEach(group => {
      if (group) group.hidden = !isRegisterMode;
    });

    if (elements.loginTitle) {
      elements.loginTitle.textContent = isRegisterMode
        ? "Create Your Account"
        : "Welcome, Learner!";
    }

    if (elements.authModeText) {
      elements.authModeText.textContent = isRegisterMode
        ? "Join STUDYVERSE AI and begin your learning journey."
        : "Sign in to continue your learning journey.";
    }

    if (elements.authSubmitBtn) {
      elements.authSubmitBtn.textContent = isRegisterMode
        ? "Create Account →"
        : "Log in →";
    }

    if (elements.authSwitchLabel) {
      elements.authSwitchLabel.textContent = isRegisterMode
        ? "Already have an account?"
        : "New to STUDYVERSE AI?";
    }

    if (elements.authSwitchBtn) {
      elements.authSwitchBtn.textContent = isRegisterMode
        ? "Log in"
        : "Create an account";
    }

    if (elements.studentPassword) {
      elements.studentPassword.autocomplete = isRegisterMode
        ? "new-password"
        : "current-password";
    }
  }

  function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    updateAuthMode();
    setAuthMessage("");
  }

  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", openLoginModal);
  }

  if (elements.getStartedBtn) {
    elements.getStartedBtn.addEventListener("click", () => {
      // This link intentionally navigates to the examination section.
    });
  }

  if (elements.ctaLogin) {
    elements.ctaLogin.addEventListener("click", openLoginModal);
  }

  if (elements.authSwitchBtn) {
    elements.authSwitchBtn.addEventListener("click", toggleAuthMode);
  }

  if (elements.modalClose) {
    elements.modalClose.addEventListener("click", () => {
      hideModal(elements.loginModal);
    });
  }

  if (elements.profileModalClose) {
    elements.profileModalClose.addEventListener("click", () => {
      hideModal(elements.profileModal);
    });
  }

  [elements.loginModal, elements.profileModal].forEach(modal => {
    if (!modal) return;

    modal.addEventListener("click", event => {
      if (event.target === modal) {
        hideModal(modal);
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      hideModal(elements.loginModal);
      hideModal(elements.profileModal);
    }
  });

  /* -------------------------------------------------------
     8. AUTHENTICATION UI
  ------------------------------------------------------- */

  function updateAuthenticationUI(user) {
    currentStudent = user || null;

    const loggedIn = Boolean(currentStudent);

    $$(".student-only").forEach(element => {
      element.hidden = !loggedIn;
    });

    $$(".guest-only").forEach(element => {
      element.hidden = loggedIn;
    });

    if (elements.loginBtn) {
      elements.loginBtn.hidden = loggedIn;
    }

    if (loggedIn) {
      const metadata = currentStudent.user_metadata || {};

      if (elements.profileStudentName) {
        elements.profileStudentName.textContent =
          metadata.full_name || "Student";
      }

      if (elements.profileStudentEmail) {
        elements.profileStudentEmail.textContent =
          currentStudent.email || "Not available";
      }

      if (elements.profileAccountStatus) {
        elements.profileAccountStatus.textContent =
          currentStudent.email_confirmed_at
            ? "Verified"
            : "Email confirmation pending";
      }

      if (elements.profileCreatedAt) {
        elements.profileCreatedAt.textContent =
          currentStudent.created_at
            ? new Date(currentStudent.created_at).toLocaleDateString("en-IN")
            : "Not available";
      }

      log("Student session active:", currentStudent.email);
    } else {
      log("No active student session.");
    }
  }

  /* -------------------------------------------------------
     9. PROFILE AND LOGOUT
  ------------------------------------------------------- */

  if (elements.profileBtn) {
    elements.profileBtn.addEventListener("click", () => {
      if (!currentStudent) {
        openLoginModal();
        return;
      }

      showModal(elements.profileModal);
    });
  }

  if (elements.profileDashboardBtn) {
    elements.profileDashboardBtn.addEventListener("click", () => {
      window.location.href = "./student-dashboard.html";
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", async () => {
      if (!supabaseClient) return;

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        showToast(error.message);
        return;
      }

      updateAuthenticationUI(null);
      showToast("You have been logged out.");
    });
  }

  /* -------------------------------------------------------
     10. LOGIN AND REGISTRATION SUBMISSION
  ------------------------------------------------------- */

  if (elements.loginForm) {
    elements.loginForm.addEventListener("submit", async event => {
      event.preventDefault();

      if (!supabaseClient) {
        setAuthMessage("Supabase connection is unavailable.");
        return;
      }

      const email = elements.studentEmail.value.trim();
      const password = elements.studentPassword.value;

      if (!email || !password) {
        setAuthMessage("Please enter your email and password.");
        return;
      }

      const originalText = elements.authSubmitBtn.textContent;
      elements.authSubmitBtn.disabled = true;
      elements.authSubmitBtn.textContent = "Please wait...";

      try {
        let result;

        if (isRegisterMode) {
          const fullName = elements.studentName.value.trim();
          const targetExam = elements.targetExam.value;
          const academicLevel = elements.academicLevel.value;
          const preferredLanguage = elements.preferredLanguage.value;
          const confirmPassword = elements.confirmPassword.value;

          if (!fullName) {
            throw new Error("Please enter your full name.");
          }

          if (!targetExam || !academicLevel || !preferredLanguage) {
            throw new Error("Please complete all student details.");
          }

          if (password.length < 6) {
            throw new Error("Password must contain at least 6 characters.");
          }

          if (password !== confirmPassword) {
            throw new Error("Your passwords do not match.");
          }

          result = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                target_exam: targetExam,
                academic_level: academicLevel,
                preferred_language: preferredLanguage
              }
            }
          });

          if (result.error) throw result.error;

          if (result.data.session) {
            updateAuthenticationUI(result.data.user);
            hideModal(elements.loginModal);
            elements.loginForm.reset();
            showToast("Your account has been created successfully!");
          } else {
            setAuthMessage(
              "Registration successful! Please check your email to confirm your account.",
              true
            );
          }
        } else {
          result = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

          if (result.error) throw result.error;

          updateAuthenticationUI(result.data.user);
          hideModal(elements.loginModal);
          elements.loginForm.reset();
          showToast("Welcome back to STUDYVERSE AI!");
        }
      } catch (error) {
        console.error("STUDYVERSE AUTH ERROR:", error);
        setAuthMessage(error.message || "Authentication failed. Please try again.");
      } finally {
        elements.authSubmitBtn.disabled = false;
        elements.authSubmitBtn.textContent = originalText;
      }
    });
  }

  /* -------------------------------------------------------
     11. SUPABASE CONNECTION TEST
  ------------------------------------------------------- */

  async function testDatabaseConnection() {
    if (!supabaseClient) return false;

    try {
      const { error } = await supabaseClient
        .from("exams")
        .select("id")
        .limit(1);

      if (error) throw error;

      log("Database connection successful!");
      return true;
    } catch (error) {
      log("Database connection error:", error.message);

      if (elements.examLoading) {
        elements.examLoading.textContent =
          "Unable to load examinations. Please check the database connection and permissions.";
      }

      return false;
    }
  }

  /* -------------------------------------------------------
     12. LOAD EXAMINATIONS
  ------------------------------------------------------- */

  let availableExams = [];

  async function loadExaminations() {
    if (!supabaseClient) return;

    if (elements.examLoading) {
      elements.examLoading.textContent = "Loading examinations...";
    }

    try {
      const { data, error } = await supabaseClient
        .from("exams")
        .select("id,name,slug,description,is_published")
        .eq("is_published", true);

      if (error) throw error;

      availableExams = data || [];

      if (elements.examLoading) {
        elements.examLoading.textContent = availableExams.length
          ? "Choose an examination to begin."
          : "No published examinations are available yet.";
      }

      log("Available examinations:", availableExams);

      renderExaminations();
    } catch (error) {
      console.error("EXAM LOAD ERROR:", error);

      if (elements.examLoading) {
        elements.examLoading.textContent =
          "Error loading examinations: " + error.message;
      }
    }
  }

  function renderExaminations() {
    if (!elements.examCards) return;

    elements.examCards.innerHTML = "";

    availableExams.forEach(exam => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "dynamic-exam-card";
      card.dataset.examId = exam.id;

      card.innerHTML = `
        <strong>${escapeHTML(exam.name)}</strong>
        <small>${escapeHTML(exam.description || "Explore subjects and chapters")}</small>
      `;

      card.addEventListener("click", () => selectExam(exam));

      elements.examCards.appendChild(card);
    });
  }

  /* -------------------------------------------------------
     13. SELECT EXAMINATION
  ------------------------------------------------------- */

  async function selectExam(exam) {
    selectedExam = exam;
    selectedSubject = null;

    if (elements.selectedExam) {
      elements.selectedExam.textContent = exam.name + " — Select a Subject";
    }

    if (elements.selectedSubject) {
      elements.selectedSubject.textContent = "Select a subject to view chapters";
    }

    if (elements.subjectCards) elements.subjectCards.innerHTML = "";
    if (elements.chapterCards) elements.chapterCards.innerHTML = "";

    $$(".dynamic-exam-card").forEach(card => {
      card.classList.toggle(
        "selected",
        card.dataset.examId === String(exam.id)
      );
    });

    await loadSubjects(exam);
  }

  /* -------------------------------------------------------
     14. LOAD SUBJECTS
  ------------------------------------------------------- */

  async function loadSubjects(exam) {
    if (!supabaseClient || !elements.subjectCards) return;

    elements.subjectCards.innerHTML =
      '<p class="status-message">Loading subjects...</p>';

    try {
      const { data, error } = await supabaseClient
        .from("subjects")
        .select("id,exam_id,name,slug,is_published")
        .eq("exam_id", exam.id)
        .eq("is_published", true);

      if (error) throw error;

      elements.subjectCards.innerHTML = "";

      if (!data || data.length === 0) {
        elements.subjectCards.innerHTML =
          '<p class="status-message">No published subjects are available for this examination.</p>';
        return;
      }

      data.forEach(subject => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "dynamic-subject-card";
        card.dataset.subjectId = subject.id;

        card.innerHTML = `
          <strong>${escapeHTML(subject.name)}</strong>
          <small>View available chapters →</small>
        `;

        card.addEventListener("click", () => selectSubject(subject));

        elements.subjectCards.appendChild(card);
      });

      log("Subjects loaded successfully!", data);
    } catch (error) {
      console.error("SUBJECT LOAD ERROR:", error);

      elements.subjectCards.innerHTML =
        `<p class="status-message">Unable to load subjects: ${escapeHTML(error.message)}</p>`;
    }
  }

  /* -------------------------------------------------------
     15. SELECT SUBJECT
  ------------------------------------------------------- */

  async function selectSubject(subject) {
    selectedSubject = subject;

    if (elements.selectedSubject) {
      elements.selectedSubject.textContent =
        subject.name + " — Available Chapters";
    }

    $$(".dynamic-subject-card").forEach(card => {
      card.classList.toggle(
        "selected",
        card.dataset.subjectId === String(subject.id)
      );
    });

    await loadChapters(subject);
  }

  /* -------------------------------------------------------
     16. LOAD CHAPTERS
  ------------------------------------------------------- */

  async function loadChapters(subject) {
    if (!supabaseClient || !elements.chapterCards) return;

    elements.chapterCards.innerHTML =
      '<p class="status-message">Loading chapters...</p>';

    try {
      const { data, error } = await supabaseClient
        .from("chapters")
        .select("id,subject_id,chapter_name,chapter_number,description,is_published")
        .eq("subject_id", subject.id)
        .eq("is_published", true)
        .order("chapter_number", { ascending: true });

      if (error) throw error;

      elements.chapterCards.innerHTML = "";

      if (!data || data.length === 0) {
        elements.chapterCards.innerHTML =
          '<p class="status-message">No published chapters available yet.</p>';
        return;
      }

      data.forEach(chapter => {
        const link = document.createElement("a");
        link.className = "dynamic-chapter-card";
        link.href = `./chapter.html?chapter_id=${encodeURIComponent(chapter.id)}`;

        const number = chapter.chapter_number ?? "";

        link.innerHTML = `
          <strong>
            ${number !== "" ? `Chapter ${escapeHTML(number)}: ` : ""}
            ${escapeHTML(chapter.chapter_name)}
          </strong>
          <small>${escapeHTML(chapter.description || "Open this chapter and start learning.")}</small>
        `;

        elements.chapterCards.appendChild(link);
      });

      log("Chapters loaded successfully!", data);
    } catch (error) {
      console.error("CHAPTER LOAD ERROR:", error);

      elements.chapterCards.innerHTML =
        `<p class="status-message">Unable to load chapters: ${escapeHTML(error.message)}</p>`;
    }
  }

  /* -------------------------------------------------------
     17. EXAM CARD SHORTCUTS
  ------------------------------------------------------- */

  $$("[data-select]").forEach(link => {
    link.addEventListener("click", () => {
      const requested = link.dataset.select.toLowerCase();

      const match = availableExams.find(exam => {
        const name = (exam.name || "").toLowerCase();
        const slug = (exam.slug || "").toLowerCase();

        if (requested === "jee") {
          return name.includes("jee main") || slug.includes("jee-main");
        }

        if (requested === "advanced") {
          return name.includes("jee advanced") || slug.includes("jee-advanced");
        }

        if (requested === "neet") {
          return name.includes("neet") || slug.includes("neet");
        }

        return slug.includes(requested) || name.includes(requested);
      });

      if (match) {
        selectExam(match);
      } else {
        showToast("This examination is not available yet. Please check the learning dashboard.");
      }
    });
  });

  /* -------------------------------------------------------
     18. COURSE SEARCH AND FILTER
  ------------------------------------------------------- */

  let activeCourseFilter = "all";

  function filterCourses() {
    if (!elements.courseGrid) return;

    const search = elements.courseSearch
      ? elements.courseSearch.value.trim().toLowerCase()
      : "";

    let visibleCount = 0;

    $$(".course-card").forEach(card => {
      const examCategories = (card.dataset.exam || "").toLowerCase();
      const searchableText = (
        (card.dataset.search || "") + " " + card.textContent
      ).toLowerCase();

      const matchesFilter =
        activeCourseFilter === "all" ||
        examCategories.split(/\s+/).includes(activeCourseFilter);

      const matchesSearch = searchableText.includes(search);
      const visible = matchesFilter && matchesSearch;

      card.hidden = !visible;

      if (visible) visibleCount++;
    });

    if (elements.emptyState) {
      elements.emptyState.hidden = visibleCount > 0;
    }
  }

  if (elements.courseSearch) {
    elements.courseSearch.addEventListener("input", filterCourses);
  }

  $$(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      activeCourseFilter = button.dataset.filter || "all";

      $$(".filter-btn").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      filterCourses();
    });
  });

  filterCourses();

  /* -------------------------------------------------------
     19. SMOOTH SCROLL
  ------------------------------------------------------- */

  $$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        history.replaceState(null, "", targetId);
      }
    });
  });

  /* -------------------------------------------------------
     20. AUTH SESSION INITIALIZATION
  ------------------------------------------------------- */

  async function initializeAuthentication() {
    if (!supabaseClient) return;

    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) throw error;

      updateAuthenticationUI(data.session?.user || null);

      supabaseClient.auth.onAuthStateChange((event, session) => {
        log("STUDYVERSE AUTH EVENT:", event);
        updateAuthenticationUI(session?.user || null);
      });
    } catch (error) {
      console.error("AUTH SESSION ERROR:", error);
    }
  }

  /* -------------------------------------------------------
     21. INITIALIZE WEBSITE
  ------------------------------------------------------- */

  async function initializeWebsite() {
    log("==================================");
    log("STUDYVERSE AI");
    log("Version 7.0");
    log("Initializing website...");
    log("==================================");

    const initialized = initializeSupabase();

    if (!initialized) return;

    await initializeAuthentication();

    const connected = await testDatabaseConnection();

    if (connected) {
      await loadExaminations();
    }

    log("STUDYVERSE AI: Version 7.0 initialized successfully!");
  }

  await initializeWebsite();
});
