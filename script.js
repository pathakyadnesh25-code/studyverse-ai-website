
/* =========================================================
   STUDYVERSE AI — SCRIPT.JS
   Version 5.0

   FEATURES
   1. Mobile navigation
   2. Supabase connection
   3. Complete student registration
   4. Student login
   5. Password confirmation
   6. Registration details in Auth metadata
   7. Persistent login sessions
   8. Logout
   9. Student profile
   10. Dashboard foundation
   11. Course search and filters
   12. Dynamic exam dashboard
   13. Dynamic subject loading
   14. Dynamic chapter loading
   15. Chapter navigation
   16. Toast notifications

   SECURITY
   - Uses browser-safe Supabase publishable key.
   - Never uses service_role or secret keys.
   - Never stores passwords locally.
   - Does not write to unverified database columns.
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

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
    const studentPassword = document.getElementById("studentPassword");

    // Registration fields
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
        }, 3500);
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

    // =====================================================
    // 3. SUPABASE CONNECTION
    // =====================================================

    const STUDYVERSE_SUPABASE_URL =
        "https://mtxkvupfczhglaqghcbc.supabase.co";

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
    // 5. LOGIN / REGISTRATION MODAL
    // =====================================================

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

        if (studentEmail) {
            studentEmail.focus();
        }

    }

    function closeLoginModal() {

        if (!loginModal) return;

        loginModal.classList.remove("show");
        loginModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

    }

    // Use the hidden property so the HTML hidden attribute
    // and JavaScript visibility remain synchronized.

    function setRegistrationField(group, visible) {

        if (!group) return;

        group.hidden = !visible;
        group.style.display = visible ? "block" : "none";

    }

    function setAuthMode(mode) {

        authMode = mode;
        clearAuthMessage();

        const isRegister = mode === "register";

        // Show or hide registration-only fields.

        setRegistrationField(nameFieldGroup, isRegister);
        setRegistrationField(targetExamGroup, isRegister);
        setRegistrationField(academicLevelGroup, isRegister);
        setRegistrationField(preferredLanguageGroup, isRegister);
        setRegistrationField(confirmPasswordGroup, isRegister);

        // Required fields.

        if (studentName) studentName.required = isRegister;
        if (targetExam) targetExam.required = isRegister;
        if (academicLevel) academicLevel.required = isRegister;
        if (preferredLanguage) preferredLanguage.required = isRegister;
        if (confirmPassword) confirmPassword.required = isRegister;

        // Password autocomplete changes by mode.

        if (studentPassword) {
            studentPassword.autocomplete =
                isRegister ? "new-password" : "current-password";
        }

        // Modal text and buttons.

        if (isRegister) {

            if (authModeText) {
                authModeText.textContent =
                    "Create Your STUDYVERSE AI Student Account";
            }

            if (authSubmitBtn) {
                authSubmitBtn.textContent = "Create Account";
            }

            if (authSwitchLabel) {
                authSwitchLabel.textContent =
                    "Already have an account?";
            }

            if (authSwitchBtn) {
                authSwitchBtn.textContent = "Login";
            }

        } else {

            if (authModeText) {
                authModeText.textContent =
                    "Login to STUDYVERSE AI";
            }

            if (authSubmitBtn) {
                authSubmitBtn.textContent = "Login";
            }

            if (authSwitchLabel) {
                authSwitchLabel.textContent =
                    "Don't have an account?";
            }

            if (authSwitchBtn) {
                authSwitchBtn.textContent = "Create Account";
            }

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
    // 6. STUDENT AUTHENTICATION
    // =====================================================

    function getStudentDisplayName(user) {

        if (!user) return "Student";

        const metadata = user.user_metadata || {};

        return (
            metadata.full_name ||
            metadata.name ||
            (user.email ? user.email.split("@")[0] : "Student")
        );

    }

    // -----------------------------------------------------
    // REGISTER STUDENT
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // LOGIN STUDENT
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // LOGOUT STUDENT
    // -----------------------------------------------------

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

    // =====================================================
    // 7. REGISTRATION AND LOGIN FORM SUBMISSION
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

            const selectedAcademicLevel = academicLevel
                ? academicLevel.value
                : "";

            const selectedLanguage = preferredLanguage
                ? preferredLanguage.value
                : "";

            const repeatedPassword = confirmPassword
                ? confirmPassword.value
                : "";

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // -------------------------------------------------
            // COMMON VALIDATION
            // -------------------------------------------------

            if (!email || !emailPattern.test(email)) {

                showAuthMessage(
                    "Please enter a valid email address.",
                    true
                );

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

            // -------------------------------------------------
            // REGISTRATION VALIDATION
            // -------------------------------------------------

            if (authMode === "register") {

                if (!name || name.length < 2) {

                    showAuthMessage(
                        "Please enter your full name.",
                        true
                    );

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
                        confirmPassword.focus();
                        confirmPassword.value = "";
                    }

                    return;

                }

            }

            // -------------------------------------------------
            // DISABLE SUBMIT BUTTON
            // -------------------------------------------------

            if (authSubmitBtn) {

                authSubmitBtn.disabled = true;

                authSubmitBtn.textContent =
                    authMode === "register"
                        ? "Creating Account..."
                        : "Logging in...";

            }

            try {

                // =============================================
                // REGISTRATION
                // =============================================

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

                        showToast(
                            "Welcome to STUDYVERSE AI, " + name + "!"
                        );

                        updateAuthenticationUI(result.user);

                    } else {

                        // Email confirmation is enabled.
                        // Do not treat an unconfirmed account
                        // as an active student session.

                        loginForm.reset();

                        showAuthMessage(
                            "Your account has been created successfully! Please check your email and confirm your account before logging in."
                        );

                    }

                } else {

                    // =========================================
                    // LOGIN
                    // =========================================

                    const result = await loginStudent(
                        email,
                        password
                    );

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

                console.error(
                    "STUDYVERSE AI: Authentication error:",
                    error
                );

                showAuthMessage(
                    error.message ||
                    "Authentication failed. Please try again.",
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

    // =====================================================
    // 9. STUDENT DASHBOARD
    // =====================================================

    function showStudentDashboard() {

        if (studentDashboard) {

            studentDashboard.hidden = false;
            studentDashboard.style.display = "block";

            studentDashboard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

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

        profileDashboardBtn.addEventListener("click", function () {

            showStudentDashboard();

        });

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

        const dashboardName = document.getElementById(
            "dashboardStudentName"
        );

        if (dashboardName) {
            dashboardName.textContent = getStudentDisplayName(user);
        }

    }

    // Dashboard statistics remain placeholders until
    // the actual learning_progress schema is verified.

    function prepareProgressDashboard() {

        const loading = document.getElementById(
            "student-dashboard-loading"
        );

        const content = document.getElementById(
            "student-dashboard-content"
        );

        const empty = document.getElementById(
            "student-dashboard-empty"
        );

        const error = document.getElementById(
            "student-dashboard-error"
        );

        if (loading) loading.style.display = "none";

        if (content) content.style.display = "block";

        if (empty) {

            empty.hidden = false;
            empty.style.display = "block";

            empty.textContent =
                "Your learning statistics will appear here after progress tracking is connected.";

        }

        if (error) error.style.display = "none";

        const todayDate = document.getElementById(
            "todayActivityDate"
        );

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

    function updateProfileInformation(user) {

        if (!user) return;

        const metadata = user.user_metadata || {};

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

        // Registration details are currently available
        // through Auth metadata. We can display them in
        // the profile UI in a later profile enhancement.

        console.log(
            "STUDYVERSE AI: Student profile metadata:",
            {
                targetExam: metadata.target_exam || "Not provided",
                academicLevel: metadata.academic_level || "Not provided",
                preferredLanguage: metadata.preferred_language || "Not provided"
            }
        );

    }

    // =====================================================
    // 10. AUTHENTICATION UI
    // =====================================================

    let currentStudent = null;

    function updateAuthenticationUI(user) {

        currentStudent = user || null;

        const loggedIn = Boolean(user);

        document.querySelectorAll(".student-only").forEach(function (element) {

            element.hidden = !loggedIn;

            if (loggedIn) {
                element.style.display = "";
            } else {
                element.style.display = "none";
            }

        });

        document.querySelectorAll(".guest-only").forEach(function (element) {

            element.hidden = loggedIn;

            if (loggedIn) {
                element.style.display = "none";
            } else {
                element.style.display = "";
            }

        });

        if (loginBtn) {
            loginBtn.style.display = loggedIn ? "none" : "";
        }

        if (profileBtn) {
            profileBtn.style.display = loggedIn ? "" : "none";
        }

        if (logoutBtn) {
            logoutBtn.style.display = loggedIn ? "" : "none";
        }

        if (getStartedBtn) {
            getStartedBtn.style.display = loggedIn ? "none" : "";
        }

        if (loggedIn) {

            updateDashboardStudentName(user);
            updateProfileInformation(user);
            prepareProgressDashboard();

            console.log(
                "STUDYVERSE AI: Student session active.",
                {
                    email: user.email,
                    userId: user.id
                }
            );

        } else {

            if (studentDashboard) {
                studentDashboard.style.display = "none";
            }

            if (detailedDashboard) {
                detailedDashboard.style.display = "none";
            }

            console.log(
                "STUDYVERSE AI: No active student session."
            );

        }

    }

    // =====================================================
    // 11. RESTORE STUDENT SESSION
    // =====================================================

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

                    console.log(
                        "STUDYVERSE AUTH EVENT:",
                        event
                    );

                    updateAuthenticationUI(
                        session ? session.user : null
                    );

                }
            );

        } catch (error) {

            console.error(
                "STUDYVERSE AI: Session initialization failed:",
                error
            );

        }

    }

    // =====================================================
    // 12. COURSE SEARCH AND FILTER
    // =====================================================

    let activeFilter = "all";

    function filterCourses() {

        const searchText = courseSearch
            ? courseSearch.value.toLowerCase().trim()
            : "";

        let visibleCount = 0;

        courseCards.forEach(function (card) {

            const exam = (
                card.dataset.exam || ""
            ).toLowerCase();

            const searchData = (
                card.dataset.search || ""
            ).toLowerCase();

            const cardText = card.textContent.toLowerCase();

            const examList = exam.split(/\s+/);

            const matchesFilter =
                activeFilter === "all" ||
                examList.includes(activeFilter);

            const matchesSearch =
                searchData.includes(searchText) ||
                cardText.includes(searchText);

            const shouldShow =
                matchesFilter && matchesSearch;

            card.style.display = shouldShow ? "" : "none";

            if (shouldShow) visibleCount++;

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
    // 13. UPCOMING COURSE MATERIAL BUTTONS
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
    // 14. SUPABASE DATABASE CONNECTION TEST
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
    // 15. DYNAMIC EXAM DASHBOARD
    // =====================================================

    let studyverseExams = [];
    let dashboardPromise = null;

    async function loadStudyverseExamDashboard() {

        const root = document.getElementById(
            "studyverse-dynamic-dashboard"
        );

        if (!root || !supabaseClient) return;

        const examContainer = document.getElementById(
            "sv-exam-cards"
        );

        const subjectContainer = document.getElementById(
            "sv-subject-cards"
        );

        const selectedHeading = document.getElementById(
            "sv-selected-exam"
        );

        const loading = document.getElementById(
            "sv-exam-loading"
        );

        const message = document.getElementById(
            "sv-dashboard-message"
        );

        if (!examContainer || !subjectContainer) return;

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

    dashboardPromise = loadStudyverseExamDashboard();

    // =====================================================
    // 16. CONNECT STATIC EXAM CARDS TO DYNAMIC DASHBOARD
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

        const possibleSlugs =
            examAliases[searchValue] || [searchValue];

        const selectedExam = studyverseExams.find(
            function (exam) {

                const slug = String(
                    exam.slug || ""
                ).toLowerCase();

                const name = String(
                    exam.name || ""
                ).toLowerCase();

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
    // 17. DYNAMIC CHAPTER LIBRARY
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

                const subjectId =
                    subjectCard.dataset.subjectId;

                const subjectName =
                    subjectCard.dataset.subjectName;

                if (!subjectId) return;

                if (!svChapterContainer || !svChapterHeading) {

                    console.error(
                        "STUDYVERSE AI: Chapter HTML elements are missing!"
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
    // 18. CHAPTER NAVIGATION
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

                const chapterId =
                    button.dataset.chapterId;

                const chapterName =
                    button.dataset.chapterName;

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

                window.location.href =
                    "./chapter.html?chapter_id=" +
                    encodeURIComponent(chapterId);

            }
        );

    }

    // =====================================================
    // 19. SMOOTH SCROLL
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
    // 20. FOOTER YEAR
    // =====================================================

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // =====================================================
    // 21. INITIALIZE WEBSITE
    // =====================================================

    filterCourses();

    // Default to login mode when the page loads.
    setAuthMode("login");

    // Restore student session.
    await initializeStudentAuthentication();

    // Test database connection.
    testStudyverseDatabase();

    console.log(
        "%cSTUDYVERSE AI",
        "color:#8b5cf6;font-size:24px;font-weight:bold;"
    );

    console.log(
        "%cVersion 5.0 initialized successfully!",
        "color:#22c55e;font-size:14px;"
    );

});
