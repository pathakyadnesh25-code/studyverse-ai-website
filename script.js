
/* =========================================================
   STUDYVERSE AI — SCRIPT.JS
   Version 2.0
   Frontend interactions for JEE Main, JEE Advanced & NEET
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // -----------------------------------------------------
    // 1. SELECT WEBSITE ELEMENTS
    // -----------------------------------------------------

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    const loginModal = document.getElementById("loginModal");
    const modalClose = document.getElementById("modalClose");
    const loginForm = document.getElementById("loginForm");

    const studentName = document.getElementById("studentName");
    const studentEmail = document.getElementById("studentEmail");

    const courseSearch = document.getElementById("courseSearch");
    const courseGrid = document.getElementById("courseGrid");
    const emptyState = document.getElementById("emptyState");

    const toast = document.getElementById("toast");
    const year = document.getElementById("year");

    const filterButtons = document.querySelectorAll(".filter-btn");
    const courseCards = document.querySelectorAll(".course-card");

    // -----------------------------------------------------
    // 2. TOAST NOTIFICATION SYSTEM
    // -----------------------------------------------------

    let toastTimer;

    function showToast(message) {

        if (!toast) {
            alert(message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);
    }

    // -----------------------------------------------------
    // 3. MOBILE NAVIGATION MENU
    // -----------------------------------------------------

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", function () {

            navLinks.classList.toggle("open");

            const isOpen = navLinks.classList.contains("open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });

        // Close menu after clicking a navigation link
        navLinks.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");

            });

        });

        // Close menu when clicking outside
        document.addEventListener("click", function (event) {

            if (
                !navLinks.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            }

        });

    }

    // -----------------------------------------------------
    // 4. LOGIN MODAL
    // -----------------------------------------------------

    function openLoginModal() {

        if (!loginModal) {
            showToast("Login feature will be available soon!");
            return;
        }

        loginModal.classList.add("show");
        document.body.style.overflow = "hidden";

        if (studentName) {
            studentName.focus();
        }
    }

    function closeLoginModal() {

        if (!loginModal) return;

        loginModal.classList.remove("show");
        document.body.style.overflow = "";

    }

    // Open login modal from all login buttons
    document.querySelectorAll("[data-open-login]").forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();
            openLoginModal();

        });

    });

    // Also support common login button IDs
    ["loginBtn", "ctaLogin"].forEach(function (id) {

        const button = document.getElementById(id);

        if (button) {
            button.addEventListener("click", function (event) {

                event.preventDefault();
                openLoginModal();

            });
        }

    });

    // Close button
    if (modalClose) {
        modalClose.addEventListener("click", closeLoginModal);
    }

    // Close when clicking outside modal content
    if (loginModal) {

        loginModal.addEventListener("click", function (event) {

            if (event.target === loginModal) {
                closeLoginModal();
            }

        });

    }

    // Close modal with Escape key
    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            closeLoginModal();

            if (navLinks && menuToggle) {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            }

        }

    });

    // -----------------------------------------------------
    // 5. DEMO LOGIN FORM
    // -----------------------------------------------------

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const name = studentName
                ? studentName.value.trim()
                : "";

            const email = studentEmail
                ? studentEmail.value.trim()
                : "";

            if (!name || !email) {
                showToast("Please enter your name and email.");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {
                showToast("Please enter a valid email address.");
                return;
            }

            // This is a frontend demo only.
            // Real registration will be connected to Supabase later.

            showToast("Welcome to STUDYVERSE AI, " + name + "!");

            loginForm.reset();
            closeLoginModal();

        });

    }

    // -----------------------------------------------------
    // 6. COURSE SEARCH AND FILTER SYSTEM
    // -----------------------------------------------------

    let activeFilter = "all";

    function filterCourses() {

        const searchText = courseSearch
            ? courseSearch.value.toLowerCase().trim()
            : "";

        let visibleCount = 0;

        courseCards.forEach(function (card) {

            const exam = (card.dataset.exam || "").toLowerCase();
            const searchData = (card.dataset.search || "").toLowerCase();
            const cardText = card.textContent.toLowerCase();

            const matchesFilter =
                activeFilter === "all" ||
                exam === activeFilter;

            const matchesSearch =
                searchData.includes(searchText) ||
                cardText.includes(searchText);

            const shouldShow = matchesFilter && matchesSearch;

            card.style.display = shouldShow ? "" : "none";

            if (shouldShow) {
                visibleCount++;
            }

        });

        // Show empty message when there are no matching courses
        if (emptyState) {
            emptyState.style.display =
                visibleCount === 0 ? "block" : "none";
        }

        if (courseGrid) {
            courseGrid.setAttribute(
                "aria-live",
                "polite"
            );
        }

    }

    // Search input
    if (courseSearch) {

        courseSearch.addEventListener("input", filterCourses);

    }

    // Filter buttons
    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            activeFilter = (button.dataset.filter || "all").toLowerCase();

            filterButtons.forEach(function (item) {
                item.classList.remove("active");
                item.setAttribute("aria-pressed", "false");
            });

            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");

            filterCourses();

        });

    });

    // -----------------------------------------------------
    // 7. EXAM SELECTION BUTTONS
    // -----------------------------------------------------

    document.querySelectorAll("[data-exam]").forEach(function (element) {

        // Course cards are handled by the filter system.
        if (element.classList.contains("course-card")) return;

        element.addEventListener("click", function () {

            const selectedExam = (
                element.dataset.exam || ""
            ).toLowerCase();

            if (!selectedExam) return;

            const matchingFilter = Array.from(filterButtons).find(
                function (button) {
                    return (
                        (button.dataset.filter || "").toLowerCase() ===
                        selectedExam
                    );
                }
            );

            if (matchingFilter) {
                matchingFilter.click();
            }

            // If the element is an exam link, allow normal navigation.
            if (element.tagName === "A") {
                const href = element.getAttribute("href") || "";

                if (href.startsWith("#")) {
                    const target = document.querySelector(href);

                    if (target) {
                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }
                }
            }

        });

    });

    // -----------------------------------------------------
    // 8. COURSE MATERIAL BUTTONS
    // -----------------------------------------------------

    document.querySelectorAll("[data-coming]").forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            showToast(
                "Study materials are being prepared. Stay tuned!"
            );

        });

    });

    // -----------------------------------------------------
    // 9. COURSE SELECTION BUTTONS
    // -----------------------------------------------------

    document.querySelectorAll("[data-select]").forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            const selectedCourse = button.dataset.select;

            if (selectedCourse) {
                showToast(
                    selectedCourse + " selected! Course access is coming soon."
                );
            } else {
                showToast("Course selection will be available soon!");
            }

        });

    });

    // -----------------------------------------------------
    // 10. SMOOTH SCROLL FOR INTERNAL LINKS
    // -----------------------------------------------------

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {

                event.preventDefault();

                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });

    // -----------------------------------------------------
    // 11. AUTOMATIC FOOTER YEAR
    // -----------------------------------------------------

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // -----------------------------------------------------
    // 12. INITIALIZE COURSE FILTERS
    // -----------------------------------------------------

    filterCourses();

    // -----------------------------------------------------
    // 13. WEBSITE INITIALIZATION MESSAGE
    // -----------------------------------------------------

    console.log(
        "%cSTUDYVERSE AI",
        "color:#8b5cf6;font-size:24px;font-weight:bold;"
    );

    console.log(
        "%cWebsite JavaScript initialized successfully!",
        "color:#22c55e;font-size:14px;"
    );

/* ==========================================
   STUDYVERSE AI - SUPABASE CONNECTION
========================================== */

