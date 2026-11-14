
/* =========================================================
   STUDYVERSE AI
   MOCK TEST DASHBOARD
   File: mock-tests.js
   Version: 1.0
========================================================= */

"use strict";


/* =========================================================
   1. CONFIGURATION
========================================================= */

const MT_CONFIG = {
    tableName: "mock_tests",
    testPage: "mock-test.html",

    // These are fallback values for displaying test details.
    defaultDuration: 180,
    defaultQuestions: 0,
    defaultMarks: 0
};


/* =========================================================
   2. APPLICATION STATE
========================================================= */

const MT_STATE = {
    tests: [],
    filteredTests: [],

    selectedExam: "all",
    selectedCategory: "all",
    searchText: "",

    selectedTest: null,
    isLoading: false
};


/* =========================================================
   3. DOM HELPERS
========================================================= */

function mtGetElement(id) {
    return document.getElementById(id);
}

function mtSetText(id, value) {
    const element = mtGetElement(id);

    if (element) {
        element.textContent = value;
    }
}

function mtShow(id) {
    const element = mtGetElement(id);

    if (element) {
        element.hidden = false;
    }
}

function mtHide(id) {
    const element = mtGetElement(id);

    if (element) {
        element.hidden = true;
    }
}


/* =========================================================
   4. SUPABASE CLIENT
========================================================= */

/*
   Your existing Supabase initialization file must expose
   its initialized client as one of these window properties:

   window.studyverseSupabase
   window.supabaseClient
   window.SUPABASE_CLIENT

   We will confirm the correct name when checking your
   existing Supabase configuration.
*/

function mtGetSupabaseClient() {

    const possibleClients = [
        window.studyverseSupabase,
        window.supabaseClient,
        window.SUPABASE_CLIENT
    ];

    for (const client of possibleClients) {

        if (
            client &&
            typeof client.from === "function"
        ) {
            return client;
        }

    }

    return null;
}


/* =========================================================
   5. SAFE FIELD READER
========================================================= */

function mtGetValue(object, possibleNames, fallback = null) {

    if (!object || typeof object !== "object") {
        return fallback;
    }

    for (const name of possibleNames) {

        const value = object[name];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }

    }

    return fallback;
}


function mtToNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;

}


function mtNormalize(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

}


function mtFormatDuration(minutes) {

    const value = mtToNumber(minutes, 0);

    if (value <= 0) {
        return "--";
    }

    const hours = Math.floor(value / 60);
    const remainingMinutes = value % 60;

    if (hours > 0 && remainingMinutes > 0) {
        return `${hours} hr ${remainingMinutes} min`;
    }

    if (hours > 0) {
        return `${hours} hr`;
    }

    return `${remainingMinutes} min`;

}


/* =========================================================
   6. NORMALIZE TEST DATA
========================================================= */

/*
   Supports several common field names.

   Exact database mapping will be finalized after
   inspecting your existing Supabase table.
*/

function mtNormalizeTest(row) {

    const examValue = mtGetValue(
        row,
        [
            "exam_name",
            "examination",
            "exam",
            "exam_slug"
        ],
        "Other"
    );

    const categoryValue = mtGetValue(
        row,
        [
            "test_type",
            "category",
            "test_category",
            "type"
        ],
        "full"
    );

    const duration = mtToNumber(
        mtGetValue(
            row,
            [
                "duration_minutes",
                "duration",
                "time_limit",
                "time_in_minutes"
            ],
            MT_CONFIG.defaultDuration
        ),
        MT_CONFIG.defaultDuration
    );

    const totalQuestions = mtToNumber(
        mtGetValue(
            row,
            [
                "total_questions",
                "question_count",
                "number_of_questions",
                "questions_count"
            ],
            MT_CONFIG.defaultQuestions
        ),
        MT_CONFIG.defaultQuestions
    );

    const totalMarks = mtToNumber(
        mtGetValue(
            row,
            [
                "total_marks",
                "maximum_marks",
                "max_marks",
                "marks"
            ],
            MT_CONFIG.defaultMarks
        ),
        MT_CONFIG.defaultMarks
    );

    return {

        id: mtGetValue(
            row,
            ["id", "test_id"],
            null
        ),

        title: String(
            mtGetValue(
                row,
                [
                    "title",
                    "test_name",
                    "name"
                ],
                "Untitled Mock Test"
            )
        ),

        description: String(
            mtGetValue(
                row,
                [
                    "description",
                    "test_description",
                    "instructions"
                ],
                "Practice and improve your examination preparation."
            )
        ),

        exam: String(examValue),

        category: mtNormalize(categoryValue),

        duration: duration,

        totalQuestions: totalQuestions,

        totalMarks: totalMarks,

        isPublished: mtGetValue(
            row,
            [
                "is_published",
                "published",
                "is_active"
            ],
            true
        ),

        raw: row

    };

}


