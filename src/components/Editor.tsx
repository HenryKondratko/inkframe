import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "./Sidebar.tsx";
import { v4 as uuidv4 } from "uuid";

const initialMarkdown = `# Welcome to Inkframe ✍️

This is your minimalist markdown editor.

- Write on the left
- Preview on the right
- Toggle views at the top

# Heading

- Item 1
- Item 2

**Bold** _Italic_ [Link](https://example.com)
`;

type ViewMode = "write" | "preview" | "split";

// LocalStorage keys
const STORAGE_KEY_DOCS = 'inkframe.documents';
const STORAGE_KEY_ACTIVE = 'inkframe.activeDocumentId';
const SIDEBAR_OPEN_KEY = 'inkframe.sidebarOpen';

function getInitialDocuments() {
    try {
        const docsRaw = localStorage.getItem(STORAGE_KEY_DOCS);
        if (docsRaw) {
            const docs = JSON.parse(docsRaw);
            if (Array.isArray(docs) && docs.length > 0 && docs[0].id && docs[0].title && docs[0].content !== undefined) {
                return docs;
            }
        }
    } catch {}
    return [{ id: "1", title: "Welcome.md", content: initialMarkdown }];
}
function getInitialActiveId(docs: {id: string}[]) {
    try {
        const activeRaw = localStorage.getItem(STORAGE_KEY_ACTIVE);
        if (activeRaw && docs.some(d => d.id === activeRaw)) {
            return activeRaw;
        }
    } catch {}
    const [firstDoc] = docs;
    if (firstDoc && firstDoc.id) {
        return firstDoc.id;
    }
    return "1"; // fallback if docs is empty
}

