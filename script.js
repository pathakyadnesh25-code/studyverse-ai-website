/* =========================================================
   STUDYVERSE AI — COMPLETE WEBSITE SCRIPT
   Version 6.0

   FEATURES
   1. Mobile navigation
   2. Supabase connection
   3. Student registration and login
   4. Password confirmation
   5. Persistent authentication
   6. Student profile and logout
   7. Course search and filters
   8. Daily study timer
   9. Live clock and date
   10. Daily activity history
   11. Daily study targets
   12. Dynamic examination loading
   13. Dynamic subject loading
   14. Dynamic chapter loading
   15. Chapter navigation
   16. Smooth scrolling
   17. Toast notifications

   NOTE
   Daily timer and targets are stored in this browser.
   Passwords are handled by Supabase Authentication.
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    "use strict";

    // =====================================================
    // 1. HTML ELEMENTS
    // =====================================================

    const $ = (id) => document.getElementById(id);

    const menuToggle = $("menuToggle");
    const navLinks = $("navLinks");

    const loginModal = $("loginModal");
    const modalClose = $("modalClose");
    const loginForm = $("loginForm");

    const studentName = $("studentName");
    const studentEmail = $("studentEmail");
    const studentPassword = $("studentPassword");

    const nameFieldGroup = $("nameFieldGroup");
    const targetExamGroup = $("targetExamGroup");
    const academicLevelGroup = $("academicLevelGroup");
    const preferredLanguageGroup = $("preferredLanguageGroup");
    const confirmPasswordGroup = $("confirmPasswordGroup");

    const targetExam = $("targetExam");
    const academicLevel = $("academicLevel");
    const preferredLanguage = $("preferredLanguage");
    const confirmPassword = $("confirmPassword");

    const authModeText = $("authModeText");
    const authSubmitBtn = $("authSubmitBtn");
    const authMessage = $("authMessage");
    const authSwitchLabel = $("authSwitchLabel");
    const authSwitchBtn = $("authSwitchBtn");

    const loginBtn = $("loginBtn");
    const getStartedBtn = $("getStartedBtn");
    const profileBtn = $("profileBtn");
    const logoutBtn = $("logoutBtn");

    const profileModal = $("profileModal");
    const profileModalClose = $("profileModalClose");
    const profileDashboardBtn = $("profileDashboardBtn");

    const profileStudentName = $("profileStudentName");
    const profileStudentEmail = $("profileStudentEmail");
    const profileAccountStatus = $("profileAccountStatus");
    const profileCreatedAt = $("profileCreatedAt");

    const courseSearch = $("courseSearch");
    const courseGrid = $("courseGrid");
    const emptyState = $("emptyState");

    const toast = $("toast");
    const year = $("year");

    const filterButtons = document.querySelectorAll(".filter-btn");
    const courseCards = document.querySelectorAll(".course-card");

    const studentDashboard = $("student-dashboard");
    const detailedDashboard = $("detailed-dashboard");

    let currentStudent = null;
    let authMode = "login";
    let toastTimer = null;
    let studySessionStartedAt = null;
    let studyTimerInterval = null;

    // =====================================================
    // 2. SUPABASE CONNECTION
    // =====================================================

    const SUPABASE_URL =
        "https://mtxkvupfczhglaqghcbc.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

    if (!window.studyverseSupabase) {
        if (window.supabase && window.supabase.createClient) {
            window.studyverseSupabase =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );

            console.log(
                "STUDYVERSE AI: Supabase client initialized."
            );
        } else {
            console.error(
                "STUDYVERSE AI: Supabase library was not loaded."
            );
        }
    }

    const supabaseClient = window.studyverseSupabase || null;

    // =====================================================
    // 3. GENERAL HELPERS
    // =====================================================

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
        }, 3500);
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

    function showAuthMessage(message, isError = false) {
        if (!authMessage) return;

        authMessage.textContent = message;
        authMessage.style.display = "block";
        authMessage.style.color = isError ? "#ef4444" : "#22c55e";
    }

    function clearAuthMessage() {
        if (!authMessage) return;

        authMessage.textContent = "";
        authMessage.style.display = "none";
    }

    function getStudentDisplayName(user) {
        if (!user) return "Student";

        const metadata = user.user_metadata || {};

        return (
            metadata.full_name ||
            metadata.name ||
            (user.email ? user.email.split("@")[0] : "Student")
        );
    }

    // =====================================================
    // 4. MOBILE NAVIGATION
    // =====================================================

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function (event) {
            event.stopPropagation();

            navLinks.classList.toggle("open");

            menuToggle.setAttribute(
                "aria-expanded",
                String(navLinks.classList.contains("open"))
            );
        });

        navLinks.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });

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

    // =====================================================
    // 5. LOGIN AND REGISTRATION MODAL
    // =====================================================

    function openLoginModal() {
        if (!loginModal) {
            showToast("Login section is unavailable.");
            return;
        }

        loginModal.classList.add("show");
        loginModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        clearAuthMessage();

        if (studentEmail) studentEmail.focus();
    }

    function closeLoginModal() {
        if (!loginModal) return;

        loginModal.classList.remove("show");
        loginModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function setRegistrationField(element, visible) {
        if (!element) return;

        element.hidden = !visible;
        element.style.display = visible ? "block" : "none";
    }

    function setAuthMode(mode) {
        authMode = mode;
        clearAuthMessage();

        const registering = mode === "register";

        setRegistrationField(nameFieldGroup, registering);
        setRegistrationField(targetExamGroup, registering);
        setRegistrationField(academicLevelGroup, registering);
        setRegistrationField(preferredLanguageGroup, registering);
        setRegistrationField(confirmPasswordGroup, registering);

        if (studentName) studentName.required = registering;
        if (targetExam) targetExam.required = registering;
        if (academicLevel) academicLevel.required = registering;
        if (preferredLanguage) preferredLanguage.required = registering;
        if (confirmPassword) confirmPassword.required = registering;

        if (studentPassword) {
            studentPassword.autocomplete =
                registering ? "new-password" : "current-password";
        }

        if (authModeText) {
            authModeText.textContent = registering
                ? "Create Your STUDYVERSE AI Student Account"
                : "Login to STUDYVERSE AI";
        }

        if (authSubmitBtn) {
            authSubmitBtn.textContent =
                registering ? "Create Account" : "Login";
        }

        if (authSwitchLabel) {
            authSwitchLabel.textContent = registering
                ? "Already have an account?"
                : "Don't have an account?";
        }

        if (authSwitchBtn) {
            authSwitchBtn.textContent =
                registering ? "Login" : "Create Account";
        }
    }

    document.querySelectorAll("[data-open-login]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            setAuthMode("login");
            openLoginModal();
        });
    });

    ["loginBtn", "ctaLogin", "getStartedBtn"].forEach(function (id) {
        const button = $(id);

        if (!button) return;

        button.addEventListener("click", function (event) {
            event.preventDefault();
            setAuthMode("login");
            openLoginModal();
        });
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

    if (authSwitchBtn) {
        authSwitchBtn.addEventListener("click", function () {
            setAuthMode(
                authMode === "login" ? "register" : "login"
            );
        });
    }

    // =====================================================
    // 6. SUPABASE AUTHENTICATION
    // =====================================================

    async function registerStudent(details) {
        if (!supabaseClient) {
            throw new Error("Supabase connection is unavailable.");
        }

        const { data, error } =
            await supabaseClient.auth.signUp({
                email: details.email,
                password: details.password,
                options: {
                    data: {
                        full_name: details.name,
                        name: details.name,
                        target_exam: details.targetExam,
                        academic_level: details.academicLevel,
                        preferred_language: details.preferredLanguage
                    }
                }
            });

        if (error) throw error;

        return data;
    }

    async function loginStudent(email, password) {
        if (!supabaseClient) {
            throw new Error("Supabase connection is unavailable.");
        }

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) throw error;

        return data;
    }

    async function logoutStudent() {
        if (!supabaseClient) return;

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            showToast("Unable to logout. Please try again.");
            return;
        }

        closeProfileModal();
        closeLoginModal();

        updateAuthenticationUI(null);
        showToast("You have logged out successfully.");
    }

    // =====================================================
    // 7. LOGIN AND REGISTRATION FORM
    // =====================================================

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            clearAuthMessage();

            const name = studentName
                ? studentName.value.trim()
                : "";

            const email = studentEmail
                ? studentEmail.value.trim().toLowerCase()
                : "";

            const password = studentPassword
                ? studentPassword.value
                : "";

            const selectedExam = targetExam
                ? targetExam.value
                : "";

            const selectedLevel = academicLevel
                ? academicLevel.value
                : "";

            const selectedLanguage = preferredLanguage
                ? preferredLanguage.value
                : "";

            const repeatedPassword = confirmPassword
                ? confirmPassword.value
                : "";

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showAuthMessage("Please enter a valid email address.", true);
                if (studentEmail) studentEmail.focus();
                return;
            }

            if (!password || password.length < 6) {
                showAuthMessage(
                    "Password must contain at least 6 characters.",
                    true
                );
                if (studentPassword) studentPassword.focus();
                return;
            }

            if (!supabaseClient) {
                showAuthMessage(
                    "Database connection is unavailable.",
                    true
                );
                return;
            }

            if (authMode === "register") {
                if (name.length < 2) {
                    showAuthMessage("Please enter your full name.", true);
                    if (studentName) studentName.focus();
                    return;
                }

                if (!selectedExam) {
                    showAuthMessage(
                        "Please select your target examination.",
                        true
                    );
                    if (targetExam) targetExam.focus();
                    return;
                }

                if (!selectedLevel) {
                    showAuthMessage(
                        "Please select your academic level.",
                        true
                    );
                    if (academicLevel) academicLevel.focus();
                    return;
                }

                if (!selectedLanguage) {
                    showAuthMessage(
                        "Please select your preferred language.",
                        true
                    );
                    if (preferredLanguage) preferredLanguage.focus();
                    return;
                }

                if (!repeatedPassword) {
                    showAuthMessage(
                        "Please confirm your password.",
                        true
                    );
                    if (confirmPassword) confirmPassword.focus();
                    return;
                }

                if (password !== repeatedPassword) {
                    showAuthMessage(
                        "Passwords do not match. Please try again.",
                        true
                    );

                    if (confirmPassword) {
                        confirmPassword.value = "";
                        confirmPassword.focus();
                    }

                    return;
                }
            }

            if (authSubmitBtn) {
                authSubmitBtn.disabled = true;
                authSubmitBtn.textContent =
                    authMode === "register"
                        ? "Creating Account..."
                        : "Logging in...";
            }

            try {
                if (authMode === "register") {
                    const result = await registerStudent({
                        name: name,
                        email: email,
                        password: password,
                        targetExam: selectedExam,
                        academicLevel: selectedLevel,
                        preferredLanguage: selectedLanguage
                    });

                    loginForm.reset();

                    if (result.session) {
                        closeLoginModal();
                        updateAuthenticationUI(result.user);
                        showToast("Welcome to STUDYVERSE AI, " + name + "!");
                    } else {
                        showAuthMessage(
                            "Your account has been created. Please check your email and confirm your account before logging in."
                        );
                    }
                } else {
                    const result = await loginStudent(email, password);

                    loginForm.reset();
                    closeLoginModal();

                    updateAuthenticationUI(result.user);

                    showToast(
                        "Welcome back, " +
                        getStudentDisplayName(result.user) +
                        "!"
                    );
                }
            } catch (error) {
                console.error("Authentication error:", error);

                showAuthMessage(
                    error.message || "Authentication failed. Please try again.",
                    true
                );
            } finally {
                if (authSubmitBtn) {
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.textContent =
                        authMode === "register"
                            ? "Create Account"
                            : "Login";
                }
            }
        });
    }

    // =====================================================
    // 8. STUDENT PROFILE
    // =====================================================

    function openProfileModal() {
        if (!profileModal) return;

        profileModal.classList.add("show");
        profileModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeProfileModal() {
        if (!profileModal) return;

        profileModal.classList.remove("show");
        profileModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    if (profileBtn) {
        profileBtn.addEventListener("click", function (event) {
            event.preventDefault();
            openProfileModal();
        });
    }

    if (profileModalClose) {
        profileModalClose.addEventListener("click", closeProfileModal);
    }

    if (profileModal) {
        profileModal.addEventListener("click", function (event) {
            if (event.target === profileModal) {
                closeProfileModal();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();
            logoutStudent();
        });
    }

    function updateProfileInformation(user) {
        if (!user) return;

        if (profileStudentName) {
            profileStudentName.textContent =
                getStudentDisplayName(user);
        }

        if (profileStudentEmail) {
            profileStudentEmail.textContent =
                user.email || "Not available";
        }

        if (profileAccountStatus) {
            profileAccountStatus.textContent =
                user.email_confirmed_at
                    ? "Email verified"
                    : "Email verification pending";
        }

        if (profileCreatedAt) {
            profileCreatedAt.textContent = user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-IN")
                : "Not available";
        }
    }

    // =====================================================
    // 9. STUDENT DASHBOARD
    // =====================================================

    function showStudentDashboard() {
        if (!studentDashboard) {
            window.location.href = "./student-dashboard.html";
            return;
        }

        studentDashboard.hidden = false;
        studentDashboard.style.display = "block";

        studentDashboard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        closeProfileModal();
    }

    function showDetailedDashboard() {
        if (!detailedDashboard) return;

        detailedDashboard.hidden = false;
        detailedDashboard.style.display = "block";

        detailedDashboard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    if (profileDashboardBtn) {
        profileDashboardBtn.addEventListener("click", showStudentDashboard);
    }

    document.querySelectorAll("[data-open-dashboard]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            showStudentDashboard();
        });
    });

    document.querySelectorAll("[data-open-detailed-dashboard]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            showDetailedDashboard();
        });
    });

    function updateDashboardStudentName(user) {
        const element = $("dashboardStudentName");

        if (element) {
            element.textContent = getStudentDisplayName(user);
        }
    }

    function prepareProgressDashboard() {
        const loading = $("student-dashboard-loading");
        const content = $("student-dashboard-content");
        const empty = $("student-dashboard-empty");
        const error = $("student-dashboard-error");
        const todayDate = $("todayActivityDate");

        if (loading) loading.style.display = "none";
        if (content) content.style.display = "block";

        if (empty) {
            empty.hidden = false;
            empty.style.display = "block";
            empty.textContent =
                "Your learning statistics will appear here as progress tracking is connected.";
        }

        if (error) error.style.display = "none";

        if (todayDate) {
            todayDate.textContent = new Date().toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );
        }
    }

    function updateAuthenticationUI(user) {
        if (currentStudent && studySessionStartedAt) {
            flushStudyTime();
        }

        currentStudent = user || null;

        if (studySessionStartedAt) {
            studySessionStartedAt = Date.now();
        }

        renderStudyTracker();

        const loggedIn = Boolean(user);

        document.querySelectorAll(".student-only").forEach(function (element) {
            element.hidden = !loggedIn;
            element.style.display = loggedIn ? "" : "none";
        });

        document.querySelectorAll(".guest-only").forEach(function (element) {
            element.hidden = loggedIn;
            element.style.display = loggedIn ? "none" : "";
        });

        if (loginBtn) loginBtn.style.display = loggedIn ? "none" : "";
        if (profileBtn) profileBtn.style.display = loggedIn ? "" : "none";
        if (logoutBtn) logoutBtn.style.display = loggedIn ? "" : "none";
        if (getStartedBtn) getStartedBtn.style.display = loggedIn ? "none" : "";

        if (loggedIn) {
            updateDashboardStudentName(user);
            updateProfileInformation(user);
            prepareProgressDashboard();

            console.log("STUDYVERSE AI: Student session active.");
        } else {
            if (studentDashboard) {
                studentDashboard.style.display = "none";
            }

            if (detailedDashboard) {
                detailedDashboard.style.display = "none";
            }

            console.log("STUDYVERSE AI: No active student session.");
        }
    }

    async function initializeStudentAuthentication() {
        if (!supabaseClient) return;

        try {
            const { data, error } =
                await supabaseClient.auth.getSession();

            if (error) throw error;

            updateAuthenticationUI(
                data.session ? data.session.user : null
            );

            supabaseClient.auth.onAuthStateChange(
                function (event, session) {
                    console.log("STUDYVERSE AUTH EVENT:", event);

                    updateAuthenticationUI(
                        session ? session.user : null
                    );
                }
            );
        } catch (error) {
            console.error("Session initialization failed:", error);
        }
    }

    // =====================================================
    // 10. DAILY STUDY TRACKER
    // Browser-local storage
    // =====================================================

    function localDateKey() {
        const date = new Date();

        return (
            date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            String(date.getDate()).padStart(2, "0")
        );
    }

    function trackerStorageKey() {
        const userKey = currentStudent
            ? currentStudent.id
            : "guest";

        return (
            "studyverse_daily_v1_" +
            userKey + "_" +
            localDateKey()
        );
    }

    function loadDailyTracker() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(trackerStorageKey()) || "{}"
            );

            return {
                seconds: Number(saved.seconds) || 0,
                activities: Array.isArray(saved.activities)
                    ? saved.activities
                    : [],
                targets: Array.isArray(saved.targets)
                    ? saved.targets
                    : []
            };
        } catch (error) {
            console.warn("Daily tracker could not be read:", error);

            return {
                seconds: 0,
                activities: [],
                targets: []
            };
        }
    }

    function saveDailyTracker(state) {
        try {
            localStorage.setItem(
                trackerStorageKey(),
                JSON.stringify(state)
            );
        } catch (error) {
            console.warn("Daily tracker could not be saved:", error);
        }
    }

    function formatStudyDuration(seconds) {
        const total = Math.max(0, Math.floor(seconds || 0));

        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const remaining = total % 60;

        if (hours) return hours + "h " + minutes + "m";
        if (minutes) return minutes + "m " + remaining + "s";

        return remaining + "s";
    }

    function recordStudyActivity(description) {
        const state = loadDailyTracker();

        state.activities.unshift({
            text: String(description || "Study activity"),
            time: new Date().toISOString()
        });

        state.activities = state.activities.slice(0, 30);

        saveDailyTracker(state);
        renderStudyTracker();
    }

    function flushStudyTime(force = false) {
        if (!studySessionStartedAt) return;

        if (!force && document.visibilityState === "hidden") {
            return;
        }

        const now = Date.now();

        const elapsed = Math.max(
            0,
            Math.floor((now - studySessionStartedAt) / 1000)
        );

        if (elapsed > 0) {
            const state = loadDailyTracker();

            state.seconds += elapsed;

            saveDailyTracker(state);

            studySessionStartedAt = now;

            renderStudyTracker();
        }
    }

    function updateLiveClock() {
        const now = new Date();

        const time = now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata"
        });

        const date = now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Kolkata"
        });

        ["sv-home-clock", "sv-dashboard-clock"].forEach(function (id) {
            const element = $(id);
            if (element) element.textContent = time;
        });

        ["sv-home-date", "sv-dashboard-date"].forEach(function (id) {
            const element = $(id);
            if (element) element.textContent = date;
        });
    }

    function renderStudyTracker() {
        const state = loadDailyTracker();

        const liveSeconds = state.seconds +
            (
                studySessionStartedAt &&
                document.visibilityState === "visible"
                    ? Math.max(
                        0,
                        Math.floor(
                            (Date.now() - studySessionStartedAt) / 1000
                        )
                    )
                    : 0
            );

        const timeText = formatStudyDuration(liveSeconds);

        ["sv-home-study-time", "sv-today-time"].forEach(function (id) {
            const element = $(id);
            if (element) element.textContent = timeText;
        });

        const activityBox = $("sv-today-activity");

        if (activityBox) {
            activityBox.innerHTML = state.activities.length
                ? state.activities.map(function (item) {
                    const time = new Date(item.time).toLocaleTimeString(
                        "en-IN",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );

                    return (
                        "<div class='today-activity-row'>" +
                            "<span class='activity-dot'></span>" +
                            "<div><strong>" +
                                escapeHTML(item.text) +
                            "</strong><small>" +
                                escapeHTML(time) +
                            "</small></div>" +
                        "</div>"
                    );
                }).join("")
                : "<p class='sv-status'>No study actions recorded yet. Choose an exam or open a chapter to get started.</p>";
        }

        const targetList = $("sv-target-list");
        const targetProgress = $("sv-target-progress");

        const completed = state.targets.filter(function (target) {
            return target.done;
        }).length;

        if (targetProgress) {
            targetProgress.textContent =
                completed + "/" + state.targets.length;
        }

        if (targetList) {
            targetList.innerHTML = state.targets.length
                ? state.targets.map(function (target, index) {
                    return (
                        "<label class='target-row " +
                        (target.done ? "is-done" : "") +
                        "'>" +

                        "<input type='checkbox' data-target-index='" +
                        index + "' " +
                        (target.done ? "checked" : "") +
                        ">" +

                        "<span>" +
                        escapeHTML(target.text) +
                        "</span>" +

                        "<button type='button' class='target-delete' " +
                        "data-delete-target='" + index +
                        "' aria-label='Delete target'>×</button>" +

                        "</label>"
                    );
                }).join("")
                : "<p class='sv-status'>Your checklist is empty. Add your first target above.</p>";
        }
    }

    function initializeStudyTracker() {
        studySessionStartedAt =
            document.visibilityState === "visible"
                ? Date.now()
                : null;

        updateLiveClock();
        renderStudyTracker();

        if ($("sv-today-activity")) {
            recordStudyActivity("Opened Student Dashboard");
        }

        if (studyTimerInterval) {
            clearInterval(studyTimerInterval);
        }

        studyTimerInterval = setInterval(function () {
            updateLiveClock();

            if (document.visibilityState === "visible") {
                flushStudyTime();
            }
        }, 1000);

        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") {
                flushStudyTime(true);
                studySessionStartedAt = null;
            } else if (!studySessionStartedAt) {
                studySessionStartedAt = Date.now();
            }

            renderStudyTracker();
        });

        window.addEventListener("pagehide", function () {
            if (!studySessionStartedAt) return;

            const elapsed = Math.max(
                0,
                Math.floor(
                    (Date.now() - studySessionStartedAt) / 1000
                )
            );

            if (elapsed > 0) {
                const state = loadDailyTracker();
                state.seconds += elapsed;
                saveDailyTracker(state);
            }

            studySessionStartedAt = null;
        });

        const targetForm = $("sv-target-form");
        const targetInput = $("sv-target-input");

        if (targetForm) {
            targetForm.addEventListener("submit", function (event) {
                event.preventDefault();

                const text = targetInput
                    ? targetInput.value.trim()
                    : "";

                if (!text) return;

                const state = loadDailyTracker();

                state.targets.push({
                    text: text,
                    done: false
                });

                saveDailyTracker(state);

                if (targetInput) targetInput.value = "";

                recordStudyActivity("Added today's target: " + text);
                renderStudyTracker();
            });
        }

        const targetList = $("sv-target-list");

        if (targetList) {
            targetList.addEventListener("change", function (event) {
                const index = Number(event.target.dataset.targetIndex);

                if (!Number.isInteger(index)) return;

                const state = loadDailyTracker();

                if (!state.targets[index]) return;

                state.targets[index].done =
                    Boolean(event.target.checked);

                saveDailyTracker(state);

                if (state.targets[index].done) {
                    recordStudyActivity(
                        "Completed target: " + state.targets[index].text
                    );
                } else {
                    renderStudyTracker();
                }
            });

            targetList.addEventListener("click", function (event) {
                const button = event.target.closest("[data-delete-target]");

                if (!button) return;

                const index = Number(button.dataset.deleteTarget);
                const state = loadDailyTracker();

                if (
                    !Number.isInteger(index) ||
                    !state.targets[index]
                ) {
                    return;
                }

                state.targets.splice(index, 1);

                saveDailyTracker(state);
                renderStudyTracker();
            });
        }
    }

    // =====================================================
    // 11. COURSE SEARCH AND FILTERS
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

            const examList = exam.split(/\s+/);

            const matchesFilter =
                activeFilter === "all" ||
                examList.includes(activeFilter);

            const matchesSearch =
                searchData.includes(searchText) ||
                cardText.includes(searchText);

            const visible = matchesFilter && matchesSearch;

            card.style.display = visible ? "" : "none";

            if (visible) visibleCount++;
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
            activeFilter =
                (button.dataset.filter || "all").toLowerCase();

            filterButtons.forEach(function (item) {
                item.classList.remove("active");
                item.setAttribute("aria-pressed", "false");
            });

            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");

            filterCourses();
        });
    });

    document.querySelectorAll("[data-coming]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            showToast(
                "Study materials are being prepared. Stay tuned!"
            );
        });
    });

    // =====================================================
    // 12. DATABASE CONNECTION TEST
    // =====================================================

    async function testStudyverseDatabase() {
        if (!supabaseClient) {
            console.error("Supabase client unavailable.");
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

            console.log("Available examinations:", data);
        } catch (error) {
            console.error(
                "STUDYVERSE AI: Database connection failed:",
                error
            );
        }
    }

    // =====================================================
    // 13. DYNAMIC EXAMINATION AND SUBJECT DASHBOARD
    // =====================================================

    let studyverseExams = [];
    let dashboardPromise = null;

    async function loadStudyverseExamDashboard() {
        const root = $("studyverse-dynamic-dashboard");

        if (!root || !supabaseClient) return;

        const examContainer = $("sv-exam-cards");
        const subjectContainer = $("sv-subject-cards");
        const selectedHeading = $("sv-selected-exam");
        const loading = $("sv-exam-loading");
        const message = $("sv-dashboard-message");

        if (!examContainer || !subjectContainer) return;

        try {
            if (loading) {
                loading.textContent = "Loading examinations...";
            }

            const { data: exams, error: examError } =
                await supabaseClient
                    .from("exams")
                    .select(
                        "id, name, slug, description, is_published"
                    )
                    .eq("is_published", true)
                    .order("name");

            if (examError) throw examError;

            const { data: subjects, error: subjectError } =
                await supabaseClient
                    .from("subjects")
                    .select(
                        "id, exam_id, name, slug, is_published"
                    )
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

            examContainer.innerHTML = studyverseExams.map(
                function (exam, index) {
                    return `
                        <button
                            type="button"
                            class="sv-exam-card ${index === 0 ? "active" : ""}"
                            data-exam-id="${escapeHTML(exam.id)}"
                        >
                            <span class="sv-card-label">EXAMINATION</span>
                            <h3>${escapeHTML(exam.name)}</h3>
                            <p>${escapeHTML(
                                exam.description ||
                                "Explore learning resources."
                            )}</p>
                        </button>
                    `;
                }
            ).join("");

            if (loading) loading.textContent = "";

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
                                <span class="sv-card-label">SUBJECT</span>
                                <h3>${escapeHTML(subject.name)}</h3>
                                <p>Explore chapters and learning resources.</p>
                            </button>
                        `;
                    }
                ).join("");
            }

            if (!examContainer.dataset.listenerAttached) {
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
                        recordStudyActivity(
                            "Selected examination: " + selectedExam.name
                        );

                        showSubjects(
                            selectedExam.id,
                            selectedExam.name
                        );
                    }
                });

                examContainer.dataset.listenerAttached = "true";
            }

            showSubjects(
                studyverseExams[0].id,
                studyverseExams[0].name
            );

            if (message) {
                message.textContent =
                    "Examinations and subjects loaded successfully!";
            }

            console.log(
                "STUDYVERSE AI: Dynamic exam dashboard loaded.",
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

    dashboardPromise = loadStudyverseExamDashboard();

    // =====================================================
    // 14. STATIC EXAM CARDS TO DYNAMIC DASHBOARD
    // =====================================================

    async function selectDynamicExam(selectedCourse) {
        const dashboard = $("studyverse-dynamic-dashboard");

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

        const aliases = {
            "jee": ["jee-main", "jee"],
            "main": ["jee-main", "jee"],
            "jee main": ["jee-main", "jee"],
            "advanced": ["jee-advanced", "advanced"],
            "jee advanced": ["jee-advanced", "advanced"],
            "neet": ["neet-ug", "neet"],
            "neet ug": ["neet-ug", "neet"]
        };

        const possibleSlugs =
            aliases[searchValue] || [searchValue];

        const selectedExam = studyverseExams.find(function (exam) {
            const slug = String(exam.slug || "").toLowerCase();
            const name = String(exam.name || "").toLowerCase();

            return (
                possibleSlugs.includes(slug) ||
                name === searchValue ||
                slug === searchValue
            );
        });

        if (!selectedExam) {
            showToast(
                "The selected examination is not available yet."
            );
            return;
        }

        const card = document.querySelector(
            '.sv-exam-card[data-exam-id="' +
            selectedExam.id +
            '"]'
        );

        if (card) {
            card.click();
            showToast(selectedExam.name + " selected successfully!");
        }
    }

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
    // 15. DYNAMIC CHAPTER LIBRARY
    // =====================================================

    const svSubjectContainer = $("sv-subject-cards");
    const svChapterContainer = $("sv-chapter-cards");
    const svChapterHeading = $("sv-selected-subject");

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

                recordStudyActivity(
                    "Opened subject: " + subjectName
                );

                if (!svChapterContainer || !svChapterHeading) {
                    console.error(
                        "STUDYVERSE AI: Chapter HTML elements are missing."
                    );
                    return;
                }

                if (!supabaseClient) {
                    showToast(
                        "Database connection is unavailable."
                    );
                    return;
                }

                svChapterHeading.textContent =
                    subjectName + " - Loading chapters...";

                svChapterContainer.innerHTML =
                    "<p class='sv-status'>Loading chapters...</p>";

                try {
                    const { data: chapters, error } =
                        await supabaseClient
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
                                        ${escapeHTML(chapter.chapter_number)}
                                    </span>

                                    <h4>
                                        ${escapeHTML(chapter.chapter_name)}
                                    </h4>

                                    <p>
                                        ${escapeHTML(
                                            chapter.description ||
                                            "Explore this chapter."
                                        )}
                                    </p>

                                    <button
                                        type="button"
                                        class="sv-chapter-open"
                                        data-chapter-id="${escapeHTML(chapter.id)}"
                                        data-chapter-name="${escapeHTML(chapter.chapter_name)}"
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
    // 16. CHAPTER NAVIGATION
    // =====================================================

    if (svChapterContainer) {
        svChapterContainer.addEventListener("click", function (event) {
            const button = event.target.closest(".sv-chapter-open");

            if (!button || !svChapterContainer.contains(button)) {
                return;
            }

            const chapterId = button.dataset.chapterId;
            const chapterName = button.dataset.chapterName;

            if (!chapterId) {
                showToast(
                    "Unable to open this chapter. Please try again."
                );
                return;
            }

            recordStudyActivity(
                "Opened chapter: " + (chapterName || "Chapter")
            );

            window.location.href =
                "./chapter.html?chapter_id=" +
                encodeURIComponent(chapterId);
        });
    }

    // =====================================================
    // 17. SMOOTH SCROLL
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
    // 18. FOOTER YEAR
    // =====================================================

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // =====================================================
    // 19. INITIALIZE WEBSITE
    // =====================================================

    filterCourses();

    setAuthMode("login");

    await initializeStudentAuthentication();

    initializeStudyTracker();

    testStudyverseDatabase();

    console.log(
        "%cSTUDYVERSE AI",
        "color:#8b5cf6;font-size:24px;font-weight:bold;"
    );

    console.log(
        "%cVersion 6.0 initialized successfully!",
        "color:#22c55e;font-size:14px;"
    );

});
