
/* =========================================================
   STUDYVERSE AI — CHAPTER LEARNING SYSTEM
   Version 2.0

   FEATURES
   1. Supabase-powered chapter information
   2. Video lessons (YouTube / MP4 / WebM)
   3. English learning-page content
   4. Video narration language display
   5. Study notes and PDF links
   6. Formula revision tracking
   7. PYQ attempt tracking
   8. Lesson completion tracking
   9. Supabase learning_progress_events integration
  10. Local chapter completion progress
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {
    "use strict";

    // -----------------------------------------------------
    // 1. SUPABASE CONFIGURATION
    // -----------------------------------------------------

    const SUPABASE_URL =
        "https://mtxkvupfczhglaqghcbc.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

    const PROGRESS_TABLE = "learning_progress_events";

    let db = window.studyverseSupabase || null;

    if (!db && window.supabase) {
        db = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

        window.studyverseSupabase = db;
    }

    const messageBox = document.getElementById("page-message");

    function showMessage(message, type = "") {
        if (!messageBox) return;

        messageBox.textContent = message;
        messageBox.className = "page-message";

        if (type) {
            messageBox.classList.add(type);
        }
    }

    if (!db) {
        showMessage(
            "Supabase could not load. Check your internet connection and refresh.",
            "error"
        );
        return;
    }

    // -----------------------------------------------------
    // 2. GET CHAPTER ID
    // -----------------------------------------------------

    const params = new URLSearchParams(window.location.search);
    const chapterId = params.get("chapter_id");

    if (!chapterId) {
        showMessage(
            "No chapter selected. Return to the dashboard and open a chapter.",
            "error"
        );

        const title = document.getElementById("chapter-title");
        if (title) title.textContent = "No chapter selected";

        return;
    }

    // -----------------------------------------------------
    // 3. PAGE ELEMENTS
    // -----------------------------------------------------

    const elements = {
        title: document.getElementById("chapter-title"),
        description: document.getElementById("chapter-description"),
        exam: document.getElementById("chapter-exam"),
        subject: document.getElementById("chapter-subject"),
        number: document.getElementById("chapter-number"),

        breadcrumbExam: document.getElementById("breadcrumb-exam"),
        breadcrumbSubject: document.getElementById("breadcrumb-subject"),

        lessons: document.getElementById("lesson-list"),
        notes: document.getElementById("notes-list"),
        formulas: document.getElementById("formula-list"),
        pyqs: document.getElementById("pyq-list"),

        lessonCount: document.getElementById("lesson-count"),
        notesCount: document.getElementById("notes-count"),
        formulaCount: document.getElementById("formula-count"),
        pyqCount: document.getElementById("pyq-count"),

        progressValue: document.getElementById("progress-value"),
        progressFill: document.getElementById("progress-fill")
    };

    // -----------------------------------------------------
    // 4. SAFE DOM HELPERS
    // -----------------------------------------------------

    function makeElement(tag, className = "", text = null) {
        const element = document.createElement(tag);

        if (className) element.className = className;

        if (text !== null && text !== undefined) {
            element.textContent = String(text);
        }

        return element;
    }

    function setCount(element, count, label) {
        if (!element) return;

        element.textContent =
            count + " " + label + (count === 1 ? "" : "s");
    }

    function showEmpty(container, heading, description) {
        if (!container) return;

        container.replaceChildren();

        const card = makeElement("div", "empty-card");
        card.append(
            makeElement("strong", "", heading),
            makeElement("p", "", description)
        );

        container.appendChild(card);
    }

    function safeHttpUrl(value) {
        if (!value) return null;

        try {
            const url = new URL(value);

            return url.protocol === "https:" ||
                url.protocol === "http:"
                ? url.href
                : null;
        } catch {
            return null;
        }
    }

    function addTextContent(container, content) {
        if (!container || !content) return;

        const paragraph = makeElement("p");
        paragraph.textContent = content;
        container.appendChild(paragraph);
    }

    function showToast(message) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = makeElement("div", "sv-learning-toast");
            toast.id = "toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("show");

        window.clearTimeout(showToast.timer);

        showToast.timer = window.setTimeout(function () {
            toast.classList.remove("show");
        }, 2800);
    }

    // -----------------------------------------------------
    // 5. LEARNING PROGRESS INTEGRATION
    // -----------------------------------------------------

    async function saveLearningActivity(
        eventType,
        resourceId = null,
        metadata = {}
    ) {
        try {
            // Prefer the central progress system when loaded.
            if (
                window.StudyverseProgress &&
                typeof window.StudyverseProgress.track === "function"
            ) {
                return await window.StudyverseProgress.track({
                    eventType: eventType,
                    resourceId: resourceId,
                    chapterId: chapterId,
                    metadata: metadata
                });
            }

            // Fallback: save directly to Supabase.
            const { data: userResult, error: userError } =
                await db.auth.getUser();

            if (userError) throw userError;

            const user = userResult.user;

            if (!user) {
                showToast("Log in to save this activity to your account.");
                return null;
            }

            const { data, error } = await db
                .from(PROGRESS_TABLE)
                .insert({
                    user_id: user.id,
                    chapter_id: chapterId,
                    event_type: eventType,
                    resource_id: resourceId
                        ? String(resourceId)
                        : null,
                    metadata: metadata
                })
                .select()
                .single();

            if (error) throw error;

            document.dispatchEvent(
                new CustomEvent("studyverse:progress-updated", {
                    detail: {
                        eventType: eventType,
                        record: data
                    }
                })
            );

            return data;

        } catch (error) {
            console.error(
                "STUDYVERSE AI: Could not save learning activity:",
                error
            );

            showToast(
                "Activity could not be saved. Please check your login and Supabase permissions."
            );

            return null;
        }
    }

    // -----------------------------------------------------
    // 6. LEARNING TABS
    // -----------------------------------------------------

    const tabButtons = document.querySelectorAll("[data-tab]");
    const tabSections = document.querySelectorAll("[data-section]");

    tabButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const selectedTab = button.dataset.tab;

            tabButtons.forEach(function (item) {
                item.classList.toggle("active", item === button);
            });

            tabSections.forEach(function (section) {
                section.classList.toggle(
                    "active",
                    section.dataset.section === selectedTab
                );
            });
        });
    });

    // -----------------------------------------------------
    // 7. LOCAL LESSON COMPLETION
    // -----------------------------------------------------

    const progressStorageKey =
        "studyverse_completed_lessons_" + chapterId;

    function getCompletedLessons() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(progressStorageKey) || "[]"
            );

            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }

    function saveCompletedLessons(completed) {
        try {
            localStorage.setItem(
                progressStorageKey,
                JSON.stringify(completed)
            );
        } catch (error) {
            console.warn(
                "STUDYVERSE AI: Local progress could not be saved.",
                error
            );
        }
    }

    let totalLessons = 0;

    function updateProgress() {
        const completed = getCompletedLessons();

        const percent = totalLessons > 0
            ? Math.min(
                100,
                Math.round((completed.length / totalLessons) * 100)
            )
            : 0;

        if (elements.progressValue) {
            elements.progressValue.textContent = percent + "%";
        }

        if (elements.progressFill) {
            elements.progressFill.style.width = percent + "%";
        }
    }

    // -----------------------------------------------------
    // 8. VIDEO PLAYER
    // -----------------------------------------------------

    function getYouTubeEmbedUrl(rawUrl) {
        try {
            const url = new URL(rawUrl);
            let videoId = "";

            if (
                url.hostname === "youtu.be" ||
                url.hostname.endsWith(".youtu.be")
            ) {
                videoId =
                    url.pathname.split("/").filter(Boolean)[0] || "";
            } else if (
                url.hostname === "youtube.com" ||
                url.hostname.endsWith(".youtube.com")
            ) {
                videoId =
                    url.searchParams.get("v") ||
                    url.pathname.split("/").filter(Boolean).pop() ||
                    "";
            }

            if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                return null;
            }

            return (
                "https://www.youtube-nocookie.com/embed/" +
                encodeURIComponent(videoId)
            );
        } catch {
            return null;
        }
    }

    function addVideo(container, rawUrl, title) {
        const videoUrl = safeHttpUrl(rawUrl);
        if (!videoUrl) return;

        if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl)) {
            const video = makeElement(
                "video",
                "resource-video-player"
            );

            video.controls = true;
            video.preload = "metadata";
            video.playsInline = true;
            video.src = videoUrl;

            container.appendChild(video);
            return;
        }

        const embedUrl = getYouTubeEmbedUrl(videoUrl);

        if (embedUrl) {
            const frame = makeElement("iframe", "resource-video");

            frame.src = embedUrl;
            frame.title = title || "STUDYVERSE AI lesson video";
            frame.loading = "lazy";
            frame.allow =
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            frame.referrerPolicy =
                "strict-origin-when-cross-origin";
            frame.allowFullscreen = true;

            container.appendChild(frame);
            return;
        }

        const link = makeElement(
            "a",
            "resource-link",
            "Watch Lesson ↗"
        );

        link.href = videoUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        container.appendChild(link);
    }

    // -----------------------------------------------------
    // 9. LOAD CHAPTER INFORMATION
    // -----------------------------------------------------

    async function loadChapter() {
        const { data: chapter, error } = await db
            .from("chapters")
            .select(
                "id, subject_id, chapter_name, chapter_number, description"
            )
            .eq("id", chapterId)
            .eq("is_published", true)
            .maybeSingle();

        if (error) throw error;

        if (!chapter) {
            throw new Error(
                "Chapter not found or it is not published."
            );
        }

        const { data: subject, error: subjectError } = await db
            .from("subjects")
            .select("name, exam_id")
            .eq("id", chapter.subject_id)
            .maybeSingle();

        if (subjectError) throw subjectError;

        let examName = "Examination";
        const subjectName = subject ? subject.name : "Subject";

        if (subject && subject.exam_id) {
            const { data: exam, error: examError } = await db
                .from("exams")
                .select("name")
                .eq("id", subject.exam_id)
                .maybeSingle();

            if (examError) throw examError;

            if (exam) examName = exam.name;
        }

        elements.title.textContent = chapter.chapter_name;

        elements.description.textContent =
            chapter.description ||
            "Explore the lessons and learning resources for this chapter.";

        elements.exam.textContent = examName;
        elements.subject.textContent = subjectName;

        elements.number.textContent =
            "Chapter " + chapter.chapter_number;

        elements.breadcrumbExam.textContent = examName;
        elements.breadcrumbSubject.textContent = subjectName;

        document.title =
            chapter.chapter_name + " | STUDYVERSE AI";

        document.body.dataset.chapterId = chapter.id;

        return chapter;
    }

    // -----------------------------------------------------
    // 10. LOAD VIDEO LESSONS
    // -----------------------------------------------------

    async function loadLessons() {
        const { data, error } = await db
            .from("chapter_learning_lessons")
            .select(
                "id, lesson_number, title, description, content_markdown, video_url, video_language, duration_minutes"
            )
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("lesson_number", { ascending: true });

        if (error) throw error;

        const lessons = data || [];
        totalLessons = lessons.length;

        setCount(elements.lessonCount, lessons.length, "lesson");

        if (!lessons.length) {
            showEmpty(
                elements.lessons,
                "No lessons published yet",
                "Video lessons will appear here when learning content is added."
            );

            updateProgress();
            return;
        }

        elements.lessons.replaceChildren();

        const completed = getCompletedLessons();

        lessons.forEach(function (lesson) {
            const card = makeElement("article", "resource-card");

            card.appendChild(
                makeElement(
                    "span",
                    "resource-label",
                    "LESSON " + lesson.lesson_number
                )
            );

            card.appendChild(makeElement("h3", "", lesson.title));

            addTextContent(card, lesson.description);

            if (lesson.duration_minutes) {
                addTextContent(
                    card,
                    "Duration: " + lesson.duration_minutes + " minutes"
                );
            }

            if (lesson.video_language) {
                addTextContent(
                    card,
                    "Video narration: " +
                    String(lesson.video_language).toUpperCase()
                );
            }

            if (lesson.content_markdown) {
                const content = makeElement(
                    "div",
                    "lesson-content"
                );

                // Display stored text safely as text, not executable HTML.
                content.textContent = lesson.content_markdown;
                card.appendChild(content);
            }

            if (lesson.video_url) {
                addVideo(card, lesson.video_url, lesson.title);
            }

            const label = makeElement(
                "label",
                "completion-label"
            );

            const checkbox = makeElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = completed.includes(lesson.id);
            checkbox.dataset.lessonId = lesson.id;

            const labelText = makeElement(
                "span",
                "",
                "Mark this lesson as completed"
            );

            label.append(checkbox, labelText);
            card.appendChild(label);

            elements.lessons.appendChild(card);
        });

        updateProgress();
    }

    // -----------------------------------------------------
    // 11. LOAD STUDY NOTES
    // -----------------------------------------------------

    async function loadNotes() {
        const { data, error } = await db
            .from("chapter_learning_notes")
            .select("id, title, content_markdown, pdf_url")
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const notes = data || [];
        setCount(elements.notesCount, notes.length, "note");

        if (!notes.length) {
            showEmpty(
                elements.notes,
                "No notes published yet",
                "Chapter notes and downloadable PDFs will appear here."
            );
            return;
        }

        elements.notes.replaceChildren();

        notes.forEach(function (note) {
            const card = makeElement("article", "resource-card");

            card.appendChild(
                makeElement("span", "resource-label", "STUDY NOTES")
            );

            card.appendChild(makeElement("h3", "", note.title));
            addTextContent(card, note.content_markdown);

            const readButton = makeElement(
                "button",
                "resource-action",
                "Mark notes as read"
            );

            readButton.type = "button";

            readButton.addEventListener("click", async function () {
                readButton.disabled = true;

                const result = await saveLearningActivity(
                    "note_read",
                    note.id
                );

                if (result) {
                    readButton.textContent = "✓ Reading recorded";
                    showToast("Notes reading recorded!");
                } else {
                    readButton.disabled = false;
                }
            });

            card.appendChild(readButton);

            const pdfUrl = safeHttpUrl(note.pdf_url);

            if (pdfUrl) {
                const link = makeElement(
                    "a",
                    "resource-link",
                    "Open / Download PDF ↗"
                );

                link.href = pdfUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";

                card.appendChild(link);
            }

            elements.notes.appendChild(card);
        });
    }

    
    // -----------------------------------------------------
    // 12. LOAD FORMULAS — PUBLIC.FORMULAS
    // -----------------------------------------------------

    async function loadFormulas() {

        const { data, error } = await db
            .from("formulas")
            .select(`
                id,
                chapter_id,
                title,
                formula_text,
                explanation,
                is_published,
                created_at
            `)
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("title", { ascending: true });

        if (error) {
            console.error(
                "STUDYVERSE AI: Formula loading error:",
                error
            );
            throw error;
        }

        const formulas = data || [];

        setCount(
            elements.formulaCount,
            formulas.length,
            "formula"
        );

        if (!elements.formulas) return;

        if (!formulas.length) {
            showEmpty(
                elements.formulas,
                "No formulas published yet",
                "No published formulas were found for this chapter. Check the Supabase formulas table."
            );
            return;
        }

        elements.formulas.replaceChildren();

        formulas.forEach(function (formula, index) {

            const card = makeElement(
                "article",
                "resource-card formula-card"
            );

            card.appendChild(
                makeElement(
                    "span",
                    "resource-label",
                    "FORMULA " + (index + 1)
                )
            );

            card.appendChild(
                makeElement(
                    "h3",
                    "",
                    formula.title || "Important Formula"
                )
            );

            const formulaBox = makeElement(
                "div",
                "formula-display"
            );

            const formulaCode = makeElement(
                "code",
                "formula-text",
                formula.formula_text || "Formula not available"
            );

            formulaBox.appendChild(formulaCode);
            card.appendChild(formulaBox);

            if (formula.explanation) {
                const explanation = makeElement(
                    "p",
                    "formula-explanation",
                    formula.explanation
                );

                card.appendChild(explanation);
            }

            const actions = makeElement(
                "div",
                "formula-actions"
            );

            const copyButton = makeElement(
                "button",
                "resource-action",
                "Copy Formula"
            );

            copyButton.type = "button";

            copyButton.addEventListener("click", async function () {

                const copyText =
                    (formula.title || "") +
                    "\n" +
                    (formula.formula_text || "") +
                    "\n" +
                    (formula.explanation || "");

                try {
                    await navigator.clipboard.writeText(copyText);

                    copyButton.textContent = "✓ Copied";
                    showToast("Formula copied successfully!");

                    setTimeout(function () {
                        copyButton.textContent = "Copy Formula";
                    }, 2000);

                } catch (error) {
                    console.error("Copy failed:", error);
                    showToast("Unable to copy. Please select the formula manually.");
                }
            });

            const reviseButton = makeElement(
                "button",
                "resource-action",
                "Mark as revised"
            );

            reviseButton.type = "button";

            reviseButton.addEventListener("click", async function () {

                reviseButton.disabled = true;

                const result = await saveLearningActivity(
                    "formula_revised",
                    formula.id,
                    {
                        formula_title: formula.title || ""
                    }
                );

                if (result) {
                    reviseButton.textContent = "✓ Revision recorded";
                    showToast("Formula revision recorded!");
                } else {
                    reviseButton.disabled = false;
                }
            });

            actions.append(copyButton, reviseButton);
            card.appendChild(actions);

            elements.formulas.appendChild(card);
        });

        console.log(
            "STUDYVERSE AI: Formulas loaded successfully.",
            formulas.length
        );
    }


    // -----------------------------------------------------
    // 13. LOAD PREVIOUS YEAR QUESTIONS
    // -----------------------------------------------------

    async function loadPyqs() {
        const { data, error } = await db
            .from("chapter_learning_pyqs")
            .select(
                "id, question_text, option_a, option_b, option_c, option_d, exam_year, difficulty"
            )
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("exam_year", { ascending: false });

        if (error) throw error;

        const questions = data || [];
        setCount(elements.pyqCount, questions.length, "question");

        if (!questions.length) {
            showEmpty(
                elements.pyqs,
                "No PYQs published yet",
                "Previous-year questions will appear here when added."
            );
            return;
        }

        elements.pyqs.replaceChildren();

        questions.forEach(function (question, index) {
            const card = makeElement("article", "resource-card");

            card.appendChild(
                makeElement(
                    "span",
                    "resource-label",
                    "QUESTION " + (index + 1)
                )
            );

            card.appendChild(
                makeElement("h3", "", question.question_text)
            );

            if (question.exam_year) {
                addTextContent(
                    card,
                    "Exam year: " + question.exam_year
                );
            }

            if (question.difficulty) {
                addTextContent(
                    card,
                    "Difficulty: " + question.difficulty
                );
            }

            const options = [
                ["A", question.option_a],
                ["B", question.option_b],
                ["C", question.option_c],
                ["D", question.option_d]
            ].filter(function (option) {
                return Boolean(option[1]);
            });

            options.forEach(function (option) {
                const optionButton = makeElement(
                    "button",
                    "pyq-option",
                    option[0] + ". " + option[1]
                );

                optionButton.type = "button";

                optionButton.addEventListener("click", async function () {
                    const buttons = card.querySelectorAll(".pyq-option");

                    buttons.forEach(function (button) {
                        button.disabled = true;
                    });

                    const result = await saveLearningActivity(
                        "pyq_attempted",
                        question.id,
                        {
                            selected_option: option[0],
                            exam_year: question.exam_year || null
                        }
                    );

                    if (result) {
                        optionButton.classList.add("selected");
                        showToast("Your PYQ attempt has been recorded.");
                    } else {
                        buttons.forEach(function (button) {
                            button.disabled = false;
                        });
                    }
                });

                card.appendChild(optionButton);
            });

            elements.pyqs.appendChild(card);
        });
    }

    // -----------------------------------------------------
    // 14. LESSON COMPLETION EVENT
    // -----------------------------------------------------

    if (elements.lessons) {
        elements.lessons.addEventListener("change", async function (event) {
            const checkbox = event.target.closest(
                'input[type="checkbox"][data-lesson-id]'
            );

            if (!checkbox) return;

            const lessonId = checkbox.dataset.lessonId;
            let completed = getCompletedLessons();

            if (checkbox.checked) {
                if (!completed.includes(lessonId)) {
                    completed.push(lessonId);
                }
            } else {
                completed = completed.filter(function (id) {
                    return id !== lessonId;
                });
            }

            saveCompletedLessons(completed);
            updateProgress();

            if (checkbox.checked) {
                const result = await saveLearningActivity(
                    "lesson_completed",
                    lessonId
                );

                if (result) {
                    showToast("Lesson completion saved!");
                }
            }
        });
    }

    // -----------------------------------------------------
    // 15. LOAD ALL CHAPTER RESOURCES
    // -----------------------------------------------------

    try {
        showMessage("Loading chapter information...");

        await loadChapter();

        showMessage("Loading your learning resources...");

        const sections = [
            { name: "lessons", loader: loadLessons, target: elements.lessons },
            { name: "notes", loader: loadNotes, target: elements.notes },
            { name: "formulas", loader: loadFormulas, target: elements.formulas },
            { name: "PYQs", loader: loadPyqs, target: elements.pyqs }
        ];

        const results = await Promise.allSettled(
            sections.map(function (section) {
                return section.loader();
            })
        );

        const failedSections = [];

        results.forEach(function (result, index) {
            if (result.status === "rejected") {
                const section = sections[index];
                failedSections.push(section.name);

                console.error(
                    "STUDYVERSE AI: Could not load " + section.name,
                    result.reason
                );

                showEmpty(
                    section.target,
                    "Unable to load this section",
                    "Check the Supabase table, permissions and browser console."
                );
            }
        });

        if (failedSections.length) {
            showMessage(
                "Chapter opened, but these resources could not load: " +
                failedSections.join(", ") +
                ". Check the browser console.",
                "error"
            );
        } else {
            showMessage(
                "Chapter loaded successfully. Happy learning!",
                "success"
            );
        }

        updateProgress();

        console.log(
            "STUDYVERSE AI: Chapter Learning Version 2.0 initialized.",
            {
                chapterId: chapterId,
                failedSections: failedSections,
                progressTracking:
                    Boolean(window.StudyverseProgress)
            }
        );

    } catch (error) {
        console.error(
            "STUDYVERSE AI: Chapter loading failed:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load this chapter. Check Supabase configuration.",
            "error"
        );
    }
});