/* =========================================================
   7. NOTIFICATION
========================================================= */

function mtNotify(message) {

    const notification = mtGetElement("mtNotification");

    if (!notification) {
        return;
    }

    notification.textContent = message;

    notification.classList.add("show");

    window.clearTimeout(
        notification._hideTimer
    );

    notification._hideTimer = window.setTimeout(
        function () {
            notification.classList.remove("show");
        },
        3000
    );

}


/* =========================================================
   8. LOADING STATE
========================================================= */

function mtSetLoading(loading) {

    MT_STATE.isLoading = loading;

    if (loading) {

        mtShow("mockTestsLoading");

        mtHide("mockTestsEmpty");
        mtHide("mockTestsError");

    } else {

        mtHide("mockTestsLoading");

    }

}


/* =========================================================
   9. LOAD MOCK TESTS FROM SUPABASE
========================================================= */

async function mtLoadMockTests() {

    mtSetLoading(true);

    mtHide("mockTestsError");
    mtHide("mockTestsEmpty");

    const client = mtGetSupabaseClient();

    if (!client) {

        mtSetLoading(false);

        mtShowError(
            "Supabase client was not found. We need to connect this file to your existing Supabase initialization."
        );

        return;

    }

    try {

        const { data, error } = await client
            .from(MT_CONFIG.tableName)
            .select("*");

        if (error) {
            throw error;
        }

        if (!Array.isArray(data)) {
            throw new Error(
                "Unexpected response from the mock_tests table."
            );
        }

        MT_STATE.tests = data
            .map(mtNormalizeTest)
            .filter(function (test) {

                return (
                    test.id !== null &&
                    test.isPublished !== false
                );

            });

        mtUpdateStatistics();

        mtApplyFilters();

    } catch (error) {

        console.error(
            "STUDYVERSE AI Mock Test Loading Error:",
            error
        );

        mtShowError(
            "Unable to load tests. Please check the mock_tests table, its columns and Supabase read permissions."
        );

    } finally {

        mtSetLoading(false);

    }

}


/* =========================================================
   10. ERROR DISPLAY
========================================================= */

function mtShowError(message) {

    mtHide("mockTestsLoading");

    mtHide("mockTestsEmpty");

    mtSetText(
        "mockTestsErrorMessage",
        message
    );

    mtShow("mockTestsError");

    const grid = mtGetElement("mockTestGrid");

    if (grid) {
        grid.replaceChildren();
    }

}


/* =========================================================
   11. UPDATE DASHBOARD STATISTICS
========================================================= */

function mtUpdateStatistics() {

    const tests = MT_STATE.tests;

    const totalQuestions = tests.reduce(
        function (total, test) {
            return total + test.totalQuestions;
        },
        0
    );

    mtSetText(
        "totalMockTests",
        tests.length
    );

    mtSetText(
        "totalQuestions",
        totalQuestions
    );

    /*
       Attempts and average score will be connected
       to the student's actual attempt history later.
       Do not display invented statistics.
    */

    mtSetText(
        "totalAttempts",
        "--"
    );

    mtSetText(
        "averageScore",
        "--"
    );

}


/* =========================================================
   12. EXAM FILTER
========================================================= */

function mtSetupExamFilters() {

    const buttons = document.querySelectorAll(
        ".mt-exam-card"
    );

    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            MT_STATE.selectedExam =
                button.dataset.exam || "all";

            buttons.forEach(function (item) {

                const active =
                    item === button;

                item.classList.toggle(
                    "active",
                    active
                );

                item.setAttribute(
                    "aria-pressed",
                    String(active)
                );

            });

            mtUpdateFilterLabels();

            mtApplyFilters();

        });

    });

}