// 1. Project credentials

const STUDYVERSE_SUPABASE_URL =
    "https://mtxkvupfczhglaqghcbc.supabase.co";

const STUDYVERSE_SUPABASE_KEY =
    "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";


// 2. Initialize Supabase

if (!window.studyverseSupabase) {

    if (!window.supabase) {

        console.error(
            "STUDYVERSE AI: Supabase library not loaded!"
        );

    } else {

        window.studyverseSupabase =
            window.supabase.createClient(
                STUDYVERSE_SUPABASE_URL,
                STUDYVERSE_SUPABASE_KEY
            );

        console.log(
            "STUDYVERSE AI: Supabase client initialized successfully!"
        );
    }
}


// 3. Test database connection

async function testStudyverseDatabase() {

    if (!window.studyverseSupabase) {
        console.error("Supabase client is unavailable!");
        return;
    }

    try {

        const { data, error } =
            await window.studyverseSupabase
             .from("exams")
             .select("*")
             .limit(5);

        if (error) throw error;

        console.log(
            "STUDYVERSE AI: Database connection successful!"
        );

        console.log("Available courses:", data);

    } catch (error) {

        console.error(
            "STUDYVERSE AI: Database connection failed:",
            error
        );

    }
}


// 4. Run only once

testStudyverseDatabase();
   /* ==========================================
   STUDYVERSE AI - DYNAMIC EXAM DASHBOARD
========================================== */

