
/* =========================================================
   STUDYVERSE AI — MOCK TEST DASHBOARD
   Version 3.0
   Connected to the actual Supabase schema
========================================================= */

(() => {
    "use strict";

    const supabaseClient = window.studyverseSupabase;

    const state = {
        tests: [],
        questionCounts: {},
        selectedExam: "all",
        selectedCategory: "all",
        search: "",
        selectedTest: null
    };

    const $ = (selector) => document.querySelector(selector);

    const elements = {
        loading: $("#mockTestsLoading"),
        grid: $("#mockTestGrid"),
        empty: $("#mockTestsEmpty"),
        error: $("#mockTestsError"),
        errorMessage: $("#mockTestsErrorMessage"),

        totalTests: $("#totalMockTests"),
        totalQuestions: $("#totalQuestions"),
        totalAttempts: $("#totalAttempts"),
        averageScore: $("#averageScore"),

        search: $("#mockTestSearch"),

        examFilter: $("#activeExamFilter"),
        categoryFilter: $("#activeCategoryFilter"),

        modal: $("#testInstructionsModal"),
        modalTitle: $("#modalTestTitle"),
        modalDescription: $("#modalTestDescription"),
        modalExam: $("#modalExam"),
        modalDuration: $("#modalDuration"),
        modalQuestions: $("#modalQuestions"),
        modalMarks: $("#modalMarks"),

        startButton: $("#confirmTestStart"),
        closeButton: $("#closeTestModal"),
        cancelButton: $("#cancelTestStart"),

        resetButton: $("#resetMockFilters"),
        retryButton: $("#retryMockTests"),

        notification: $("#mtNotification")
    };

    const examNames = {
        "all": "All Examinations",
        "jee main": "JEE Main",
        "jee advanced": "JEE Advanced",
        "neet ug": "NEET UG"
    };

    const categoryNames = {
        all: "All Tests",
        full: "Full Syllabus",
        subject: "Subject Wise",
        chapter: "Chapter Wise"
    };

    function notify(message) {
        if (!elements.notification) {
            console.log(message);
            return;
        }

        elements.notification.textContent = message;
        elements.notification.classList.add("show");

        window.setTimeout(() => {
            elements.notification.classList.remove("show");
        }, 3000);
    }

    function setLoading(show) {
        if (elements.loading) {
            elements.loading.hidden = !show;
        }
    }

    function showError(message) {
        setLoading(false);

        if (elements.errorMessage) {
            elements.errorMessage.textContent = message;
        }

        if (elements.error) {
            elements.error.hidden = false;
        }

        if (elements.grid) {
            elements.grid.replaceChildren();
        }

        if (elements.empty) {
            elements.empty.hidden = true;
        }
    }

    function normalize(value) {
        return String(value ?? "").trim().toLowerCase();
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function formatDuration(minutes) {
        const value = Number(minutes) || 0;

        if (value < 60) {
            return `${value} minutes`;
        }

        const hours = Math.floor(value / 60);
        const remaining = value % 60;

        return remaining
            ? `${hours} hr ${remaining} min`
            : `${hours} hr`;
    }

    function getCategory(test) {
        return test.chapter_id
            ? "chapter"
            : "full";
    }

    function getExamName(test) {
        return test.exams?.name || "Examination";
    }

    function getChapterName(test) {
        return test.chapters?.chapter_name || "";
    }

    async function loadTests() {
        if (!supabaseClient) {
            showError(
                "Supabase client is unavailable. Check supabase.js and script loading order."
            );
            return;
        }

        setLoading(true);

        if (elements.error) {
            elements.error.hidden = true;
        }

        if (elements.empty) {
            elements.empty.hidden = true;
        }

        try {
            const { data, error } = await supabaseClient
                .from("mock_tests")
                .select(`
                    id,
                    exam_id,
                    chapter_id,
                    title,
                    description,
                    duration_minutes,
                    total_marks,
                    is_published,
                    created_at,
                    exams(name),
                    chapters(chapter_name, subject_id)
                `)
                .eq("is_published", true)
                .order("created_at", { ascending: false });

            if (error) {
                throw error;
            }

            state.tests = data || [];
            state.questionCounts = {};

            if (state.tests.length > 0) {
                const { data: questions, error: questionError } =
                    await supabaseClient
                        .from("mock_test_questions")
                        .select("id,mock_test_id")
                        .eq("is_published", true);

                if (questionError) {
                    throw questionError;
                }

                (questions || []).forEach(question => {
                    const testId = question.mock_test_id;

                    state.questionCounts[testId] =
                        (state.questionCounts[testId] || 0) + 1;
                });
            }

            updateStatistics();
            applyFilters();

            console.log(
                "STUDYVERSE AI: Mock tests loaded:",
                state.tests.length
            );

        } catch (error) {
            console.error("MOCK TEST DATABASE ERROR:", error);

            showError(
                error.message ||
                "Unable to retrieve mock tests. Check your Supabase permissions."
            );
        } finally {
            setLoading(false);
        }
    }

    function updateStatistics() {
        const totalTests = state.tests.length;

        const totalQuestions = state.tests.reduce(
            (sum, test) => {
                return sum + (
                    state.questionCounts[test.id] || 0
                );
            },
            0
        );

        if (elements.totalTests) {
            elements.totalTests.textContent = totalTests;
        }

        if (elements.totalQuestions) {
            elements.totalQuestions.textContent = totalQuestions;
        }

        // Attempt statistics will be connected after
        // secure attempt-history access is configured.
        if (elements.totalAttempts) {
            elements.totalAttempts.textContent = "--";
        }

        if (elements.averageScore) {
            elements.averageScore.textContent = "--";
        }
    }

    function updateFilterLabels() {
        if (elements.examFilter) {
            elements.examFilter.textContent =
                examNames[normalize(state.selectedExam)] ||
                state.selectedExam;
        }

        if (elements.categoryFilter) {
            elements.categoryFilter.textContent =
                categoryNames[state.selectedCategory] ||
                "All Tests";
        }
    }

    function applyFilters() {
        const filtered = state.tests.filter(test => {
            const exam = normalize(getExamName(test));
            const category = getCategory(test);

            const examMatch =
                state.selectedExam === "all" ||
                exam === normalize(state.selectedExam);

            const categoryMatch =
                state.selectedCategory === "all" ||
                category === state.selectedCategory;

            const searchableText = [
                test.title,
                test.description,
                getExamName(test),
                getChapterName(test)
            ].join(" ").toLowerCase();

            const searchMatch =
                !state.search ||
                searchableText.includes(state.search);

            return examMatch && categoryMatch && searchMatch;
        });

        updateFilterLabels();
        renderTests(filtered);

        // Subject-wise classification cannot be derived
        // reliably from the current mock_tests columns.
        if (state.selectedCategory === "subject") {
            notify(
                "Subject-wise test classification needs an additional database field."
            );
        }
    }

    function createTestCard(test) {
        const card = document.createElement("article");
        card.className = "mt-test-card";

        const exam = getExamName(test);
        const chapter = getChapterName(test);
        const category = getCategory(test);
        const count = state.questionCounts[test.id] || 0;

        const categoryLabel =
            categoryNames[category] || "Mock Test";

        const meta = document.createElement("div");
        meta.className = "mt-test-meta";

        const categoryTag = document.createElement("span");
        categoryTag.textContent = categoryLabel;

        const examTag = document.createElement("span");
        examTag.textContent = exam;

        meta.append(categoryTag, examTag);

        const title = document.createElement("h3");
        title.textContent = test.title;

        const description = document.createElement("p");
        description.textContent =
            test.description || "Prepare with this practice test.";

        const details = document.createElement("div");
        details.className = "mt-test-details";

        const duration = document.createElement("span");
        duration.textContent =
            `⏱ ${formatDuration(test.duration_minutes)}`;

        const questions = document.createElement("span");
        questions.textContent = `📝 ${count} Questions`;

        const marks = document.createElement("span");
        marks.textContent =
            `🎯 ${Number(test.total_marks || 0)} Marks`;

        details.append(duration, questions, marks);

        card.append(meta, title, description);

        if (chapter) {
            const chapterText = document.createElement("p");
            chapterText.className = "mt-test-chapter";
            chapterText.textContent = `Chapter: ${chapter}`;
            card.append(chapterText);
        }

        card.append(details);

        const action = document.createElement("button");
        action.type = "button";
        action.className = "mt-primary-button";
        action.textContent = "View Test Details →";

        action.addEventListener("click", () => {
            openInstructions(test);
        });

        card.append(action);

        return card;
    }

    function renderTests(tests) {
        if (!elements.grid) return;

        elements.grid.replaceChildren();

        if (elements.empty) {
            elements.empty.hidden = tests.length !== 0;
        }

        if (tests.length === 0) {
            return;
        }

        const fragment = document.createDocumentFragment();

        tests.forEach(test => {
            fragment.appendChild(createTestCard(test));
        });

        elements.grid.appendChild(fragment);
    }

    function openInstructions(test) {
        state.selectedTest = test;

        if (elements.modalTitle) {
            elements.modalTitle.textContent = test.title;
        }

        if (elements.modalDescription) {
            elements.modalDescription.textContent =
                test.description || "Review the test details before starting.";
        }

        if (elements.modalExam) {
            elements.modalExam.textContent = getExamName(test);
        }

        if (elements.modalDuration) {
            elements.modalDuration.textContent =
                formatDuration(test.duration_minutes);
        }

        if (elements.modalQuestions) {
            elements.modalQuestions.textContent =
                state.questionCounts[test.id] || 0;
        }

        if (elements.modalMarks) {
            elements.modalMarks.textContent =
                Number(test.total_marks || 0);
        }

        if (elements.modal) {
            elements.modal.hidden = false;
        }
    }

    function closeInstructions() {
        if (elements.modal) {
            elements.modal.hidden = true;
        }
    }

    function startSelectedTest() {
        if (!state.selectedTest) {
            notify("Please select a mock test first.");
            return;
        }

        const questionCount =
            state.questionCounts[state.selectedTest.id] || 0;

        if (questionCount === 0) {
            notify(
                "This test does not have published questions yet."
            );
            return;
        }

        const testId = encodeURIComponent(state.selectedTest.id);

        window.location.href =
            `mock-test.html?test_id=${testId}`;
    }

    function selectExam(value) {
        state.selectedExam = value;

        document.querySelectorAll("[data-exam]").forEach(button => {
            const active = button.dataset.exam === value;

            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });

        applyFilters();
    }

    function selectCategory(value) {
        state.selectedCategory = value;

        document.querySelectorAll("[data-category]").forEach(button => {
            const active = button.dataset.category === value;

            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });

        applyFilters();
    }

    function resetFilters() {
        state.selectedExam = "all";
        state.selectedCategory = "all";
        state.search = "";

        if (elements.search) {
            elements.search.value = "";
        }

        selectExam("all");
        selectCategory("all");
    }

    function setupEvents() {
        document.querySelectorAll("[data-exam]").forEach(button => {
            button.addEventListener("click", () => {
                selectExam(button.dataset.exam);
            });
        });

        document.querySelectorAll("[data-category]").forEach(button => {
            button.addEventListener("click", () => {
                selectCategory(button.dataset.category);
            });
        });

        if (elements.search) {
            elements.search.addEventListener("input", event => {
                state.search = normalize(event.target.value);
                applyFilters();
            });
        }

        if (elements.closeButton) {
            elements.closeButton.addEventListener(
                "click",
                closeInstructions
            );
        }

        if (elements.cancelButton) {
            elements.cancelButton.addEventListener(
                "click",
                closeInstructions
            );
        }

        if (elements.modal) {
            elements.modal.addEventListener("click", event => {
                if (event.target === elements.modal) {
                    closeInstructions();
                }
            });
        }

        if (elements.startButton) {
            elements.startButton.addEventListener(
                "click",
                startSelectedTest
            );
        }

        if (elements.resetButton) {
            elements.resetButton.addEventListener(
                "click",
                resetFilters
            );
        }

        if (elements.retryButton) {
            elements.retryButton.addEventListener(
                "click",
                loadTests
            );
        }
    }

    function readURLFilters() {
        const params = new URLSearchParams(location.search);
        const requestedExam = params.get("exam");

        if (!requestedExam) return;

        const matching = Object.keys(examNames).find(key => {
            return key !== "all" &&
                key === normalize(requestedExam);
        });

        if (matching) {
            state.selectedExam = examNames[matching];
        }
    }

    async function initialize() {
        setupEvents();
        readURLFilters();

        if (state.selectedExam !== "all") {
            selectExam(state.selectedExam);
        }

        await loadTests();
    }

    document.addEventListener("DOMContentLoaded", initialize);

})();
