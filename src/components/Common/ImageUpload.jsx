import React, { useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';

const ImageUpload = ({ onUpload, currentImage }) => {
    const cloudinaryRef = useRef();
    const widgetRef = useRef();

    useEffect(() => {
        cloudinaryRef.current = window.cloudinary;
        widgetRef.current = cloudinaryRef.current.createUploadWidget({
            cloudName: 'dmdsiwrbo',
            uploadPreset: 'web_app',
            multiple: false,
            sources: ['local', 'url', 'camera'],
            defaultSource: 'local',
            styles: {
                palette: {
                    window: "#FFFFFF",
                    windowBorder: "#90A0B3",
                    tabIcon: "#AF4448",
                    menuIcons: "#5A616A",
                    textDark: "#000000",
                    textLight: "#FFFFFF",
                    link: "#AF4448",
                    action: "#FF620C",
                    inactiveTabIcon: "#0E2F5A",
                    error: "#F44235",
                    inProgress: "#0078FF",
                    complete: "#20B832",
                    sourceBg: "#E4EBF1"
                }
            }
        }, function (error, result) {
            if (!error && result && result.event === "success") {
                console.log('Done! Here is the image info: ', result.info);
                // Use secure_url and add optimization params
                const optimizedUrl = result.info.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
                onUpload(optimizedUrl);
            }
        });
    }, [onUpload]);

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => widgetRef.current.open()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Upload size={18} />
                    Carica Immagine
                </button>
                {currentImage && (
                    <div style={{ position: 'relative' }}>
                        <img
                            src={currentImage}
                            alt="Preview"
                            style={{ height: '50px', width: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                    </div>
                )}
            </div>
            {currentImage && (
                <div style={{ marginTop: '0.5rem' }}>
                    <input
                        type="text"
                        value={currentImage}
                        readOnly
                        style={{ width: '100%', fontSize: '0.8rem', color: '#666', border: 'none', background: 'transparent' }}
                    />
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
