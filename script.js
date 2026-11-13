/* =========================================================
   STUDYVERSE AI — SCRIPT.JS
   Version 5.0
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    // 1. SELECT WEBSITE ELEMENTS
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    const loginModal = document.getElementById("loginModal");
    const modalClose = document.getElementById("modalClose");
    const loginForm = document.getElementById("loginForm");

    const studentName = document.getElementById("studentName");
    const studentEmail = document.getElementById("studentEmail");
    const studentPassword = document.getElementById("studentPassword");

    const nameFieldGroup = document.getElementById("nameFieldGroup");
    const targetExamGroup = document.getElementById("targetExamGroup");
    const academicLevelGroup = document.getElementById("academicLevelGroup");
    const preferredLanguageGroup = document.getElementById("preferredLanguageGroup");
    const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");

    const targetExam = document.getElementById("targetExam");
    const academicLevel = document.getElementById("academicLevel");
    const preferredLanguage = document.getElementById("preferredLanguage");
    const confirmPassword = document.getElementById("confirmPassword");

    const authModeText = document.getElementById("authModeText");
    const authSubmitBtn = document.getElementById("authSubmitBtn");
    const authMessage = document.getElementById("authMessage");
    const authSwitchLabel = document.getElementById("authSwitchLabel");
    const authSwitchBtn = document.getElementById("authSwitchBtn");

    const loginBtn = document.getElementById("loginBtn");
    const getStartedBtn = document.getElementById("getStartedBtn");
    const profileBtn = document.getElementById("profileBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const profileModal = document.getElementById("profileModal");
    const profileModalClose = document.getElementById("profileModalClose");
    const profileDashboardBtn = document.getElementById("profileDashboardBtn");

    const profileStudentName = document.getElementById("profileStudentName");
    const profileStudentEmail = document.getElementById("profileStudentEmail");
    const profileAccountStatus = document.getElementById("profileAccountStatus");
    const profileCreatedAt = document.getElementById("profileCreatedAt");

    const courseSearch = document.getElementById("courseSearch");
    const courseGrid = document.getElementById("courseGrid");
    const emptyState = document.getElementById("emptyState");

    const toast = document.getElementById("toast");
    const year = document.getElementById("year");

    const filterButtons = document.querySelectorAll(".filter-btn");
    const courseCards = document.querySelectorAll(".course-card");

    const studentDashboard = document.getElementById("student-dashboard");
    const detailedDashboard = document.getElementById("detailed-dashboard");

    // 2. TOAST NOTIFICATION SYSTEM
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
        }, 3500);
    }

    // 3. DAILY WEBSITE TIME, ACTIVITY AND PERSONAL TARGETS
    // This first version stores daily tracking in this browser.
    let studySessionStartedAt = null;
    let studyTimerInterval = null;

    function localDateKey() {
        const d = new Date();
        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    function trackerStorageKey() {
        const userKey = currentStudent && currentStudent.id
            ? currentStudent.id
            : "guest";

        return "studyverse_daily_v1_" + userKey + "_" + localDateKey();
    }

    function loadDailyTracker() {
        try {
            const saved = JSON.parse(localStorage.getItem(trackerStorageKey()) || "{}");

            return {
                seconds: Number(saved.seconds) || 0,
                activities: Array.isArray(saved.activities) ? saved.activities : [],
                targets: Array.isArray(saved.targets) ? saved.targets : []
            };
        } catch (error) {
            console.warn("Daily tracker storage could not be read:", error);
            return { seconds: 0, activities: [], targets: [] };
        }
    }

    function saveDailyTracker(state) {
        try {
            localStorage.setItem(trackerStorageKey(), JSON.stringify(state));
        } catch (error) {
            console.warn("Daily tracker storage could not be saved:", error);
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

    function escapeTrackerText(value) {
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
        if (!studySessionStartedAt ||
            (!force && document.visibilityState === "hidden")) {
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

    function renderStudyTracker() {
        const state = loadDailyTracker();

        const liveSeconds = state.seconds +
            (studySessionStartedAt && document.visibilityState === "visible"
                ? Math.max(0, Math.floor((Date.now() - studySessionStartedAt) / 1000))
                : 0);

        const timeText = formatStudyDuration(liveSeconds);

        ["sv-home-study-time", "sv-today-time"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.textContent = timeText;
        });

        const activityBox = document.getElementById("sv-today-activity");

        if (activityBox) {
            activityBox.innerHTML = state.activities.length
                ? state.activities.map(function (item) {
                    const time = new Date(item.time).toLocaleTimeString(
                        "en-IN",
                        { hour: "2-digit", minute: "2-digit" }
                    );

                    return "<div class='today-activity-row'>" +
                        "<span class='activity-dot'></span><div><strong>" +
                        escapeTrackerText(item.text) +
                        "</strong><small>" + time +
                        "</small></div></div>";
                }).join("")
                : "<p class='sv-status'>No study actions recorded yet. Choose an exam or open a chapter to get started.</p>";
        }

        const targetList = document.getElementById("sv-target-list");
        const targetProgress = document.getElementById("sv-target-progress");

        const completed = state.targets.filter(function (target) {
            return target.done;
        }).length;

        if (targetProgress) {
            targetProgress.textContent = completed + "/" + state.targets.length;
        }

        if (targetList) {
            targetList.innerHTML = state.targets.length
                ? state.targets.map(function (target, index) {
                    return "<label class='target-row " +
                        (target.done ? "is-done" : "") + "'>" +
                        "<input type='checkbox' data-target-index='" + index + "' " +
                        (target.done ? "checked" : "") + ">" +
                        "<span>" + escapeTrackerText(target.text) + "</span>" +
                        "<button type='button' class='target-delete' data-delete-target='" +
                        index + "' aria-label='Delete target'>×</button></label>";
                }).join("")
                : "<p class='sv-status'>Your checklist is empty. Add your first target above.</p>";
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
            const el = document.getElementById(id);
            if (el) el.textContent = time;
        });

        ["sv-home-date", "sv-dashboard-date"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.textContent = date;
        });
    }

    function initializeStudyTracker() {
        studySessionStartedAt =
            document.visibilityState === "visible" ? Date.now() : null;

        updateLiveClock();
        renderStudyTracker();

        if (document.getElementById("sv-today-activity")) {
            recordStudyActivity("Opened Student Dashboard");
        }

        if (studyTimerInterval) clearInterval(studyTimerInterval);

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
            if (studySessionStartedAt) {
                const now = Date.now();
                const elapsed = Math.max(
                    0,
                    Math.floor((now - studySessionStartedAt) / 1000)
                );

                if (elapsed) {
                    const state = loadDailyTracker();
                    state.seconds += elapsed;
                    saveDailyTracker(state);
                }

                studySessionStartedAt = null;
            }
        });

        const targetForm = document.getElementById("sv-target-form");
        const targetInput = document.getElementById("sv-target-input");

        targetForm?.addEventListener("submit", function (event) {
            event.preventDefault();

            const text = targetInput ? targetInput.value.trim() : "";
            if (!text) return;

            const state = loadDailyTracker();
            state.targets.push({ text: text, done: false });
            saveDailyTracker(state);

            if (targetInput) targetInput.value = "";

            recordStudyActivity("Added today's target: " + text);
            renderStudyTracker();
        });

        document.getElementById("sv-target-list")?.addEventListener(
            "change",
            function (event) {
                const index = Number(event.target.dataset.targetIndex);
                if (!Number.isInteger(index)) return;

                const state = loadDailyTracker();
                if (!state.targets[index]) return;

                state.targets[index].done = Boolean(event.target.checked);
                saveDailyTracker(state);

                if (state.targets[index].done) {
                    recordStudyActivity(
                        "Completed target: " + state.targets[index].text
                    );
                } else {
                    renderStudyTracker();
                }
            }
        );

        document.getElementById("sv-target-list")?.addEventListener(
            "click",
            function (event) {
                const button = event.target.closest("[data-delete-target]");
                if (!button) return;

                const index = Number(button.dataset.deleteTarget);
                const state = loadDailyTracker();

                if (!Number.isInteger(index) || !state.targets[index]) return;

                state.targets.splice(index, 1);
                saveDailyTracker(state);
                renderStudyTracker();
            }
        );
    }

    function showAuthMessage(message, isError = false) {
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.style.display = "block";
            authMessage.style.color = isError ? "#ef4444" : "#22c55e";
        }

        console.log("STUDYVERSE AUTH:", message);
    }

    function clearAuthMessage() {
        if (authMessage) {
            authMessage.textContent = "";
            authMessage.style.display = "none";
        }
    }

    // 4. SUPABASE CONNECTION
    const STUDYVERSE_SUPABASE_URL =
        "https://mtxkvupfczhglaqghcbc.supabase.co";

    const STUDYVERSE_SUPABASE_KEY =
        "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

    if (!window.studyverseSupabase) {
        if (!window.supabase) {
            console.error("STUDYVERSE AI: Supabase library not loaded!");
        } else {
            window.studyverseSupabase = window.supabase.createClient(
                STUDYVERSE_SUPABASE_URL,
                STUDYVERSE_SUPABASE_KEY
            );

            console.log(
                "STUDYVERSE AI: Supabase client initialized successfully!"
            );
        }
    }

    const supabaseClient = window.studyverseSupabase;

    // 5. MOBILE NAVIGATION
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
            if (!navLinks.contains(event.target) &&
                !menuToggle.contains(event.target)) {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    // 6. LOGIN / REGISTRATION MODAL
    let authMode = "login";

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

    function setRegistrationField(group, visible) {
        if (!group) return;

        group.hidden = !visible;
        group.style.display = visible ? "block" : "none";
    }

    function setAuthMode(mode) {
        authMode = mode;
        clearAuthMessage();

        const isRegister = mode === "register";

        setRegistrationField(nameFieldGroup, isRegister);
        setRegistrationField(targetExamGroup, isRegister);
        setRegistrationField(academicLevelGroup, isRegister);
        setRegistrationField(preferredLanguageGroup, isRegister);
        setRegistrationField(confirmPasswordGroup, isRegister);

        if (studentName) studentName.required = isRegister;
        if (targetExam) targetExam.required = isRegister;
        if (academicLevel) academicLevel.required = isRegister;
        if (preferredLanguage) preferredLanguage.required = isRegister;
        if (confirmPassword) confirmPassword.required = isRegister;

        if (studentPassword) {
            studentPassword.autocomplete =
                isRegister ? "new-password" : "current-password";
        }

        if (isRegister) {
            if (authModeText) {
                authModeText.textContent =
                    "Create Your STUDYVERSE AI Student Account";
            }

            if (authSubmitBtn) authSubmitBtn.textContent = "Create Account";
            if (authSwitchLabel) {
                authSwitchLabel.textContent = "Already have an account?";
            }
            if (authSwitchBtn) authSwitchBtn.textContent = "Login";
        } else {
            if (authModeText) {
                authModeText.textContent = "Login to STUDYVERSE AI";
            }

            if (authSubmitBtn) authSubmitBtn.textContent = "Login";
            if (authSwitchLabel) {
                authSwitchLabel.textContent = "Don't have an account?";
            }
            if (authSwitchBtn) authSwitchBtn.textContent = "Create Account";
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
        const button = document.getElementById(id);

        if (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                setAuthMode("login");
                openLoginModal();
            });
        }
    });

    if (modalClose) modalClose.addEventListener("click", closeLoginModal);

    if (loginModal) {
        loginModal.addEventListener("click", function (event) {
            if (event.target === loginModal) closeLoginModal();
        });
    }

    if (authSwitchBtn) {
        authSwitchBtn.addEventListener("click", function () {
            setAuthMode(authMode === "login" ? "register" : "login");
        });
    }

    // 7. STUDENT AUTHENTICATION
    function getStudentDisplayName(user) {
        if (!user) return "Student";

        const metadata = user.user_metadata || {};

        return metadata.full_name ||
            metadata.name ||
            (user.email ? user.email.split("@")[0] : "Student");
    }

    async function registerStudent(details) {
        if (!supabaseClient) {
            throw new Error("Supabase connection is unavailable.");
        }

        const { data, error } = await supabaseClient.auth.signUp({
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

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        return data;
    }

    async function logoutStudent() {
        if (!supabaseClient) return;

        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("STUDYVERSE AI: Logout error:", error);
            showToast("Unable to logout. Please try again.");
            return;
        }

        closeProfileModal();
        closeLoginModal();
        showToast("You have logged out successfully.");
        updateAuthenticationUI(null);
    }

    // 8. REGISTRATION AND LOGIN FORM SUBMISSION
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            clearAuthMessage();

            const name = studentName ? studentName.value.trim() : "";
            const email = studentEmail
                ? studentEmail.value.trim().toLowerCase()
                : "";
            const password = studentPassword ? studentPassword.value : "";

            const selectedExam = targetExam ? targetExam.value : "";
            const selectedAcademicLevel = academicLevel
                ? academicLevel.value
                : "";
            const selectedLanguage = preferredLanguage
                ? preferredLanguage.value
                : "";
            const repeatedPassword = confirmPassword
                ? confirmPassword.value
                : "";

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !emailPattern.test(email)) {
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
                showAuthMessage("Database connection is unavailable.", true);
                return;
            }

            if (authMode === "register") {
                if (!name || name.length < 2) {
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

                if (!selectedAcademicLevel) {
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
                    showAuthMessage("Please confirm your password.", true);
                    if (confirmPassword) confirmPassword.focus();
                    return;
                }

                if (password !== repeatedPassword) {
                    showAuthMessage(
                        "Passwords do not match. Please try again.",
                        true
                    );

                    if (confirmPassword) {
                        confirmPassword.focus();
                        confirmPassword.value = "";
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
                        academicLevel: selectedAcademicLevel,
                        preferredLanguage: selectedLanguage
                    });

                    if (result.session) {
                        loginForm.reset();
                        closeLoginModal();
                        showToast("Welcome to STUDYVERSE AI, " + name + "!");
                        updateAuthenticationUI(result.user);
                    } else {
                        loginForm.reset();
                        showAuthMessage(
                            "Your account has been created successfully! Please check your email and confirm your account before logging in."
                        );
                    }
                } else {
                    const result = await loginStudent(email, password);

                    loginForm.reset();
                    closeLoginModal();

                    showToast(
                        "Welcome back, " +
                        getStudentDisplayName(result.user) +
                        "!"
                    );

                    updateAuthenticationUI(result.user);
                }
            } catch (error) {
                console.error("STUDYVERSE AI: Authentication error:", error);

                showAuthMessage(
                    error.message ||
                    "Authentication failed. Please try again.",
                    true
                );
            } finally {
                if (authSubmitBtn) {
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.textContent =
                        authMode === "register" ? "Create Account" : "Login";
                }
            }
        });
    }

    // The rest of script.js continues in Part 2.
