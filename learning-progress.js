
/* =========================================================
   STUDYVERSE AI — LEARNING PROGRESS SYSTEM
   Version 2.0

   Tracks:
   - Completed lessons
   - Notes read
   - Formulas revised
   - PYQs attempted and solved
   - Today's activity
   - Chapter-wise activity
   - Recent learning history

   Supabase table:
   public.learning_progress_events

   Load AFTER script.js.
========================================================= */

(function () {
    "use strict";

    if (window.StudyverseProgress) {
        console.warn("STUDYVERSE PROGRESS: Already initialized.");
        return;
    }

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
    let initialized = false;
    let authListenerRegistered = false;

    // -----------------------------------------------------
    // 1. SUPABASE CLIENT
    // -----------------------------------------------------

    function getClient() {
        if (window.studyverseSupabase) {
            client = window.studyverseSupabase;
            return client;
        }

        if (!window.supabase || !window.supabase.createClient) {
            console.error(
                "STUDYVERSE PROGRESS: Supabase library is unavailable."
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

    // -----------------------------------------------------
    // 2. HELPERS
    // -----------------------------------------------------

    function getTodayStartISO() {
        // Use the student's local midnight, converted to UTC.
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }

    function getChapterId() {
        const params = new URLSearchParams(window.location.search);

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

    function setHidden(id, hidden) {
        const element = document.getElementById(id);

        if (element) {
            element.hidden = Boolean(hidden);
        }
    }

    function notify(message) {
        const toast = document.getElementById("toast");

        if (!toast) {
            console.log("STUDYVERSE:", message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        window.clearTimeout(notify.timer);

        notify.timer = window.setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);
    }

    function showError(error, context) {
        console.error(
            "STUDYVERSE PROGRESS:",
            context,
            error
        );

        notify(
            error && error.message
                ? error.message
                : "Something went wrong. Please try again."
        );
    }

    // -----------------------------------------------------
    // 3. CURRENT STUDENT
    // -----------------------------------------------------

    async function getStudent() {
        const supabase = getClient();

        if (!supabase) {
            throw new Error("Supabase is not connected.");
        }

        const result = await supabase.auth.getUser();

        if (result.error) {
            throw result.error;
        }

        currentUser = result.data.user || null;

        if (!currentUser) {
            throw new Error(
                "Please log in to save your learning progress."
            );
        }

        return currentUser;
    }

    // -----------------------------------------------------
    // 4. SAVE AN ACTIVITY
    // -----------------------------------------------------

    async function track(options) {
        options = options || {};

        const eventType = options.eventType;

        if (!VALID_EVENTS.includes(eventType)) {
            throw new Error(
                "Invalid learning activity: " + eventType
            );
        }

        const user = await getStudent();

        const chapterId =
            options.chapterId || getChapterId();

        const resourceId =
            options.resourceId !== undefined &&
            options.resourceId !== null
                ? String(options.resourceId)
                : null;

        const metadata =
            options.metadata &&
            typeof options.metadata === "object" &&
            !Array.isArray(options.metadata)
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
            throw error;
        }

        console.log(
            "STUDYVERSE PROGRESS: Activity saved.",
            data
        );

        document.dispatchEvent(
            new CustomEvent("studyverse:progress-updated", {
                detail: {
                    eventType: eventType,
                    record: data
                }
            })
        );

        // Refresh statistics only when a student is signed in.
        await loadDashboard();

        return data;
    }

    // -----------------------------------------------------
    // 5. CONVENIENCE TRACKING FUNCTIONS
    // -----------------------------------------------------

    function completeLesson(lessonId, chapterId) {
        return track({
            eventType: "lesson_completed",
            resourceId: lessonId,
            chapterId: chapterId
        });
    }

    function readNote(noteId, chapterId) {
        return track({
            eventType: "note_read",
            resourceId: noteId,
            chapterId: chapterId
        });
    }

    function reviseFormula(formulaId, chapterId) {
        return track({
            eventType: "formula_revised",
            resourceId: formulaId,
            chapterId: chapterId
        });
    }

    function attemptPYQ(pyqId, chapterId) {
        return track({
            eventType: "pyq_attempted",
            resourceId: pyqId,
            chapterId: chapterId
        });
    }

    function solvePYQ(pyqId, chapterId, isCorrect) {
        return track({
            eventType: "pyq_solved",
            resourceId: pyqId,
            chapterId: chapterId,
            metadata: {
                correct: Boolean(isCorrect)
            }
        });
    }

    // -----------------------------------------------------
    // 6. FETCH STUDENT RECORDS
    // -----------------------------------------------------

    async function getProgressRecords() {
        const user = await getStudent();

        const { data, error } = await client
            .from(TABLE)
            .select(
                "id,chapter_id,event_type,resource_id,metadata,created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", {
                ascending: false
            })
            .limit(1000);

        if (error) {
            throw error;
        }

        return data || [];
    }

    // -----------------------------------------------------
    // 7. CALCULATE STATISTICS
    // -----------------------------------------------------

    function calculateStatistics(records) {
        const todayStart = new Date(getTodayStartISO());

        const todayRecords = records.filter(function (record) {
            return new Date(record.created_at) >= todayStart;
        });

        function count(list, eventType) {
            return list.filter(function (record) {
                return record.event_type === eventType;
            }).length;
        }

        const stats = {
            lessons: count(records, "lesson_completed"),
            notes: count(records, "note_read"),
            formulas: count(records, "formula_revised"),
            pyqsAttempted: count(records, "pyq_attempted"),
            pyqsSolved: count(records, "pyq_solved"),

            today: {
                lessons: count(todayRecords, "lesson_completed"),
                notes: count(todayRecords, "note_read"),
                formulas: count(todayRecords, "formula_revised"),
                pyqsAttempted: count(todayRecords, "pyq_attempted"),
                pyqsSolved: count(todayRecords, "pyq_solved")
            }
        };

        return stats;
    }

    // -----------------------------------------------------
    // 8. RENDER DASHBOARD STATISTICS
    // -----------------------------------------------------

    function renderStatistics(stats) {
        setText("completedLessonsCount", stats.lessons);
        setText("notesReadCount", stats.notes);
        setText("formulasRevisedCount", stats.formulas);

        // This element represents solved PYQs.
        setText("pyqsSolvedCount", stats.pyqsSolved);

        setText("todayLessonsCount", stats.today.lessons);
        setText("todayNotesCount", stats.today.notes);
        setText("todayFormulasCount", stats.today.formulas);
        setText("todayPyqsCount", stats.today.pyqsAttempted);

        // These values require additional published-content
        // and answer data before a real percentage can be shown.
        setText("overallProgressValue", "—");
        setText("detailVideoLessons", stats.lessons);
        setText("detailFormulaRevision", stats.formulas);
        setText("detailPyqAccuracy", "—");

        // Optional extra counters, if these IDs exist.
        setText("pyqsAttemptedCount", stats.pyqsAttempted);
        setText("todayPyqsSolvedCount", stats.today.pyqsSolved);
    }

    // -----------------------------------------------------
    // 9. CHAPTER-WISE ACTIVITY
    // -----------------------------------------------------

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
                    pyqsAttempted: 0,
                    pyqsSolved: 0
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
                item.pyqsAttempted++;
            }

            if (record.event_type === "pyq_solved") {
                item.pyqsSolved++;
            }
        });

        const chapters = Object.values(grouped);

        container.replaceChildren();

        if (chapters.length === 0) {
            container.textContent =
                "Your chapter-wise learning activity will appear here.";
            return;
        }

        chapters.forEach(function (chapter) {
            const card = document.createElement("article");
            card.className = "sv-progress-chapter";

            const title = document.createElement("h4");
            title.textContent =
                "Chapter ID: " + chapter.chapterId;

            const details = document.createElement("p");
            details.textContent =
                chapter.lessons + " lessons • " +
                chapter.notes + " notes • " +
                chapter.formulas + " formulas • " +
                chapter.pyqsAttempted + " PYQs attempted • " +
                chapter.pyqsSolved + " PYQs solved";

            const activity = document.createElement("small");
            activity.textContent =
                chapter.activities + " recorded activities";

            card.append(title, details, activity);
            container.appendChild(card);
        });
    }

    // -----------------------------------------------------
    // 10. RECENT STUDY HISTORY
    // -----------------------------------------------------

    function renderStudyHistory(records) {
        const container = document.getElementById(
            "studyHistoryList"
        );

        if (!container) return;

        container.replaceChildren();

        if (records.length === 0) {
            container.textContent =
                "No learning activity recorded yet.";
            return;
        }

        records.slice(0, 10).forEach(function (record) {
            const item = document.createElement("article");
            item.className = "sv-study-history-item";

            const title = document.createElement("strong");
            title.textContent = getEventLabel(record.event_type);

            const date = document.createElement("small");
            date.textContent = new Date(
                record.created_at
            ).toLocaleString("en-IN");

            item.append(title, date);
            container.appendChild(item);
        });
    }

    // -----------------------------------------------------
    // 11. LOAD DASHBOARD
    // -----------------------------------------------------

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
            if (loading) {
                loading.hidden = false;
                loading.textContent = "Loading your learning progress...";
            }

            if (errorBox) {
                errorBox.hidden = true;
            }

            const records = await getProgressRecords();
            const stats = calculateStatistics(records);

            renderStatistics(stats);
            await renderChapterProgress(records);
            renderStudyHistory(records);

            setText(
                "todayActivityDate",
                new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                })
            );

            if (loading) loading.hidden = true;
            if (content) content.hidden = false;

            if (empty) {
                empty.hidden = records.length > 0;

                if (records.length === 0) {
                    empty.textContent =
                        "No learning activity yet. Start a chapter to begin tracking your progress.";
                }
            }

            if (errorBox) errorBox.hidden = true;

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
                "STUDYVERSE PROGRESS: Dashboard could not load.",
                error
            );

            if (loading) loading.hidden = true;

            if (errorBox) {
                errorBox.hidden = false;
                errorBox.textContent =
                    "Unable to load learning progress. Check your connection and try again.";
            }

            return null;
        }
    }

    // -----------------------------------------------------
    // 12. DATA-ATTRIBUTE TRACKING
    // -----------------------------------------------------

    document.addEventListener("click", async function (event) {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const button = target.closest("[data-progress-event]");

        if (!button) return;

        const eventType = button.dataset.progressEvent;

        if (!VALID_EVENTS.includes(eventType)) return;

        if (button.dataset.progressSaving === "true") return;

        button.dataset.progressSaving = "true";
        button.disabled = true;

        try {
            await track({
                eventType: eventType,
                resourceId: button.dataset.resourceId || null,
                chapterId:
                    button.dataset.chapterId || getChapterId()
            });

            notify(getEventLabel(eventType) + " saved!");

        } catch (error) {
            showError(error, "Could not save activity.");

        } finally {
            button.dataset.progressSaving = "false";
            button.disabled = false;
        }
    });

    // -----------------------------------------------------
    // 13. AUTHENTICATION CHANGES
    // -----------------------------------------------------

    function registerAuthListener() {
        if (authListenerRegistered) return;

        const supabase = getClient();

        if (!supabase) return;

        authListenerRegistered = true;

        supabase.auth.onAuthStateChange(function (event, session) {
            currentUser = session ? session.user : null;

            // Defer Supabase queries until after the auth callback.
            if (event === "SIGNED_IN" && currentUser) {
                window.setTimeout(function () {
                    loadDashboard();
                }, 0);
            }

            if (event === "SIGNED_OUT") {
                currentUser = null;

                [
                    "completedLessonsCount",
                    "notesReadCount",
                    "formulasRevisedCount",
                    "pyqsSolvedCount",
                    "pyqsAttemptedCount",
                    "todayLessonsCount",
                    "todayNotesCount",
                    "todayFormulasCount",
                    "todayPyqsCount"
                ].forEach(function (id) {
                    setText(id, 0);
                });

                setText("overallProgressValue", "—");

                const content = document.getElementById(
                    "student-dashboard-content"
                );

                if (content) content.hidden = true;

                const empty = document.getElementById(
                    "student-dashboard-empty"
                );

                if (empty) {
                    empty.hidden = false;
                    empty.textContent =
                        "Log in to view your personal learning progress.";
                }
            }
        });
    }

    // -----------------------------------------------------
    // 14. INITIALIZATION
    // -----------------------------------------------------

    async function initialize() {
        if (initialized) return;

        const supabase = getClient();

        if (!supabase) {
            console.error(
                "STUDYVERSE PROGRESS: Could not initialize. Check script order."
            );
            return;
        }

        initialized = true;

        registerAuthListener();

        try {
            const { data, error } = await supabase.auth.getSession();

            if (error) throw error;

            currentUser = data.session
                ? data.session.user
                : null;

            if (currentUser) {
                console.log(
                    "STUDYVERSE PROGRESS: Signed-in student detected."
                );

                await loadDashboard();
            } else {
                console.log(
                    "STUDYVERSE PROGRESS: Waiting for student login."
                );
            }

        } catch (error) {
            console.error(
                "STUDYVERSE PROGRESS: Initialization failed.",
                error
            );
        }
    }

    // -----------------------------------------------------
    // 15. PUBLIC API
    // -----------------------------------------------------

    window.StudyverseProgress = {
        initialize: initialize,
        track: track,
        completeLesson: completeLesson,
        readNote: readNote,
        reviseFormula: reviseFormula,
        attemptPYQ: attemptPYQ,
        solvePYQ: solvePYQ,
        loadDashboard: loadDashboard,
        getProgressRecords: getProgressRecords,
        calculateStatistics: calculateStatistics
    };

    // -----------------------------------------------------
    // 16. START
    // -----------------------------------------------------

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

    console.log(
        "%cSTUDYVERSE AI — Learning Progress v2.0",
        "color:#8b5cf6;font-size:15px;font-weight:bold;"
    );

})();
