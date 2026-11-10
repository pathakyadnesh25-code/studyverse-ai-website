
/* =========================================================
   STUDYVERSE AI — SCRIPT.JS
   Version 3.0
   Frontend + Supabase + Dynamic Exam & Chapter Dashboard
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // 1. SELECT WEBSITE ELEMENTS
    // =====================================================

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

    // =====================================================
    // 2. TOAST NOTIFICATION SYSTEM
    // =====================================================

    let toastTimer;

    function showToast(message) {

        if (!toast) {
            console.log("STUDYVERSE AI:", message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);
    }

    // =====================================================
    // 3. MOBILE NAVIGATION
    // =====================================================

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", function (event) {

            event.stopPropagation();

            navLinks.classList.toggle("open");

            const isOpen = navLinks.classList.contains("open");

            menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        });

        navLinks.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                navLinks.classList.remove("open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

        document.addEventListener("click", function (event) {

            if (
                !navLinks.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {

                navLinks.classList.remove("open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        });

    }

    // =====================================================
    // 4. LOGIN MODAL
    // =====================================================

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

    document.querySelectorAll("[data-open-login]").forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            openLoginModal();

        });

    });

    ["loginBtn", "ctaLogin"].forEach(function (id) {

        const button = document.getElementById(id);

        if (button) {

            button.addEventListener("click", function (event) {

                event.preventDefault();

                openLoginModal();

            });

        }

    });

    if (modalClose) {
        modalClose.addEventListener("click", closeLoginModal);
    }

    if (loginModal) {

        loginModal.addEventListener("click", function (event) {

            if (event.target === loginModal) {
                closeLoginModal();
            }

        });

    }

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            closeLoginModal();

            if (navLinks && menuToggle) {

                navLinks.classList.remove("open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }

    });

    // =====================================================
    // 5. DEMO LOGIN FORM
    // =====================================================

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

            // Demo only — real authentication will use Supabase Auth.

            showToast("Welcome to STUDYVERSE AI, " + name + "!");

            loginForm.reset();

            closeLoginModal();

        });

    }

    // =====================================================
    // 6. COURSE SEARCH AND FILTER
    // =====================================================

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

            // FIX: Supports cards belonging to multiple exams.

            const examList = exam.split(/\s+/);

            const matchesFilter =
                activeFilter === "all" ||
                examList.includes(activeFilter);

            const matchesSearch =
                searchData.includes(searchText) ||
                cardText.includes(searchText);

            const shouldShow = matchesFilter && matchesSearch;

            card.style.display = shouldShow ? "" : "none";

            if (shouldShow) {
                visibleCount++;
            }

        });

        if (emptyState) {

            emptyState.style.display =
                visibleCount === 0 ? "block" : "none";

        }

        if (courseGrid) {
            courseGrid.setAttribute("aria-live", "polite");
        }

    }

    if (courseSearch) {
        courseSearch.addEventListener("input", filterCourses);
    }

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            activeFilter = (
                button.dataset.filter || "all"
            ).toLowerCase();

            filterButtons.forEach(function (item) {

                item.classList.remove("active");

                item.setAttribute("aria-pressed", "false");

            });

            button.classList.add("active");

            button.setAttribute("aria-pressed", "true");

            filterCourses();

        });

    });

    // =====================================================
    // 7. EXAM FILTER BUTTONS
    // =====================================================

    document.querySelectorAll("[data-exam]").forEach(function (element) {

        if (element.classList.contains("course-card")) return;

        element.addEventListener("click", function () {

            const selectedExam = (
                element.dataset.exam || ""
            ).toLowerCase();

            if (!selectedExam) return;

            const matchingFilter = Array.from(filterButtons).find(
                function (button) {

                    const filter = (
                        button.dataset.filter || ""
                    ).toLowerCase();

                    return filter === selectedExam;

                }
            );

            if (matchingFilter) {
                matchingFilter.click();
            }

        });

    });

    // =====================================================
    // 8. UPCOMING COURSE MATERIAL BUTTONS
    // =====================================================

    document.querySelectorAll("[data-coming]").forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            showToast(
                "Study materials are being prepared. Stay tuned!"
            );

        });

    });

    // =====================================================
    // 9. SUPABASE CONNECTION
    // =====================================================

    const STUDYVERSE_SUPABASE_URL =
        "https://mtxkvupfczhglaqghcbc.supabase.co";

    // This is the browser-safe publishable key.
    // Never put a Supabase secret/service_role key here.

    const STUDYVERSE_SUPABASE_KEY =
        "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

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

    const supabaseClient = window.studyverseSupabase;

    // =====================================================
    // 10. TEST SUPABASE DATABASE CONNECTION
    // =====================================================

    async function testStudyverseDatabase() {

        if (!supabaseClient) {

            console.error(
                "STUDYVERSE AI: Supabase client unavailable!"
            );

            return;

        }

        try {

            const { data, error } = await supabaseClient
                .from("exams")
                .select("id, name, slug")
                .limit(5);

            if (error) throw error;

            console.log(
                "STUDYVERSE AI: Database connection successful!"
            );

            console.log(
                "Available examinations:",
                data
            );

        } catch (error) {

            console.error(
                "STUDYVERSE AI: Database connection failed:",
                error
            );

        }

    }

    // =====================================================
    // 11. DYNAMIC EXAM DASHBOARD
    // =====================================================

    let studyverseExams = [];

    let dashboardPromise = null;

    async function loadStudyverseExamDashboard() {

        const root = document.getElementById(
            "studyverse-dynamic-dashboard"
        );

        if (!root) {

            console.error(
                "STUDYVERSE AI: Dashboard HTML not found!"
            );

            return;

        }

        if (!supabaseClient) {

            console.error(
                "STUDYVERSE AI: Supabase client unavailable!"
            );

            return;

        }

        const examContainer = document.getElementById("sv-exam-cards");

        const subjectContainer = document.getElementById("sv-subject-cards");

        const selectedHeading = document.getElementById("sv-selected-exam");

        const loading = document.getElementById("sv-exam-loading");

        const message = document.getElementById("sv-dashboard-message");

        if (!examContainer || !subjectContainer) {

            console.error(
                "STUDYVERSE AI: Exam or subject container missing from HTML!"
            );

            return;

        }

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

            if (loading) {
                loading.textContent = "Loading examinations...";
            }

            // Fetch published examinations.

            const { data: exams, error: examError } = await supabaseClient
                .from("exams")
                .select("id, name, slug, description, is_published")
                .eq("is_published", true)
                .order("name");

            if (examError) throw examError;

            // Fetch published subjects.

            const { data: subjects, error: subjectError } = await supabaseClient
                .from("subjects")
                .select("id, exam_id, name, slug, is_published")
                .eq("is_published", true)
                .order("name");

            if (subjectError) throw subjectError;

            studyverseExams = exams || [];

            if (studyverseExams.length === 0) {

                if (loading) {
                    loading.textContent =
                        "No published examinations found.";
                }

                return;

            }

            // Display examination cards.

            examContainer.innerHTML = studyverseExams.map(
                function (exam, index) {

                    return `
                        <button
                            type="button"
                            class="sv-exam-card ${index === 0 ? "active" : ""}"
                            data-exam-id="${escapeHTML(exam.id)}"
                        >
                            <span class="sv-card-label">
                                EXAMINATION
                            </span>

                            <h3>${escapeHTML(exam.name)}</h3>

                            <p>
                                ${escapeHTML(
                                    exam.description ||
                                    "Explore learning resources."
                                )}
                            </p>
                        </button>
                    `;

                }
            ).join("");

            if (loading) {
                loading.textContent = "";
            }

            // Display subjects for the selected exam.

            function showSubjects(examId, examName) {

                if (selectedHeading) {

                    selectedHeading.textContent =
                        examName + " - Subjects";

                }

                const matchingSubjects = (subjects || []).filter(
                    function (subject) {
                        return subject.exam_id === examId;
                    }
                );

                if (matchingSubjects.length === 0) {

                    subjectContainer.innerHTML =
                        "<p class='sv-status'>No published subjects available yet.</p>";

                    return;

                }

                subjectContainer.innerHTML = matchingSubjects.map(
                    function (subject) {

                        return `
                            <button
                                type="button"
                                class="sv-subject-card"
                                data-subject-id="${escapeHTML(subject.id)}"
                                data-subject-name="${escapeHTML(subject.name)}"
                            >
                                <span class="sv-card-label">
                                    SUBJECT
                                </span>

                                <h3>${escapeHTML(subject.name)}</h3>

                                <p>
                                    Explore chapters and learning resources.
                                </p>
                            </button>
                        `;

                    }
                ).join("");

            }

            // Handle dynamic exam-card clicks.

            examContainer.addEventListener("click", function (event) {

                const card = event.target.closest(".sv-exam-card");

                if (!card || !examContainer.contains(card)) return;

                examContainer.querySelectorAll(".sv-exam-card")
                    .forEach(function (item) {
                        item.classList.remove("active");
                    });

                card.classList.add("active");

                const selectedExam = studyverseExams.find(
                    function (exam) {
                        return exam.id === card.dataset.examId;
                    }
                );

                if (selectedExam) {

                    showSubjects(
                        selectedExam.id,
                        selectedExam.name
                    );

                }

            });

            // Show first examination by default.

            showSubjects(
                studyverseExams[0].id,
                studyverseExams[0].name
            );

            if (message) {

                message.textContent =
                    "Examinations and subjects loaded successfully!";

            }

            console.log(
                "STUDYVERSE AI: Dynamic exam dashboard loaded!",
                {
                    exams: studyverseExams,
                    subjects: subjects
                }
            );

        } catch (error) {

            if (loading) {

                loading.textContent =
                    "Unable to load examinations.";

            }

            console.error(
                "STUDYVERSE AI: Dashboard error:",
                error.message,
                error.details,
                error.code
            );

        }

    }

    // Start the dashboard.

    dashboardPromise = loadStudyverseExamDashboard();

    // =====================================================
    // 12. CONNECT STATIC EXAM CARDS TO DYNAMIC DASHBOARD
    // =====================================================

    async function selectDynamicExam(selectedCourse) {

        const dashboard = document.getElementById(
            "studyverse-dynamic-dashboard"
        );

        if (dashboard) {

            dashboard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

        if (dashboardPromise) {
            await dashboardPromise;
        }

        const searchValue = String(selectedCourse || "")
            .toLowerCase()
            .trim();

        const examAliases = {
            "jee": ["jee-main", "jee"],
            "main": ["jee-main", "jee"],
            "jee main": ["jee-main", "jee"],
            "advanced": ["jee-advanced", "advanced"],
            "jee advanced": ["jee-advanced", "advanced"],
            "neet": ["neet-ug", "neet"],
            "neet ug": ["neet-ug", "neet"]
        };

        const possibleSlugs = examAliases[searchValue] || [searchValue];

        const selectedExam = studyverseExams.find(
            function (exam) {

                const slug = String(exam.slug || "").toLowerCase();

                const name = String(exam.name || "").toLowerCase();

                return (
                    possibleSlugs.includes(slug) ||
                    name === searchValue ||
                    slug === searchValue
                );

            }
        );

        if (!selectedExam) {

            showToast(
                "The selected examination is not available yet."
            );

            return;

        }

        const examCard = document.querySelector(
            '.sv-exam-card[data-exam-id="' +
            selectedExam.id +
            '"]'
        );

        if (examCard) {

            examCard.click();

            showToast(
                selectedExam.name + " selected successfully!"
            );

        }

    }

    // Static examination buttons use data-select="jee",
    // data-select="advanced" and data-select="neet".

    document.querySelectorAll("[data-select]").forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            const selectedCourse = button.dataset.select;

            if (selectedCourse) {

                selectDynamicExam(selectedCourse);

            } else {

                showToast("Please select an examination.");

            }

        });

    });

    // =====================================================
    // 13. DYNAMIC CHAPTER LIBRARY
    // =====================================================

    const svSubjectContainer = document.getElementById(
        "sv-subject-cards"
    );

    const svChapterContainer = document.getElementById(
        "sv-chapter-cards"
    );

    const svChapterHeading = document.getElementById(
        "sv-selected-subject"
    );

    function svEscapeHTML(value) {

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

    if (svSubjectContainer) {

        svSubjectContainer.addEventListener(
            "click",
            async function (event) {

                const subjectCard = event.target.closest(
                    ".sv-subject-card"
                );

                if (
                    !subjectCard ||
                    !svSubjectContainer.contains(subjectCard)
                ) {
                    return;
                }

                const subjectId = subjectCard.dataset.subjectId;

                const subjectName = subjectCard.dataset.subjectName;

                if (!subjectId) return;

                if (!svChapterContainer || !svChapterHeading) {

                    console.error(
                        "STUDYVERSE AI: Chapter HTML elements are missing!"
                    );

                    return;

                }

                if (!supabaseClient) {

                    showToast("Database connection is unavailable.");

                    return;

                }

                svChapterHeading.textContent =
                    subjectName + " - Loading chapters...";

                svChapterContainer.innerHTML =
                    "<p class='sv-status'>Loading chapters...</p>";

                try {

                    const { data: chapters, error } = await supabaseClient
                        .from("chapters")
                        .select(
                            "id, chapter_name, chapter_number, description"
                        )
                        .eq("subject_id", subjectId)
                        .eq("is_published", true)
                        .order("chapter_number");

                    if (error) throw error;

                    if (!chapters || chapters.length === 0) {

                        svChapterHeading.textContent =
                            subjectName + " - Chapters";

                        svChapterContainer.innerHTML =
                            "<p class='sv-status'>No published chapters available yet.</p>";

                        return;

                    }

                    svChapterHeading.textContent =
                        subjectName + " - " +
                        chapters.length + " Chapters";

                    svChapterContainer.innerHTML = chapters.map(
                        function (chapter) {

                            return `
                                <article class="sv-chapter-card">

                                    <span class="sv-chapter-number">
                                        CHAPTER
                                        ${svEscapeHTML(chapter.chapter_number)}
                                    </span>

                                    <h4>
                                        ${svEscapeHTML(chapter.chapter_name)}
                                    </h4>

                                    <p>
                                        ${svEscapeHTML(
                                            chapter.description ||
                                            "Explore this chapter."
                                        )}
                                    </p>

                                    <button
                                        type="button"
                                        class="sv-chapter-open"
                                        data-chapter-id="${svEscapeHTML(chapter.id)}"
                                        data-chapter-name="${svEscapeHTML(chapter.chapter_name)}"
                                    >
                                        Explore Chapter →
                                    </button>

                                </article>
                            `;

                        }
                    ).join("");

                    console.log(
                        "STUDYVERSE AI: Chapters loaded successfully!",
                        chapters
                    );

                } catch (error) {

                    svChapterHeading.textContent =
                        "Unable to load chapters";

                    svChapterContainer.innerHTML =
                        "<p class='sv-status'>Please check database permissions and try again.</p>";

                    console.error(
                        "STUDYVERSE AI: Chapter loading error:",
                        error.message,
                        error.code,
                        error.details
                    );

                }

            }
        );

    }


    // =====================================================
    // 14. CHAPTER SELECTION AND NAVIGATION
    // =====================================================

    if (svChapterContainer) {

        svChapterContainer.addEventListener(
            "click",
            function (event) {

                const button = event.target.closest(
                    ".sv-chapter-open"
                );

                if (
                    !button ||
                    !svChapterContainer.contains(button)
                ) {
                    return;
                }

                const chapterId = button.dataset.chapterId;

                const chapterName = button.dataset.chapterName;

                if (!chapterId) {

                    console.error(
                        "STUDYVERSE AI: Chapter ID is missing!"
                    );

                    showToast(
                        "Unable to open this chapter. Please try again."
                    );

                    return;
                }

                console.log(
                    "STUDYVERSE AI: Opening chapter:",
                    {
                        chapterName: chapterName,
                        chapterId: chapterId
                    }
                );

                // Navigate to the chapter learning page.

                window.location.href =
                    "./chapter.html?chapter_id=" +
                    encodeURIComponent(chapterId);

            }
        );

    }


    // =====================================================
    // 15. SMOOTH SCROLL FOR INTERNAL LINKS
    // =====================================================

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            let targetElement;

            try {

                targetElement = document.querySelector(targetId);

            } catch (error) {

                return;

            }

            if (targetElement) {

                event.preventDefault();

                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });

    // =====================================================
    // 16. AUTOMATIC FOOTER YEAR
    // =====================================================

    if (year) {

        year.textContent = new Date().getFullYear();

    }

    // =====================================================
    // 17. INITIALIZE COURSE FILTERS
    // =====================================================

    filterCourses();

    // =====================================================
    // 18. TEST DATABASE CONNECTION
    // =====================================================

    testStudyverseDatabase();

    // =====================================================
    // 19. WEBSITE INITIALIZATION
    // =====================================================

    console.log(
        "%cSTUDYVERSE AI",
        "color:#8b5cf6;font-size:24px;font-weight:bold;"
    );

    console.log(
        "%cWebsite JavaScript initialized successfully!",
        "color:#22c55e;font-size:14px;"
    );

/* =====================================================
   STUDYVERSE AI — OPEN CHAPTER NAVIGATION
===================================================== */


    const openButton = event.target.closest(".sv-chapter-open");

    if (!openButton) {
        return;
    }

    const chapterId = openButton.dataset.chapterId;

    if (!chapterId) {
        console.error(
            "STUDYVERSE AI: Chapter ID is missing."
        );
        return;
    }

    console.log(
        "STUDYVERSE AI: Opening chapter:",
        chapterId
    );

    window.location.href =
        "./chapter.html?chapter_id=" +
        encodeURIComponent(chapterId);

});

});
