import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface FontContextProps {
    fontFamily: string;
    setFontFamily: (font: string) => void;
    fontSize: string;
    setFontSize: (size: string) => void;
}

const FontContext = createContext<FontContextProps | undefined>(undefined);

export const FontProvider = ({ children }: { children: ReactNode }) => {
    const [fontFamily, setFontFamilyState] = useState<string>('inter');
    const [fontSize, setFontSizeState] = useState<string>('1');

    // Load saved preferences on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedFont = localStorage.getItem('fontFamily');
            const savedSize = localStorage.getItem('fontSize');
            if (savedFont) {
                setFontFamilyState(savedFont);
                document.documentElement.dataset.font = savedFont;
            } else {
                document.documentElement.dataset.font = 'inter';
            }
            if (savedSize) {
                setFontSizeState(savedSize);
                document.documentElement.style.setProperty('--font-scale', savedSize);
            } else {
                document.documentElement.style.setProperty('--font-scale', '1');
            }
        }
    }, []);

    const setFontFamily = (newFont: string) => {
        setFontFamilyState(newFont);
        if (typeof window !== 'undefined') {
            localStorage.setItem('fontFamily', newFont);
        }
        document.documentElement.dataset.font = newFont;
    };

    const setFontSize = (newSize: string) => {
        setFontSizeState(newSize);
        if (typeof window !== 'undefined') {
            localStorage.setItem('fontSize', newSize);
        }
        document.documentElement.style.setProperty('--font-scale', newSize);
    };

    return (
        <FontContext.Provider value={{ fontFamily, setFontFamily, fontSize, setFontSize }}>
            {children}
        </FontContext.Provider>
    );
};

export const useFont = () => {
    const context = useContext(FontContext);
    if (!context) {
        throw new Error('useFont must be used within a FontProvider');
    }
    return context;
};
