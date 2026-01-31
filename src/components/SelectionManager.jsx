import { useEffect, useState } from 'react';
import './SelectionManager.css';

/**
 * SelectionManager - Native eBook/PDF Reader-style text selection
 * Provides persistent selection with floating toolbar
 */
const SelectionManager = ({
    targetSelector = '.nnote',
    onCopy,
    onExplain,
    onDiscuss
}) => {
    const [selection, setSelection] = useState({
        text: '',
        range: null,
        rect: null,
        isActive: false
    });

    useEffect(() => {
        // Capture selection when user releases mouse/finger
        const captureSelection = () => {
            setTimeout(() => {
                const sel = window.getSelection();

                if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.toString().trim()) {
                    return;
                }

                const range = sel.getRangeAt(0);
                const container = range.commonAncestorContainer;
                const targetElement = container.nodeType === 3
                    ? container.parentElement?.closest(targetSelector)
                    : container.closest?.(targetSelector);

                if (!targetElement) {
                    return;
                }

                const text = sel.toString().trim();
                const rect = range.getBoundingClientRect();

                setSelection({
                    text,
                    range: range.cloneRange(),
                    rect: {
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width,
                        height: rect.height
                    },
                    isActive: true
                });
            }, 100);
        };

        // Clear selection when clicking outside
        const handleOutsideClick = (e) => {
            if (e.target.closest('[data-selection-toolbar]')) {
                return;
            }

            const isTargetClick = e.target.closest(targetSelector);
            if (!isTargetClick && selection.isActive) {
                setSelection({ text: '', range: null, rect: null, isActive: false });
                window.getSelection().removeAllRanges();
            }
        };

        // Block native context menu in target area
        const preventContextMenu = (e) => {
            if (e.target.closest(targetSelector)) {
                e.preventDefault();
            }
        };

        document.addEventListener('mouseup', captureSelection);
        document.addEventListener('touchend', captureSelection, { passive: true });
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('contextmenu', preventContextMenu);

        return () => {
            document.removeEventListener('mouseup', captureSelection);
            document.removeEventListener('touchend', captureSelection);
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('contextmenu', preventContextMenu);
        };
    }, [selection.isActive, targetSelector]);

    // Handle copy action
    const handleCopy = () => {
        if (selection.text) {
            navigator.clipboard.writeText(selection.text).catch(() => {
                // Fallback
                const textArea = document.createElement('textarea');
                textArea.value = selection.text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            });

            onCopy?.(selection.text);
        }
    };

    // Handle explain action
    const handleExplain = () => {
        if (selection.text) {
            onExplain?.(selection.text);
        }
    };

    // Handle discuss action
    const handleDiscuss = () => {
        if (selection.text) {
            onDiscuss?.(selection.text);
        }
    };

    if (!selection.isActive) {
        return null;
    }

    const isMobile = window.innerWidth < 768;
    const toolbarTop = selection.rect.top - (isMobile ? 70 : 60);
    const toolbarLeft = selection.rect.left + (selection.rect.width / 2);

    return (
        <div
            className="selection-toolbar"
            data-selection-toolbar
            style={{
                position: 'absolute',
                top: `${toolbarTop}px`,
                left: `${toolbarLeft}px`,
                transform: 'translateX(-50%)',
                zIndex: 99999
            }}
        >
            <button
                className="selection-btn selection-btn-copy"
                onClick={handleCopy}
                title="Copy"
            >
                📋 Copy
            </button>
            <button
                className="selection-btn selection-btn-explain"
                onClick={handleExplain}
                title="Explain"
            >
                💡 Explain
            </button>
            <button
                className="selection-btn selection-btn-discuss"
                onClick={handleDiscuss}
                title="Discuss"
            >
                💬 Discuss
            </button>
        </div>
    );
};

export default SelectionManager;