/* =========================================================
   13. CATEGORY FILTER
========================================================= */

function mtSetupCategoryFilters() {

    const buttons = document.querySelectorAll(
        ".mt-category-card"
    );

    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            MT_STATE.selectedCategory =
                button.dataset.category || "all";

            buttons.forEach(function (item) {

                const active =
                    item === button;

                item.classList.toggle(
                    "active",
                    active
                );

                item.setAttribute(
                    "aria-pressed",
                    String(active)
                );

            });

            mtUpdateFilterLabels();

            mtApplyFilters();

        });

    });

}


/* =========================================================
   14. SEARCH
========================================================= */

function mtSetupSearch() {

    const searchInput = mtGetElement(
        "mockTestSearch"
    );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        function () {

            MT_STATE.searchText =
                mtNormalize(searchInput.value);

            mtApplyFilters();

        }
    );

}


/* =========================================================
   15. CATEGORY MATCHING
========================================================= */

function mtCategoryMatches(testCategory, selectedCategory) {

    if (selectedCategory === "all") {
        return true;
    }

    const category = mtNormalize(testCategory);

    if (selectedCategory === "full") {

        return (
            category.includes("full") ||
            category.includes("complete") ||
            category.includes("full syllabus")
        );

    }

    if (selectedCategory === "subject") {

        return (
            category.includes("subject") ||
            category.includes("subject wise") ||
            category.includes("subjectwise")
        );

    }

    if (selectedCategory === "chapter") {

        return (
            category.includes("chapter") ||
            category.includes("chapter wise") ||
            category.includes("chapterwise")
        );

    }

    return category === selectedCategory;

}


/* =========================================================
   16. EXAMINATION MATCHING
========================================================= */

function mtExamMatches(testExam, selectedExam) {

    if (selectedExam === "all") {
        return true;
    }

    return (
        mtNormalize(testExam) ===
        mtNormalize(selectedExam)
    );

}


/* =========================================================
   17. APPLY ALL FILTERS
========================================================= */

function mtApplyFilters() {

    const filtered = MT_STATE.tests.filter(
        function (test) {

            const examMatches = mtExamMatches(
                test.exam,
                MT_STATE.selectedExam
            );

            const categoryMatches =
                mtCategoryMatches(
                    test.category,
                    MT_STATE.selectedCategory
                );

            const searchableText = mtNormalize(
                test.title + " " +
                test.description + " " +
                test.exam + " " +
                test.category
            );

            const searchMatches =
                !MT_STATE.searchText ||
                searchableText.includes(
                    MT_STATE.searchText
                );

            return (
                examMatches &&
                categoryMatches &&
                searchMatches
            );

        }
    );

    MT_STATE.filteredTests = filtered;

    mtRenderTests();

    mtUpdateFilterLabels();

}


/* =========================================================
   18. UPDATE FILTER LABELS
========================================================= */

function mtUpdateFilterLabels() {

    const examNames = {
        all: "All Examinations",
        "JEE Main": "JEE Main",
        "JEE Advanced": "JEE Advanced",
        "NEET UG": "NEET UG"
    };

    const categoryNames = {
        all: "All Tests",
        full: "Full Syllabus",
        subject: "Subject Wise",
        chapter: "Chapter Wise"
    };

    mtSetText(
        "activeExamFilter",
        examNames[MT_STATE.selectedExam] ||
        MT_STATE.selectedExam
    );

    mtSetText(
        "activeCategoryFilter",
        categoryNames[MT_STATE.selectedCategory] ||
        MT_STATE.selectedCategory
    );

}


/* =========================================================
   19. CREATE ELEMENT HELPER
========================================================= */

function mtCreateElement(
    tag,
    className,
    text
) {

    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;

}


/* =========================================================
   20. RENDER TEST CARDS
========================================================= */

