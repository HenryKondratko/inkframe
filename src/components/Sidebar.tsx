import React, { useState } from "react";

export type Document = {
    id: string;
    title: string;
};

interface SidebarProps {
    documents: Document[];
    activeDocumentId: string;
    onSelect: (id: string) => void;
    onNewFile: () => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
}

export default function Sidebar({ documents, activeDocumentId, onSelect, onNewFile, onRename, onDelete }: SidebarProps) {
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");

    function startRenaming(id: string, currentTitle: string) {
        setRenamingId(id);
        setRenameValue(currentTitle);
    }
    function finishRenaming(id: string) {
        if (renameValue.trim() && renameValue !== documents.find(d => d.id === id)?.title) {
            onRename(id, renameValue.trim());
        }
        setRenamingId(null);
        setRenameValue("");
    }
    function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>, id: string) {
        if (e.key === "Enter") {
            finishRenaming(id);
        } else if (e.key === "Escape") {
            setRenamingId(null);
            setRenameValue("");
        }
    }

    return (
        <aside className="flex flex-col h-full w-56 bg-surface dark:bg-surfaceDark border-r border-surface dark:border-surfaceDark">
            <div className="flex-1 overflow-y-auto">
                <ul className="py-2">
                    {documents.map((doc, idx) => (
                        <li key={doc.id} className="group relative flex items-center">
                            {renamingId === doc.id ? (
                                <input
                                    className={`w-full px-4 py-2 rounded bg-background dark:bg-backgroundDark text-text dark:text-textDark border border-accent focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accentDark`}
                                    value={renameValue}
                                    autoFocus
                                    onChange={e => setRenameValue(e.target.value)}
                                    onBlur={() => finishRenaming(doc.id)}
                                    onKeyDown={e => handleRenameKeyDown(e, doc.id)}
                                />
                            ) : (
                                <>
                                    <button
                                        className={`w-full text-left px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accentDark ${
                                            doc.id === activeDocumentId
                                                ? "bg-primary text-white dark:bg-primaryDark"
                                                : "hover:bg-surfaceDark/20 dark:hover:bg-backgroundDark/20 text-text dark:text-textDark"
                                        }`}
                                        onClick={() => onSelect(doc.id)}
                                        onDoubleClick={() => startRenaming(doc.id, doc.title)}
                                        title="Double-click to rename"
                                    >
                                        {doc.title}
                                    </button>
                                    {documents.length > 1 && (
                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                                            title="Delete file"
                                            onClick={e => { e.stopPropagation(); onDelete(doc.id); }}
                                            tabIndex={-1}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-2 border-t border-surface dark:border-surfaceDark">
                <button
                    className="w-full px-4 py-2 rounded bg-accent dark:bg-accentDark text-white font-semibold hover:bg-primary dark:hover:bg-primaryDark transition-colors focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accentDark"
                    onClick={onNewFile}
                >
                    + New File
                </button>
            </div>
        </aside>
    );
}
