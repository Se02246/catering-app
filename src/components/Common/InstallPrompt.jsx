import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 9999,
            width: '90%',
            maxWidth: '400px',
            justifyContent: 'space-between',
            animation: 'slideUp 0.5s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={20} />
                <span style={{ fontWeight: '600' }}>Installa l'App</span>
            </div>
            <button
                onClick={handleInstallClick}
                style={{
                    backgroundColor: 'white',
                    color: 'var(--color-primary)',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                Installa
            </button>
            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default InstallPrompt;