function mtRenderTests() {

    const grid = mtGetElement("mockTestGrid");

    if (!grid) {
        return;
    }

    grid.replaceChildren();

    const tests = MT_STATE.filteredTests;

    if (tests.length === 0) {

        mtShow("mockTestsEmpty");

        return;

    }

    mtHide("mockTestsEmpty");
    mtHide("mockTestsError");

    tests.forEach(function (test) {

        const card = mtCreateElement(
            "article",
            "mt-test-card"
        );

        /* CARD TOP */

        const top = mtCreateElement(
            "div",
            "mt-test-card-top"
        );

        const examTag = mtCreateElement(
            "span",
            "mt-test-exam-tag",
            test.exam
        );

        const categoryTag = mtCreateElement(
            "span",
            "mt-test-category-tag",
            mtDisplayCategory(test.category)
        );

        top.append(
            examTag,
            categoryTag
        );


        /* TITLE */

        const title = mtCreateElement(
            "h3",
            "",
            test.title
        );


        /* DESCRIPTION */

        const description = mtCreateElement(
            "p",
            "mt-test-description",
            test.description
        );


        /* TEST METADATA */

        const metadata = mtCreateElement(
            "div",
            "mt-test-meta"
        );

        const duration = mtCreateElement(
            "div",
            "mt-test-meta-item"
        );

        duration.append(
            mtCreateElement(
                "span",
                "",
                "Duration"
            ),
            mtCreateElement(
                "strong",
                "",
                mtFormatDuration(test.duration)
            )
        );

        const questions = mtCreateElement(
            "div",
            "mt-test-meta-item"
        );

        questions.append(
            mtCreateElement(
                "span",
                "",
                "Questions"
            ),
            mtCreateElement(
                "strong",
                "",
                test.totalQuestions || "--"
            )
        );

        const marks = mtCreateElement(
            "div",
            "mt-test-meta-item"
        );

        marks.append(
            mtCreateElement(
                "span",
                "",
                "Total Marks"
            ),
            mtCreateElement(
                "strong",
                "",
                test.totalMarks || "--"
            )
        );

        metadata.append(
            duration,
            questions,
            marks
        );


        /* CARD FOOTER */

        const footer = mtCreateElement(
            "div",
            "mt-test-card-footer"
        );

        const status = mtCreateElement(
            "span",
            "mt-test-status",
            "Available"
        );

        const startButton = mtCreateElement(
            "button",
            "mt-primary-button",
            "View Details →"
        );

        startButton.type = "button";

        startButton.addEventListener(
            "click",
            function () {

                mtOpenTestInstructions(test);

            }
        );

        footer.append(
            status,
            startButton
        );


        card.append(
            top,
            title,
            description,
            metadata,
            footer
        );

        grid.appendChild(card);

    });

}


/* =========================================================
   21. DISPLAY CATEGORY
========================================================= */

function mtDisplayCategory(category) {

    const normalized = mtNormalize(category);

    if (normalized.includes("full")) {
        return "Full Syllabus";
    }

    if (normalized.includes("subject")) {
        return "Subject Wise";
    }

    if (normalized.includes("chapter")) {
        return "Chapter Wise";
    }

    return category || "Mock Test";

}


/* =========================================================
   22. OPEN TEST INSTRUCTIONS
========================================================= */

function mtOpenTestInstructions(test) {

    MT_STATE.selectedTest = test;

    mtSetText(
        "modalTestTitle",
        test.title
    );

    mtSetText(
        "modalTestDescription",
        test.description
    );

    mtSetText(
        "modalExam",
        test.exam
    );

    mtSetText(
        "modalDuration",
        mtFormatDuration(test.duration)
    );

    mtSetText(
        "modalQuestions",
        test.totalQuestions || "--"
    );

    mtSetText(
        "modalMarks",
        test.totalMarks || "--"
    );

    mtShow("testInstructionsModal");

    document.body.style.overflow = "hidden";

}


/* =========================================================
   23. CLOSE TEST INSTRUCTIONS
========================================================= */

function mtCloseTestInstructions() {

    mtHide("testInstructionsModal");

    document.body.style.overflow = "";

    MT_STATE.selectedTest = null;

}


/* =========================================================
   24. START TEST
========================================================= */

