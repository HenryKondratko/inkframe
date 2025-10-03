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
    onDownload?: (id: string) => void;
    onReorder?: (newOrder: Document[]) => void; // New prop for reordering
}

export default function Sidebar({ documents, activeDocumentId, onSelect, onNewFile, onRename, onDelete, onDownload, onReorder, open = true, setOpen }: SidebarProps & { open?: boolean, setOpen?: (open: boolean) => void }) {
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");

    // Drag and drop state
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);

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

    function handleDragStart(id: string) {
        setDraggedId(id);
    }
    function handleDragOver(id: string, e: React.DragEvent) {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        const position = offset < rect.height / 2 ? 'above' : 'below';
        setDragOverId(id);
        setDragOverPosition(position);
    }
    function handleDrop(id: string) {
        if (!draggedId || draggedId === id) return;
        const fromIdx = documents.findIndex(d => d.id === draggedId);
        const toIdx = documents.findIndex(d => d.id === id);
        if (fromIdx === -1 || toIdx === -1) return;
        const newDocs = [...documents];
        const [moved] = newDocs.splice(fromIdx, 1);
        if (!moved) return;
        let insertIdx = toIdx;
        if (dragOverPosition === 'below') {
            insertIdx = toIdx + (fromIdx < toIdx ? 0 : 1);
        } else {
            insertIdx = toIdx + (fromIdx < toIdx ? -1 : 0);
        }
        if (insertIdx < 0) insertIdx = 0;
        if (insertIdx > newDocs.length) insertIdx = newDocs.length;
        newDocs.splice(insertIdx, 0, moved);
        setDraggedId(null);
        setDragOverId(null);
        setDragOverPosition(null);
        if (onReorder) onReorder(newDocs);
    }
    function handleDragEnd() {
        setDraggedId(null);
        setDragOverId(null);
        setDragOverPosition(null);
    }

    return (
        <aside className={`flex flex-col h-full transition-all duration-200 ease-in-out ${open ? 'w-56' : 'w-12'} bg-surface dark:bg-surfaceDark border-r border-gray-200 dark:border-surfaceDark shadow-sm`}>
            {/* Collapse/Expand Toggle */}
            <div className="flex items-center h-12 px-2 border-b border-gray-100 dark:border-surfaceDark">
                <button
                  style={{ width: 32, height: 32, background: 'none', border: 'none', padding: 0 }}
                  aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
                  title={open ? 'Collapse sidebar' : 'Expand sidebar'}
                  onClick={() => setOpen && setOpen(!open)}
                >
                  <svg width="24" height="24" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
            </div>
            {/* File list and new file button only if open */}
            {open && <>
                <div className="flex-1 overflow-y-auto">
                    <ul className="py-2">
                        {documents.map((doc, idx) => (
                            <li key={doc.id} className={`group relative flex items-center`}
                                draggable
                                onDragStart={() => handleDragStart(doc.id)}
                                onDragOver={e => handleDragOver(doc.id, e)}
                                onDrop={() => handleDrop(doc.id)}
                                onDragEnd={handleDragEnd}
                            >
                                {/* Visual indicator for drop position */}
                                {dragOverId === doc.id && dragOverPosition === 'above' && (
                                    <div className="absolute left-0 right-0 top-0 h-1 pointer-events-none">
                                        <div className="h-1 bg-blue-500 rounded-t" style={{boxShadow: '0 0 2px #3b82f6'}} />
                                    </div>
                                )}
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
                                            className={`w-full text-left px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accentDark
                                                ${doc.id === activeDocumentId
                                                    ? "bg-primary text-white dark:bg-primaryDark"
                                                    : "bg-transparent hover:bg-gray-100 dark:hover:bg-backgroundDark/20 text-text dark:text-textDark"}
                                            `}
                                            onClick={() => onSelect(doc.id)}
                                            onDoubleClick={() => startRenaming(doc.id, doc.title)}
                                            title="Double-click to rename"
                                        >
                                            {doc.title}
                                        </button>
                                        {documents.length > 1 && (
                                            <button
                                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 ml-3"
                                                title="Delete file"
                                                onClick={e => { e.stopPropagation(); onDelete(doc.id); }}
                                                tabIndex={-1}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                        {/* Download button, always shown on hover */}
                                        <button
                                            className="absolute right-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 mr-1"
                                            title="Download file"
                                            onClick={e => { e.stopPropagation(); onDownload && onDownload(doc.id); }}
                                            tabIndex={-1}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9m0 0l3-3m-3 3l-3-3m9 9H3" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                                {/* Visual indicator for drop position below */}
                                {dragOverId === doc.id && dragOverPosition === 'below' && (
                                    <div className="absolute left-0 right-0 bottom-0 h-1 pointer-events-none">
                                        <div className="h-1 bg-blue-500 rounded-b" style={{boxShadow: '0 0 2px #3b82f6'}} />
                                    </div>
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
            </>}
        </aside>
    );
}