async function loadStudyverseExamDashboard() {

    const root = document.getElementById(
        "studyverse-dynamic-dashboard"
    );

    if (!root) {
        console.error("STUDYVERSE AI: Dashboard HTML not found!");
        return;
    }

    const client = window.studyverseSupabase;

    if (!client) {
        console.error("STUDYVERSE AI: Supabase client unavailable!");
        return;
    }

    const examContainer = document.getElementById("sv-exam-cards");
    const subjectContainer = document.getElementById("sv-subject-cards");
    const selectedHeading = document.getElementById("sv-selected-exam");
    const loading = document.getElementById("sv-exam-loading");
    const message = document.getElementById("sv-dashboard-message");

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    try {

        loading.textContent = "Loading examinations...";

        // Fetch published exams
        const { data: exams, error: examError } = await client
            .from("exams")
            .select("id, name, slug, description, is_published")
            .eq("is_published", true)
            .order("name");

        if (examError) throw examError;

        // Fetch published subjects
        const { data: subjects, error: subjectError } = await client
            .from("subjects")
            .select("id, exam_id, name, slug, is_published")
            .eq("is_published", true)
            .order("name");

        if (subjectError) throw subjectError;

        if (!exams || exams.length === 0) {
            loading.textContent = "No published examinations found.";
            return;
        }

        // Display examination cards
        examContainer.innerHTML = exams.map((exam, index) => `
            <button
                type="button"
                class="sv-exam-card ${index === 0 ? "active" : ""}"
                data-exam-id="${escapeHTML(exam.id)}"
            >
                <span class="sv-card-label">EXAMINATION</span>
                <h3>${escapeHTML(exam.name)}</h3>
                <p>${escapeHTML(exam.description || "Explore learning resources.")}</p>
            </button>
        `).join("");

        loading.textContent = "";

        // Display subjects belonging to selected exam
        function showSubjects(examId, examName) {

            selectedHeading.textContent = examName + " - Subjects";

            const matchingSubjects = subjects.filter(subject =>
                subject.exam_id === examId
            );

            if (matchingSubjects.length === 0) {
                subjectContainer.innerHTML =
                    "<p class='sv-status'>No published subjects available yet.</p>";
                return;
            }

            subjectContainer.innerHTML = matchingSubjects.map(subject => `
                <button
                    type="button"
                    class="sv-subject-card"
                    data-subject-id="${escapeHTML(subject.id)}"
                    data-subject-name="${escapeHTML(subject.name)}"
                >
                    <span class="sv-card-label">SUBJECT</span>
                    <h3>${escapeHTML(subject.name)}</h3>
                    <p>Explore chapters and learning resources.</p>
                </button>
            `).join("");
        }

        // Exam card click events
        examContainer.querySelectorAll(".sv-exam-card").forEach(card => {

            card.addEventListener("click", function () {

                examContainer.querySelectorAll(".sv-exam-card")
                    .forEach(item => item.classList.remove("active"));

                this.classList.add("active");

                const exam = exams.find(item =>
                    item.id === this.dataset.examId
                );

                if (exam) {
                    showSubjects(exam.id, exam.name);
                }
            });

        });

        // Display the first exam by default
        showSubjects(exams[0].id, exams[0].name);

        message.textContent =
            "Examinations and subjects loaded successfully!";

        console.log(
            "STUDYVERSE AI: Dynamic exam dashboard loaded!",
            { exams, subjects }
        );

    } catch (error) {

        loading.textContent = "Unable to load examinations.";

        console.error(
            "STUDYVERSE AI: Dashboard error:",
            error.message,
            error.details,
            error.code
        );
    }
}

// Start dashboard
loadStudyverseExamDashboard();

});

