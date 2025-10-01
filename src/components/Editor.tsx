import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const initialMarkdown = `# Welcome to Inkframe ✍️

This is your minimalist markdown editor.

- Write on the left
- Preview on the right
- Toggle views at the top`;

type ViewMode = "write" | "preview" | "split";

export default function Editor() {
    const [markdown, setMarkdown] = useState(initialMarkdown);
    const [viewMode, setViewMode] = useState<ViewMode>("split");

    return (
        <div className="flex flex-col h-screen">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-900 dark:border-gray-700">
                <h1 className="text-lg font-semibold">Inkframe</h1>
                <div className="space-x-2">
                    {["write", "preview", "split"].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode as ViewMode)}
                            className={`px-3 py-1 rounded text-sm ${
                                viewMode === mode
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                            }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor + Preview */}
            <div className="flex flex-1 overflow-hidden">
                {(viewMode === "write" || viewMode === "split") && (
                    <textarea
                        className="w-full md:w-1/2 h-full p-4 font-mono text-base resize-none bg-white dark:bg-gray-950 dark:text-white border-r border-gray-200 dark:border-gray-800 outline-none"
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                    />
                )}

                {(viewMode === "preview" || viewMode === "split") && (
                    <div className="w-full md:w-1/2 h-full p-4 overflow-y-auto prose dark:prose-invert dark:bg-gray-900 bg-gray-50">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
