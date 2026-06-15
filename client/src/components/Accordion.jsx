import React, { createContext, useContext, useState } from "react";

const AccordionContext = createContext(undefined);

const useAccordion = () => {
    const context = useContext(AccordionContext);
    if (!context) {
        throw new Error("Accordion components must be used within an Accordion");
    }
    return context;
};

export const Accordion = ({
    children,
    defaultOpen,
    allowMultiple = false,
    className = "",
}) => {
    const [activeItems, setActiveItems] = useState(
        defaultOpen ? [defaultOpen] : []
    );

    const toggleItem = (id) => {
        setActiveItems((prev) => {
            if (allowMultiple) {
                return prev.includes(id)
                    ? prev.filter((item) => item !== id)
                    : [...prev, id];
            } else {
                return prev.includes(id) ? [] : [id];
            }
        });
    };

    const isItemActive = (id) => activeItems.includes(id);

    return (
        <AccordionContext.Provider value={{ activeItems, toggleItem, isItemActive }}>
            <div className={`space-y-4 ${className}`}>{children}</div>
        </AccordionContext.Provider>
    );
};

export const AccordionItem = ({
    id,
    children,
    className = "",
}) => {
    const { isItemActive } = useAccordion();
    const isActive = isItemActive(id);

    return (
        <div className={`overflow-hidden border border-slate-100 rounded-xl bg-white transition-all shadow-sm ${
            isActive ? 'ring-1 ring-brand-orange/20' : ''
        } ${className}`}>
            {children}
        </div>
    );
};

export const AccordionHeader = ({
    itemId,
    children,
    className = "",
    iconPosition = "right",
}) => {
    const { toggleItem, isItemActive } = useAccordion();
    const isActive = isItemActive(itemId);

    const defaultIcon = (
        <svg
            className={`w-5 h-5 transition-transform duration-300 text-slate-400 ${
                isActive ? "rotate-180 text-brand-orange" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
            />
        </svg>
    );

    return (
        <button
            onClick={() => toggleItem(itemId)}
            className={`w-full px-5 py-4 text-left focus:outline-none flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors ${className}`}
        >
            <div className="flex items-center space-x-3 w-full">
                <div className="flex-1">{children}</div>
            </div>
            {iconPosition === "right" && defaultIcon}
        </button>
    );
};

export const AccordionContent = ({
    itemId,
    children,
    className = "",
}) => {
    const { isItemActive } = useAccordion();
    const isActive = isItemActive(itemId);

    return (
        <div
            className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-slate-50 ${
                isActive ? "max-h-[5000px] opacity-100 bg-slate-50/20" : "max-h-0 opacity-0 pointer-events-none"
            } ${className}`}
        >
            <div className="px-5 py-5">{children}</div>
        </div>
    );
};
