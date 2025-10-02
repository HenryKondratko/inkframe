import React from "react";

export type Document = {
    id: string;
    title: string;
};

interface SidebarProps {
    documents: Document[];
    activeDocumentId: string;
    onSelect: (id: string) => void;
    onNewFile: () => void;
}

export default function Sidebar({ documents, activeDocumentId, onSelect, onNewFile }: SidebarProps) {
    return (
        <aside className="flex flex-col h-full w-56 bg-surface dark:bg-surfaceDark border-r border-surface dark:border-surfaceDark">
            <div className="flex-1 overflow-y-auto">
                <ul className="py-2">
                    {documents.map((doc) => (
                        <li key={doc.id}>
                            <button
                                className={`w-full text-left px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accentDark ${
                                    doc.id === activeDocumentId
                                        ? "bg-primary text-white dark:bg-primaryDark"
                                        : "hover:bg-surfaceDark/20 dark:hover:bg-backgroundDark/20 text-text dark:text-textDark"
                                }`}
                                onClick={() => onSelect(doc.id)}
                            >
                                {doc.title}
                            </button>
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

