import React, { createContext, useContext } from 'react';
import useInstallPrompt from '../hooks/useInstallPrompt';

const InstallPromptContext = createContext();

export const InstallPromptProvider = ({ children }) => {
    const installPrompt = useInstallPrompt();

    return (
        <InstallPromptContext.Provider value={installPrompt}>
            {children}
        </InstallPromptContext.Provider>
    );
};

export const useInstallPromptContext = () => {
    const context = useContext(InstallPromptContext);
    if (!context) {
        throw new Error('useInstallPromptContext must be used within an InstallPromptProvider');
    }
    return context;
};
