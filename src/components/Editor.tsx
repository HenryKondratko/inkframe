import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export default function Editor() {
    const [markdown, setMarkdown] = useState(initialMarkdown);
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

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 h-16 border-b bg-white dark:bg-gray-900 dark:border-gray-700">
                <h1 className="text-lg font-semibold">Inkframe</h1>
                <div className="space-x-2">
                    {['write', 'preview', 'split'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode as ViewMode)}
                            className={`px-3 py-1 rounded text-sm ${
                                viewMode === mode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                            }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            {/* Editor + Preview */}
            <div
                id="split-container"
                className={`flex flex-1 h-0 ${isMobile ? "flex-col" : "flex-row"} overflow-hidden bg-gray-900 dark:bg-gray-950`}
            >
                {viewMode === "split" && (
                    <>
                        <div
                            className="min-w-0 h-full bg-transparent flex flex-col"
                            style={leftStyle}
                        >
                            <textarea
                                className="w-full h-full p-4 font-mono text-lg resize-none bg-transparent text-white outline-none focus:ring-2 focus:ring-blue-400"
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                aria-label="Markdown editor"
                            />
                        </div>
                        <div
                            className="gutter gutter-horizontal flex items-center justify-center cursor-col-resize bg-gray-800 hover:bg-blue-600 transition w-2"
                            onMouseDown={onMouseDown}
                            onDoubleClick={() => setLeftWidth(50)}
                            style={{ zIndex: 10 }}
                            aria-label="Resize editor and preview"
                            role="separator"
                            tabIndex={0}
                        />
                        <div
                            className="min-w-0 h-full bg-transparent flex flex-col items-center justify-start pt-8 pb-8 px-4"
                            style={rightStyle}
                        >
                            <div className="w-full max-w-4xl p-6 prose prose-blue dark:prose-invert bg-transparent rounded-lg shadow-md overflow-y-auto">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                            </div>
                        </div>
                    </>
                )}
                {viewMode === "write" && (
                    <div className="w-full h-full flex flex-col items-center justify-start pt-8 pb-8 px-4">
                        <textarea
                            className="w-full h-full max-w-4xl max-h-full p-6 font-mono text-lg resize-none bg-transparent text-white outline-none focus:ring-2 focus:ring-blue-400 rounded-lg shadow-md"
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            aria-label="Markdown editor"
                        />
                    </div>
                )}
                {viewMode === "preview" && (
                    <div className="w-full flex flex-col items-center justify-start pt-8 pb-8 px-4 overflow-y-auto">
                        <div className="w-full max-w-4xl p-6 prose prose-blue dark:prose-invert bg-transparent rounded-lg shadow-md overflow-y-auto">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
