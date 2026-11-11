
/* =========================================================
   STUDYVERSE AI — LEARNING PROGRESS SYSTEM
   Version 1.0

   FEATURES
   1. Save student learning activities
   2. Lesson completion tracking
   3. Notes reading tracking
   4. Formula revision tracking
   5. PYQ attempt and solution tracking
   6. Student-specific Supabase records
   7. Dashboard statistics
   8. Today's activity
   9. Chapter-wise activity
   10. Recent study history

   DATABASE TABLE:
   public.learning_progress_events
========================================================= */

(function () {
    "use strict";

    // Prevent duplicate initialization.
    if (window.StudyverseProgress) return;

    const SUPABASE_URL =
        "https://mtxkvupfczhglaqghcbc.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

    const TABLE = "learning_progress_events";

    const VALID_EVENTS = [
        "lesson_completed",
        "note_read",
        "formula_revised",
        "pyq_attempted",
        "pyq_solved"
    ];

    let client = null;
    let currentUser = null;
    let isInitialized = false;

    // =====================================================
    // 1. SUPABASE CLIENT
    // =====================================================

    function getClient() {

        if (window.studyverseSupabase) {
            client = window.studyverseSupabase;
            return client;
        }

        if (!window.supabase) {
            console.error(
                "STUDYVERSE PROGRESS: Supabase library not found."
            );
            return null;
        }

        client = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        window.studyverseSupabase = client;

        return client;
    }

    // =====================================================
    // 2. HELPER FUNCTIONS
    // =====================================================

    function getTodayStart() {

        const date = new Date();

        date.setHours(0, 0, 0, 0);

        return date.toISOString();
    }

    function getChapterId() {

        const params = new URLSearchParams(
            window.location.search
        );

        return (
            params.get("chapter_id") ||
            document.body.dataset.chapterId ||
            null
        );

    }

    function getEventLabel(eventType) {

        const labels = {
            lesson_completed: "Lesson completed",
            note_read: "Notes read",
            formula_revised: "Formula revised",
            pyq_attempted: "PYQ attempted",
            pyq_solved: "PYQ solved"
        };

        return labels[eventType] || "Learning activity";

    }

    function setText(id, value) {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = String(value);
        }

    }

    function setVisible(id, visible) {

        const element = document.getElementById(id);

        if (element) {
            element.hidden = !visible;
            element.style.display = visible ? "" : "none";
        }

    }

    // =====================================================
    // 3. GET CURRENT STUDENT
    // =====================================================

    async function getStudent() {

        const supabase = getClient();

        if (!supabase) {
            throw new Error("Supabase is unavailable.");
        }

        const { data, error } =
            await supabase.auth.getUser();

        if (error) throw error;

        currentUser = data.user || null;

        if (!currentUser) {
            throw new Error(
                "Please log in to save your learning progress."
            );
        }

        return currentUser;

    }

    // =====================================================
    // 4. SAVE LEARNING ACTIVITY
    // =====================================================

    async function track(options) {

        options = options || {};

        const eventType = options.eventType;

        if (!VALID_EVENTS.includes(eventType)) {

            throw new Error(
                "Invalid learning activity type: " + eventType
            );

        }

        const user = await getStudent();

        const chapterId =
            options.chapterId || getChapterId();

        const resourceId =
            options.resourceId
                ? String(options.resourceId)
                : null;

        const metadata =
            options.metadata &&
            typeof options.metadata === "object"
                ? options.metadata
                : {};

        const record = {

            user_id: user.id,

            chapter_id: chapterId || null,

            event_type: eventType,

            resource_id: resourceId,

            metadata: metadata

        };

        const { data, error } = await client
            .from(TABLE)
            .insert(record)
            .select()
            .single();

        if (error) {

            console.error(
                "STUDYVERSE PROGRESS: Save failed:",
                error
            );

            throw error;

        }

        console.log(
            "STUDYVERSE PROGRESS: Activity saved!",
            data
        );

        document.dispatchEvent(
            new CustomEvent(
                "studyverse:progress-updated",
                {
                    detail: {
                        eventType: eventType,
                        record: data
                    }
                }
            )
        );

        await loadDashboard();

        return data;

    }

    // =====================================================
    // 5. CONVENIENCE TRACKING FUNCTIONS
    // =====================================================

    async function completeLesson(lessonId, chapterId) {

        return track({
            eventType: "lesson_completed",
            resourceId: lessonId,
            chapterId: chapterId
        });

    }

    async function readNote(noteId, chapterId) {

        return track({
            eventType: "note_read",
            resourceId: noteId,
            chapterId: chapterId
        });

    }

    async function reviseFormula(formulaId, chapterId) {

        return track({
            eventType: "formula_revised",
            resourceId: formulaId,
            chapterId: chapterId
        });

    }

    async function attemptPYQ(pyqId, chapterId) {

        return track({
            eventType: "pyq_attempted",
            resourceId: pyqId,
            chapterId: chapterId
        });

    }

    async function solvePYQ(pyqId, chapterId, isCorrect) {

        return track({
            eventType: "pyq_solved",
            resourceId: pyqId,
            chapterId: chapterId,
            metadata: {
                correct: Boolean(isCorrect)
            }
        });

    }

    // =====================================================
    // 6. LOAD STUDENT PROGRESS RECORDS
    // =====================================================

    async function getProgressRecords() {

        const user = await getStudent();

        const { data, error } = await client
            .from(TABLE)
            .select(
                "id, chapter_id, event_type, resource_id, metadata, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", {
                ascending: false
            })
            .limit(1000);

        if (error) throw error;

        return data || [];

    }

    // =====================================================
    // 7. CALCULATE DASHBOARD STATISTICS
    // =====================================================

    function calculateStatistics(records) {

        const todayStart = new Date(getTodayStart());

        const todayRecords = records.filter(
            function (record) {

                return new Date(record.created_at) >= todayStart;

            }
        );

        function countEvent(list, eventType) {

            return list.filter(
                function (record) {
                    return record.event_type === eventType;
                }
            ).length;

        }

        return {

            lessons: countEvent(
                records,
                "lesson_completed"
            ),

            notes: countEvent(
                records,
                "note_read"
            ),

            formulas: countEvent(
                records,
                "formula_revised"
            ),

            pyqs: countEvent(
                records,
                "pyq_attempted"
            ),

            solved: countEvent(
                records,
                "pyq_solved"
            ),

            today: {

                lessons: countEvent(
                    todayRecords,
                    "lesson_completed"
                ),

                notes: countEvent(
                    todayRecords,
                    "note_read"
                ),

                formulas: countEvent(
                    todayRecords,
                    "formula_revised"
                ),

                pyqs: countEvent(
                    todayRecords,
                    "pyq_attempted"
                )

            }

        };

    }

    // =====================================================
    // 8. DISPLAY DASHBOARD STATISTICS
    // =====================================================

    function renderStatistics(stats) {

        setText(
            "completedLessonsCount",
            stats.lessons
        );

        setText(
            "notesReadCount",
            stats.notes
        );

        setText(
            "formulasRevisedCount",
            stats.formulas
        );

        setText(
            "pyqsSolvedCount",
            stats.pyqs
        );

        setText(
            "todayLessonsCount",
            stats.today.lessons
        );

        setText(
            "todayNotesCount",
            stats.today.notes
        );

        setText(
            "todayFormulasCount",
            stats.today.formulas
        );

        setText(
            "todayPyqsCount",
            stats.today.pyqs
        );

        // A real completion percentage requires the
        // total published lesson count. Do not invent it.
        setText(
            "overallProgressValue",
            "—"
        );

        // Detailed dashboard values.
        setText(
            "detailVideoLessons",
            stats.lessons
        );

        setText(
            "detailFormulaRevision",
            stats.formulas
        );

        setText(
            "detailPyqAccuracy",
            "—"
        );

    }

    // =====================================================
    // 9. CHAPTER-WISE PROGRESS
    // =====================================================

    async function renderChapterProgress(records) {

        const container = document.getElementById(
            "chapterProgressList"
        );

        if (!container) return;

        const grouped = {};

        records.forEach(function (record) {

            if (!record.chapter_id) return;

            if (!grouped[record.chapter_id]) {

                grouped[record.chapter_id] = {
                    chapterId: record.chapter_id,
                    activities: 0,
                    lessons: 0,
                    notes: 0,
                    formulas: 0,
                    pyqs: 0,
                    latest: record.created_at
                };

            }

            const item = grouped[record.chapter_id];

            item.activities++;

            if (record.event_type === "lesson_completed") {
                item.lessons++;
            }

            if (record.event_type === "note_read") {
                item.notes++;
            }

            if (record.event_type === "formula_revised") {
                item.formulas++;
            }

            if (record.event_type === "pyq_attempted") {
                item.pyqs++;
            }

        });

        const chapters = Object.values(grouped);

        if (chapters.length === 0) {

            container.textContent =
                "Your chapter-wise learning activity will appear here.";

            return;

        }

        container.replaceChildren();

        chapters.forEach(function (chapter) {

            const card = document.createElement("div");

            card.className = "sv-progress-chapter";

            const title = document.createElement("h4");

            title.textContent =
                "Chapter ID: " + chapter.chapterId;

            const details = document.createElement("p");

            details.textContent =
                chapter.lessons + " lessons • " +
                chapter.notes + " notes • " +
                chapter.formulas + " formulas • " +
                chapter.pyqs + " PYQs attempted";

            const activity = document.createElement("small");

            activity.textContent =
                chapter.activities + " recorded activities";

            card.append(title, details, activity);

            container.appendChild(card);

        });

    }

    // =====================================================
    // 10. RECENT STUDY HISTORY
    // =====================================================

    function renderStudyHistory(records) {

        const container = document.getElementById(
            "studyHistoryList"
        );

        if (!container) return;

        if (records.length === 0) {

            container.textContent =
                "No learning activity recorded yet.";

            return;

        }

        container.replaceChildren();

        records.slice(0, 10).forEach(function (record) {

            const item = document.createElement("div");

            item.className = "sv-study-history-item";

            const title = document.createElement("strong");

            title.textContent =
                getEventLabel(record.event_type);

            const date = document.createElement("small");

            date.textContent = new Date(
                record.created_at
            ).toLocaleString("en-IN");

            item.append(title, date);

            container.appendChild(item);

        });

    }

    // =====================================================
    // 11. LOAD COMPLETE DASHBOARD
    // =====================================================

    async function loadDashboard() {

        const loading = document.getElementById(
            "student-dashboard-loading"
        );

        const content = document.getElementById(
            "student-dashboard-content"
        );

        const empty = document.getElementById(
            "student-dashboard-empty"
        );

        const errorBox = document.getElementById(
            "student-dashboard-error"
        );

        try {

            const records = await getProgressRecords();

            const stats = calculateStatistics(records);

            renderStatistics(stats);

            await renderChapterProgress(records);

            renderStudyHistory(records);

            setText(
                "todayActivityDate",
                new Date().toLocaleDateString(
                    "en-IN",
                    {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                )
            );

            if (loading) loading.style.display = "none";

            if (content) content.style.display = "block";

            if (empty) {
                empty.hidden = records.length > 0;
                empty.style.display =
                    records.length > 0 ? "none" : "block";

                empty.textContent =
                    "No learning activity yet. Start a chapter to begin tracking your progress.";
            }

            if (errorBox) {
                errorBox.style.display = "none";
            }

            console.log(
                "STUDYVERSE PROGRESS: Dashboard loaded.",
                stats
            );

            return {
                records: records,
                statistics: stats
            };

        } catch (error) {

            console.error(
                "STUDYVERSE PROGRESS: Dashboard error:",
                error
            );

            if (loading) loading.style.display = "none";

            if (errorBox) {

                errorBox.hidden = false;
                errorBox.style.display = "block";

                errorBox.textContent =
                    "Unable to load learning progress. Please refresh and try again.";

            }

            return null;

        }

    }

    // =====================================================
    // 12. AUTOMATIC DATA-ATTRIBUTE TRACKING
    // =====================================================

    document.addEventListener("click", async function (event) {

        const button = event.target.closest(
            "[data-progress-event]"
        );

        if (!button) return;

        const eventType =
            button.dataset.progressEvent;

        const resourceId =
            button.dataset.resourceId || null;

        const chapterId =
            button.dataset.chapterId || getChapterId();

        if (!VALID_EVENTS.includes(eventType)) return;

        if (button.dataset.progressSaving === "true") return;

        button.dataset.progressSaving = "true";

        try {

            await track({
                eventType: eventType,
                resourceId: resourceId,
                chapterId: chapterId
            });

            showNotification(
                getEventLabel(eventType) + " saved!"
            );

        } catch (error) {

            console.error(error);

            showNotification(
                error.message || "Unable to save progress."
            );

        } finally {

            button.dataset.progressSaving = "false";

        }

    });

    function showNotification(message) {

        const toast = document.getElementById("toast");

        if (!toast) {
            console.log(message);
            return;
        }

        toast.textContent = message;

        toast.classList.add("show");

        setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);

    }

    // =====================================================
    // 13. INITIALIZATION
    // =====================================================

    async function initialize() {

        if (isInitialized) return;

        const supabase = getClient();

        if (!supabase) return;

        isInitialized = true;

        try {

            const { data, error } =
                await supabase.auth.getSession();

            if (error) throw error;

            currentUser = data.session
                ? data.session.user
                : null;

            if (currentUser) {

                console.log(
                    "STUDYVERSE PROGRESS: Student detected."
                );

                await loadDashboard();

            }

            supabase.auth.onAuthStateChange(
                function (event, session) {

                    currentUser = session
                        ? session.user
                        : null;

                    if (event === "SIGNED_IN" && currentUser) {

                        setTimeout(function () {
                            loadDashboard();
                        }, 0);

                    }

                    if (event === "SIGNED_OUT") {

                        currentUser = null;

                        setText("completedLessonsCount", 0);
                        setText("notesReadCount", 0);
                        setText("formulasRevisedCount", 0);
                        setText("pyqsSolvedCount", 0);
                        setText("overallProgressValue", "—");

                    }

                }
            );

        } catch (error) {

            console.error(
                "STUDYVERSE PROGRESS: Initialization error:",
                error
            );

        }

    }

    // =====================================================
    // 14. PUBLIC API
    // =====================================================

    window.StudyverseProgress = {

        initialize: initialize,

        track: track,

        completeLesson: completeLesson,

        readNote: readNote,

        reviseFormula: reviseFormula,

        attemptPYQ: attemptPYQ,

        solvePYQ: solvePYQ,

        loadDashboard: loadDashboard,

        getProgressRecords: getProgressRecords

    };

    // Initialize when the page is ready.

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

    console.log(
        "%cSTUDYVERSE AI — Learning Progress v1.0",
        "color:#8b5cf6;font-size:16px;font-weight:bold;"
    );

})();