function mtStartSelectedTest() {

    const test = MT_STATE.selectedTest;

    if (!test || test.id === null) {

        mtNotify(
            "Please select a valid mock test."
        );

        return;

    }

    /*
       The examination page will read test_id
       from the URL.

       The actual examination system will be
       implemented in mock-test.js.
    */

    const destination =
        MT_CONFIG.testPage +
        "?test_id=" +
        encodeURIComponent(test.id);

    window.location.href = destination;

}


/* =========================================================
   25. MODAL EVENT LISTENERS
========================================================= */

function mtSetupModal() {

    const closeButton = mtGetElement(
        "closeTestModal"
    );

    const cancelButton = mtGetElement(
        "cancelTestStart"
    );

    const startButton = mtGetElement(
        "confirmTestStart"
    );

    const modal = mtGetElement(
        "testInstructionsModal"
    );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            mtCloseTestInstructions
        );

    }

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            mtCloseTestInstructions
        );

    }

    if (startButton) {

        startButton.addEventListener(
            "click",
            mtStartSelectedTest
        );

    }

    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {
                    mtCloseTestInstructions();
                }

            }
        );

    }

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                const visible =
                    modal && !modal.hidden;

                if (visible) {
                    mtCloseTestInstructions();
                }

            }

        }
    );

}


/* =========================================================
   26. RESET FILTERS
========================================================= */

function mtResetFilters() {

    MT_STATE.selectedExam = "all";

    MT_STATE.selectedCategory = "all";

    MT_STATE.searchText = "";

    const searchInput = mtGetElement(
        "mockTestSearch"
    );

    if (searchInput) {
        searchInput.value = "";
    }

    document.querySelectorAll(
        ".mt-exam-card"
    ).forEach(function (button) {

        const active =
            button.dataset.exam === "all";

        button.classList.toggle(
            "active",
            active
        );

        button.setAttribute(
            "aria-pressed",
            String(active)
        );

    });

    document.querySelectorAll(
        ".mt-category-card"
    ).forEach(function (button) {

        const active =
            button.dataset.category === "all";

        button.classList.toggle(
            "active",
            active
        );

        button.setAttribute(
            "aria-pressed",
            String(active)
        );

    });

    mtApplyFilters();

}


/* =========================================================
   27. RESET BUTTON
========================================================= */

function mtSetupResetButton() {

    const resetButton = mtGetElement(
        "resetMockFilters"
    );

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            mtResetFilters
        );

    }

}


/* =========================================================
   28. RETRY BUTTON
========================================================= */

function mtSetupRetryButton() {

    const retryButton = mtGetElement(
        "retryMockTests"
    );

    if (retryButton) {

        retryButton.addEventListener(
            "click",
            mtLoadMockTests
        );

    }

}


/* =========================================================
   29. URL EXAM FILTER
========================================================= */

function mtReadUrlFilters() {

    const params = new URLSearchParams(
        window.location.search
    );

    const exam = params.get("exam");

    if (!exam) {
        return;
    }

    const allowedExams = [
        "JEE Main",
        "JEE Advanced",
        "NEET UG"
    ];

    const matchedExam = allowedExams.find(
        function (item) {
            return (
                mtNormalize(item) ===
                mtNormalize(exam)
            );
        }
    );

    if (!matchedExam) {
        return;
    }

    MT_STATE.selectedExam = matchedExam;

    document.querySelectorAll(
        ".mt-exam-card"
    ).forEach(function (button) {

        const active =
            button.dataset.exam === matchedExam;

        button.classList.toggle(
            "active",
            active
        );

        button.setAttribute(
            "aria-pressed",
            String(active)
        );

    });

    mtUpdateFilterLabels();

}


/* =========================================================
   30. INITIALIZE DASHBOARD
========================================================= */

async function mtInitializeDashboard() {

    console.log(
        "STUDYVERSE AI Mock Test Dashboard initializing..."
    );

    mtSetupExamFilters();

    mtSetupCategoryFilters();

    mtSetupSearch();

    mtSetupModal();

    mtSetupResetButton();

    mtSetupRetryButton();

    mtReadUrlFilters();

    mtUpdateFilterLabels();

    await mtLoadMockTests();

    console.log(
        "STUDYVERSE AI Mock Test Dashboard initialized."
    );

}


/* =========================================================
   31. START APPLICATION
========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        mtInitializeDashboard
    );

} else {

    mtInitializeDashboard();

}