export default function Editor() {
    const [documents, setDocuments] = useState(getInitialDocuments);
    const [activeDocumentId, setActiveDocumentId] = useState(() => getInitialActiveId(getInitialDocuments()));
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        try {
            const stored = localStorage.getItem(SIDEBAR_OPEN_KEY);
            if (stored !== null) return stored === 'true';
        } catch {}
        return true;
    });
    const activeDoc = documents.find((doc) => doc.id === activeDocumentId);

    function handleSelectDocument(id: string) {
        setActiveDocumentId(id);
    }
    function handleNewFile() {
        const newId = uuidv4();
        const newDoc = { id: newId, title: `Untitled ${documents.length + 1}.md`, content: initialMarkdown };
        setDocuments((docs) => [...docs, newDoc]);
        setActiveDocumentId(newId);
    }
    function handleChangeContent(newContent: string) {
        setDocuments((docs) =>
            docs.map((doc) =>
                doc.id === activeDocumentId ? { ...doc, content: newContent } : doc
            )
        );
    }
    function handleRenameDocument(id: string, newTitle: string) {
        setDocuments(docs => docs.map(doc => doc.id === id ? { ...doc, title: newTitle } : doc));
    }
    function handleDeleteDocument(id: string) {
        setDocuments((docs) => {
            if (docs.length === 1) return docs; // Prevent deleting last file
            const idx = docs.findIndex(doc => doc.id === id);
            if (idx === -1) return docs;
            const newDocs = docs.filter(doc => doc.id !== id);
            // If the deleted doc was active, select previous, next, or first
            if (id === activeDocumentId) {
                const newIdx = idx > 0 ? idx - 1 : 0;
                setActiveDocumentId(newDocs[newIdx].id);
            }
            return newDocs;
        });
    }

    const [viewMode, setViewMode] = useState<ViewMode>("split");
    const [leftWidth, setLeftWidth] = useState(50); // percent
    const [dragging, setDragging] = useState(false);
    const draggingRef = useRef(false);
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth < 768);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Keep ref in sync with state
    useEffect(() => {
        draggingRef.current = dragging;
    }, [dragging]);

    // Mouse event handlers for resizing
    function onMouseDown() {
        setDragging(true);
        if (typeof document !== 'undefined') document.body.style.cursor = "col-resize";
    }
    function onMouseMove(e: MouseEvent) {
        if (!draggingRef.current) return;
        const container = document.getElementById("split-container");
        if (!container) return;
        const rect = container.getBoundingClientRect();
        let percent = ((e.clientX - rect.left) / rect.width) * 100;
        percent = Math.max(10, Math.min(90, percent));
        setLeftWidth(percent);
        // console.log('Resizing:', percent);
    }
    function onMouseUp() {
        setDragging(false);
        if (typeof document !== 'undefined') document.body.style.cursor = "";
    }
    // Attach listeners once
    useEffect(() => {
        function move(e: MouseEvent) { onMouseMove(e); }
        function up() { onMouseUp(); }
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, []);

    // Use flexBasis for pane sizing
    const leftStyle = isMobile || viewMode !== "split" ? {} : { flexBasis: `${leftWidth}%` };
    const rightStyle = isMobile || viewMode !== "split" ? {} : { flexBasis: `${100 - leftWidth}%` };

    // Theme state and effect
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            if (stored) return stored;
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        }
        return 'light';
    });
    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    // Download functionality for any document
    function handleDownload(docId: string) {
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;
        let filename = doc.title || 'document.md';
        if (!filename.toLowerCase().endsWith('.md')) {
            filename += '.md';
        }
        const blob = new Blob([doc.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    // Save to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(documents));
            localStorage.setItem(STORAGE_KEY_ACTIVE, activeDocumentId);
        } catch (e) {
            // Ignore quota errors
            console.warn('Failed to save Inkframe docs to localStorage:', e);
        }
    }, [documents, activeDocumentId]);

    useEffect(() => {
        console.log('activeDoc:', activeDoc);
        if (activeDoc) {
            console.log('activeDoc.content:', JSON.stringify(activeDoc.content));
        }
    }, [activeDoc]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 h-16 border-b-2 border-primary dark:border-b dark:border-surfaceDark bg-background dark:bg-backgroundDark">
                <h1 className="text-lg font-semibold text-primary dark:text-primaryDark">Inkframe</h1>
                <div className="space-x-2 flex items-center">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded border border-surface dark:border-surfaceDark bg-surface dark:bg-surfaceDark text-accent dark:text-accentDark hover:bg-primary hover:text-white dark:hover:bg-primaryDark dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accentDark"
                        aria-label="Toggle dark mode"
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
                        )}
                    </button>
                    {['write', 'preview', 'split'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode as ViewMode)}
                            className={`px-3 py-1 rounded text-sm border border-surface dark:border-surfaceDark transition-colors focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accentDark ${
                                viewMode === mode
                                    ? 'bg-primary text-white dark:bg-primaryDark'
                                    : 'bg-surface text-text dark:bg-surfaceDark dark:text-textDark'
                            }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                    {/* Download button removed from toolbar */}
                </div>
            </div>
            {/* Main content: Sidebar + Editor */}
            <div className="flex flex-row flex-1 h-full w-full">
                {/* Sidebar */}
                <Sidebar
                    documents={documents.map(({ id, title }) => ({ id, title }))}
                    activeDocumentId={activeDocumentId}
                    onSelect={handleSelectDocument}
                    onNewFile={handleNewFile}
                    onRename={handleRenameDocument}
                    onDelete={handleDeleteDocument}
                    onDownload={handleDownload}
                    open={sidebarOpen}
                    setOpen={setSidebarOpen}
                />
                {/* Editor + Preview */}
                <div className="flex-1 flex flex-col h-full">
                    <div
                        id="split-container"
                        className={`flex flex-1 h-0 ${isMobile ? "flex-col" : "flex-row"} overflow-hidden bg-background dark:bg-backgroundDark`}
                    >
                        {viewMode === "split" && (
                            <>
                                <div
                                    className="min-w-0 h-full bg-transparent flex flex-col"
                                    style={leftStyle}
                                >
                                    <textarea
                                        className="w-full h-full p-6 font-mono text-lg resize-none bg-transparent text-text dark:text-textDark outline-none focus:ring-2 focus:ring-blue-400"
                                        value={activeDoc && typeof activeDoc.content === 'string' ? activeDoc.content : ""}
                                        onChange={activeDoc ? (e) => handleChangeContent(e.target.value) : () => {}}
                                        aria-label="Markdown editor"
                                        placeholder="Type your markdown here..."
                                    />
                                </div>
                                <div
                                    className="gutter gutter-horizontal flex items-center justify-center cursor-col-resize bg-primary dark:bg-surfaceDark border-l-0 dark:border-l dark:border-surfaceDark"
                                    style={{ zIndex: 10, width: '0.25rem' }}
                                    onMouseDown={onMouseDown}
                                    onDoubleClick={() => setLeftWidth(50)}
                                    aria-label="Resize editor and preview"
                                    role="separator"
                                    tabIndex={0}
                                />
                                <div
                                    className="min-w-0 h-full bg-transparent flex flex-col items-center justify-start pb-8 px-4"
                                    style={rightStyle}
                                >
                                    <div className="w-full max-w-4xl p-6 prose prose-accent dark:prose-invert bg-transparent rounded-lg overflow-y-auto"
                                    >
                                        {activeDoc && <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeDoc.content}</ReactMarkdown>}
                                    </div>
                                </div>
                            </>
                        )}
                        {viewMode === "write" && (
                            <div className="flex flex-1 h-full items-start justify-center pt-8 pb-8 px-4">
                                <textarea
                                    className="max-w-4xl w-full h-full p-6 font-mono text-lg resize-none bg-surface dark:bg-surfaceDark text-text dark:text-textDark outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accentDark rounded-lg shadow-md border border-surface dark:border-surfaceDark"
                                    value={activeDoc && typeof activeDoc.content === 'string' ? activeDoc.content : ""}
                                    onChange={activeDoc ? (e) => handleChangeContent(e.target.value) : () => {}}
                                    aria-label="Markdown editor"
                                    placeholder="Type your markdown here..."
                                />
                            </div>
                        )}
                        {viewMode === "preview" && (
                            <div className="flex flex-1 h-full items-start justify-center pt-8 pb-8 px-4 overflow-y-auto">
                                <div className="max-w-4xl w-full h-full p-6 prose prose-accent dark:prose-invert bg-surface dark:bg-surfaceDark rounded-lg shadow-md overflow-y-auto border border-surface dark:border-surfaceDark">
                                    {activeDoc && <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeDoc.content}</ReactMarkdown>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
