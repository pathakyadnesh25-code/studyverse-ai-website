
/* =========================================================
   STUDYVERSE AI — CHAPTER LEARNING SYSTEM
   Version 1.0
   Supabase-powered chapter resources
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    // -----------------------------------------------------
    // 1. SUPABASE CONFIGURATION
    // -----------------------------------------------------

    const SUPABASE_URL =
        "https://mtxkvupfczhglaqghcbc.supabase.co";

    // Paste the SAME Supabase publishable key used in
    // your existing script.js. Never use a service-role key.

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

    const messageBox = document.getElementById("page-message");

    function showMessage(message, type = "") {
        messageBox.textContent = message;
        messageBox.className = "page-message";

        if (type) {
            messageBox.classList.add(type);
        }
    }

    if (!window.supabase) {
        showMessage(
            "Supabase library could not load. Check your internet connection.",
            "error"
        );
        return;
    }

    if (
        !SUPABASE_PUBLISHABLE_KEY ||
        SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR")
    ) {
        showMessage(
            "Add your Supabase publishable key in chapter-learning.js.",
            "error"
        );
        return;
    }

    const studyverseDB = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    // -----------------------------------------------------
    // 2. GET CHAPTER ID FROM PAGE URL
    // -----------------------------------------------------

    const params = new URLSearchParams(window.location.search);

    const chapterId = params.get("chapter_id");

    if (!chapterId) {
        showMessage(
            "No chapter selected. Return to the dashboard and open a chapter.",
            "error"
        );

        document.getElementById("chapter-title").textContent =
            "No chapter selected";

        return;
    }

    // -----------------------------------------------------
    // 3. ELEMENT REFERENCES
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

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = String(text);
        }

        return element;
    }

    function setCount(element, number, label) {
        element.textContent =
            number + " " + label + (number === 1 ? "" : "s");
    }

    function showEmpty(container, title, description) {
        container.replaceChildren();

        const card = makeElement("div", "empty-card");
        const heading = makeElement("strong", "", title);
        const paragraph = makeElement("p", "", description);

        card.append(heading, paragraph);
        container.appendChild(card);
    }

    function safeHttpUrl(value) {
        if (!value) return null;

        try {
            const url = new URL(value);

            if (
                url.protocol === "https:" ||
                url.protocol === "http:"
            ) {
                return url.href;
            }

            return null;

        } catch (error) {
            return null;
        }
    }

    function addTextContent(container, content) {
        if (!content) return;

        const paragraph = makeElement("p");
        paragraph.textContent = content;
        container.appendChild(paragraph);
    }

    // -----------------------------------------------------
    // 5. LEARNING TABS
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
    // 6. CHAPTER PROGRESS
    // Stored locally in this browser for now.
    // -----------------------------------------------------

    const progressStorageKey =
        "studyverse_completed_lessons_" + chapterId;

    function getCompletedLessons() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(progressStorageKey) || "[]"
            );

            return Array.isArray(saved) ? saved : [];

        } catch (error) {
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
                "STUDYVERSE AI: Could not save local progress.",
                error
            );
        }
    }

    let totalLessons = 0;

    function updateProgress() {
        const completed = getCompletedLessons();

        const percent = totalLessons > 0
            ? Math.round(
                (completed.length / totalLessons) * 100
            )
            : 0;

        elements.progressValue.textContent = percent + "%";
        elements.progressFill.style.width = percent + "%";
    }

    // -----------------------------------------------------
    // 7. VIDEO PLAYER SUPPORT
    // Supports YouTube and direct MP4/WebM URLs.
    // -----------------------------------------------------

    function getYouTubeEmbedUrl(rawUrl) {
        try {
            const url = new URL(rawUrl);

            let videoId = "";

            if (
                url.hostname === "youtu.be" ||
                url.hostname.endsWith(".youtu.be")
            ) {
                videoId = url.pathname.split("/").filter(Boolean)[0] || "";

            } else if (
                url.hostname === "youtube.com" ||
                url.hostname.endsWith(".youtube.com")
            ) {
                videoId =
                    url.searchParams.get("v") ||
                    url.pathname.split("/").filter(Boolean).pop() ||
                    "";
            }

            if (
                !/^[a-zA-Z0-9_-]{11}$/.test(videoId)
            ) {
                return null;
            }

            return "https://www.youtube-nocookie.com/embed/" +
                encodeURIComponent(videoId);

        } catch (error) {
            return null;
        }
    }

    function addVideo(container, rawUrl, title) {

        const videoUrl = safeHttpUrl(rawUrl);

        if (!videoUrl) {
            return;
        }

        const isVideoFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl);

        if (isVideoFile) {
            const video = makeElement("video", "resource-video-player");

            video.controls = true;
            video.preload = "metadata";
            video.src = videoUrl;

            container.appendChild(video);
            return;
        }

        const youtubeEmbed = getYouTubeEmbedUrl(videoUrl);

        if (youtubeEmbed) {
            const frame = makeElement("iframe", "resource-video");

            frame.src = youtubeEmbed;
            frame.title = title || "STUDYVERSE AI lesson video";
            frame.loading = "lazy";
            frame.allow =
                "accelerometer; autoplay; clipboard-write; " +
                "encrypted-media; gyroscope; picture-in-picture; web-share";
            frame.referrerPolicy = "strict-origin-when-cross-origin";
            frame.allowFullscreen = true;

            container.appendChild(frame);
            return;
        }

        const link = makeElement("a", "resource-link", "Watch Lesson ↗");

        link.href = videoUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        container.appendChild(link);
    }

    // -----------------------------------------------------
    // 8. LOAD CHAPTER INFORMATION
    // -----------------------------------------------------

    async function loadChapter() {

        const result = await studyverseDB
            .from("chapters")
            .select(
                "id, subject_id, chapter_name, chapter_number, description"
            )
            .eq("id", chapterId)
            .eq("is_published", true)
            .maybeSingle();

        if (result.error) {
            throw result.error;
        }

        if (!result.data) {
            throw new Error(
                "Chapter not found or it is not published."
            );
        }

        const chapter = result.data;

        const subjectResult = await studyverseDB
            .from("subjects")
            .select("name, exam_id")
            .eq("id", chapter.subject_id)
            .maybeSingle();

        if (subjectResult.error) {
            throw subjectResult.error;
        }

        const subject = subjectResult.data;

        let examName = "Examination";
        let subjectName = subject ? subject.name : "Subject";

        if (subject && subject.exam_id) {

            const examResult = await studyverseDB
                .from("exams")
                .select("name")
                .eq("id", subject.exam_id)
                .maybeSingle();

            if (examResult.error) {
                throw examResult.error;
            }

            if (examResult.data) {
                examName = examResult.data.name;
            }
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

        return chapter;
    }

    // -----------------------------------------------------
    // 9. LOAD LESSONS
    // -----------------------------------------------------

    async function loadLessons() {

        const { data, error } = await studyverseDB
            .from("chapter_learning_lessons")
            .select(
                "id, lesson_number, title, description, " +
                "content_markdown, video_url, video_language, duration_minutes"
            )
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("lesson_number", { ascending: true });

        if (error) throw error;

        const lessons = data || [];

        totalLessons = lessons.length;

        setCount(elements.lessonCount, lessons.length, "lesson");

        if (lessons.length === 0) {
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

            card.appendChild(
                makeElement("h3", "", lesson.title)
            );

            addTextContent(card, lesson.description);

            if (lesson.duration_minutes) {
                card.appendChild(
                    makeElement(
                        "p",
                        "",
                        "Duration: " + lesson.duration_minutes + " minutes"
                    )
                );
            }

            if (lesson.video_language) {
                card.appendChild(
                    makeElement(
                        "p",
                        "",
                        "Language: " + lesson.video_language.toUpperCase()
                    )
                );
            }

            if (lesson.content_markdown) {
                const content = makeElement("p");
                content.textContent = lesson.content_markdown;
                card.appendChild(content);
            }

            if (lesson.video_url) {
                addVideo(card, lesson.video_url, lesson.title);
            }

            const label = makeElement("label", "completion-label");
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
    // 10. LOAD NOTES
    // -----------------------------------------------------

    async function loadNotes() {

        const { data, error } = await studyverseDB
            .from("chapter_learning_notes")
            .select("id, title, content_markdown, pdf_url")
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const notes = data || [];

        setCount(elements.notesCount, notes.length, "note");

        if (notes.length === 0) {
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

            card.appendChild(
                makeElement("h3", "", note.title)
            );

            addTextContent(card, note.content_markdown);

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
    // 11. LOAD FORMULAS
    // -----------------------------------------------------

    async function loadFormulas() {

        const { data, error } = await studyverseDB
            .from("chapter_learning_formulas")
            .select(
                "id, formula_name, formula_text, explanation"
            )
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("sort_order", { ascending: true });

        if (error) throw error;

        const formulas = data || [];

        setCount(elements.formulaCount, formulas.length, "formula");

        if (formulas.length === 0) {
            showEmpty(
                elements.formulas,
                "No formulas published yet",
                "Important chapter formulas and revision points will appear here."
            );
            return;
        }

        elements.formulas.replaceChildren();

        formulas.forEach(function (formula) {

            const card = makeElement("article", "resource-card");

            card.appendChild(
                makeElement("span", "resource-label", "QUICK REVISION")
            );

            card.appendChild(
                makeElement("h3", "", formula.formula_name)
            );

            card.appendChild(
                makeElement("code", "formula-text", formula.formula_text)
            );

            addTextContent(card, formula.explanation);

            elements.formulas.appendChild(card);
        });
    }

    // -----------------------------------------------------
    // 12. LOAD PYQs
    // -----------------------------------------------------

    async function loadPyqs() {

        const { data, error } = await studyverseDB
            .from("chapter_learning_pyqs")
            .select(
                "id, question_text, option_a, option_b, " +
                "option_c, option_d, exam_year, difficulty"
            )
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("exam_year", { ascending: false });

        if (error) throw error;

        const questions = data || [];

        setCount(elements.pyqCount, questions.length, "question");

        if (questions.length === 0) {
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
                card.appendChild(
                    makeElement("p", "", "Exam year: " + question.exam_year)
                );
            }

            if (question.difficulty) {
                card.appendChild(
                    makeElement(
                        "p",
                        "",
                        "Difficulty: " + question.difficulty
                    )
                );
            }

            const optionNames = ["A", "B", "C", "D"];

            optionNames.forEach(function (letter) {

                const optionValue =
                    question["option_" + letter.toLowerCase()];

                if (optionValue) {
                    card.appendChild(
                        makeElement(
                            "div",
                            "pyq-option",
                            letter + ". " + optionValue
                        )
                    );
                }
            });

            elements.pyqs.appendChild(card);
        });
    }

    // -----------------------------------------------------
    // 13. LESSON COMPLETION HANDLER
    // -----------------------------------------------------

    elements.lessons.addEventListener("change", function (event) {

        if (
            !event.target.matches(
                'input[type="checkbox"][data-lesson-id]'
            )
        ) {
            return;
        }

        const lessonId = event.target.dataset.lessonId;

        let completed = getCompletedLessons();

        if (event.target.checked) {

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

    });

    // -----------------------------------------------------
    // 14. START LEARNING PAGE
    // -----------------------------------------------------

    try {

        showMessage("Loading chapter information...");

        await loadChapter();

        showMessage("Loading your learning resources...");

        const sections = [
            { name: "lessons", loader: loadLessons },
            { name: "notes", loader: loadNotes },
            { name: "formulas", loader: loadFormulas },
            { name: "PYQs", loader: loadPyqs }
        ];

        const results = await Promise.allSettled(
            sections.map(function (section) {
                return section.loader();
            })
        );

        const failedSections = [];

        results.forEach(function (result, index) {

            if (result.status === "rejected") {

                failedSections.push(sections[index].name);

                console.error(
                    "STUDYVERSE AI: Could not load " +
                    sections[index].name,
                    result.reason
                );

                const target = {
                    lessons: elements.lessons,
                    notes: elements.notes,
                    formulas: elements.formulas,
                    PYQs: elements.pyqs
                }[sections[index].name];

                showEmpty(
                    target,
                    "Unable to load this section",
                    "Check the Supabase permissions and browser console."
                );
            }

        });

        if (failedSections.length > 0) {

            showMessage(
                "Chapter opened, but some resources could not load: " +
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

        console.log(
            "STUDYVERSE AI: Chapter learning page initialized.",
            {
                chapterId: chapterId,
                failedSections: failedSections
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
