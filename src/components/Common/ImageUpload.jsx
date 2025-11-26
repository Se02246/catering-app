import React, { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

const ImageUpload = ({ onUpload, images = [] }) => {
    const cloudinaryRef = useRef();
    const widgetRef = useRef();
    const [draggedIndex, setDraggedIndex] = useState(null);

    // Ensure images is always an array
    const imageList = Array.isArray(images) ? images : (images ? [images] : []);

    const onUploadRef = useRef(onUpload);
    const imagesRef = useRef(images);

    // Update refs whenever props change
    useEffect(() => {
        onUploadRef.current = onUpload;
        imagesRef.current = images;
    }, [onUpload, images]);

    useEffect(() => {
        cloudinaryRef.current = window.cloudinary;
        widgetRef.current = cloudinaryRef.current.createUploadWidget({
            cloudName: 'dmdsiwrbo',
            uploadPreset: 'web_app',
            multiple: true, // Enable multiple uploads
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

                // Add new image to the list using the ref
                const currentImages = Array.isArray(imagesRef.current) ? imagesRef.current : (imagesRef.current ? [imagesRef.current] : []);
                onUploadRef.current([...currentImages, optimizedUrl]);
            }
        });
    }, []); // Empty dependency array: initialize only once

    const handleRemove = (indexToRemove) => {
        const newImages = imageList.filter((_, index) => index !== indexToRemove);
        onUpload(newImages);
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedIndex === index) return;

        // Reorder list while dragging
        const newImages = [...imageList];
        const draggedItem = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedItem);

        onUpload(newImages);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // Touch Handlers for Mobile
    const handleTouchStart = (e, index) => {
        // Prevent default to stop scrolling/context menu while dragging
        // e.preventDefault(); // We might not want to prevent default immediately to allow scrolling if not holding long enough, but for reordering usually we do.
        // Let's rely on long press or just immediate drag. Immediate drag is easier to implement first.
        setDraggedIndex(index);
    };

    const handleTouchMove = (e) => {
        if (draggedIndex === null) return;
        e.preventDefault(); // Stop scrolling

        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (!target) return;

        const dropZone = target.closest('[data-index]');
        if (!dropZone) return;

        const targetIndex = parseInt(dropZone.getAttribute('data-index'));

        if (targetIndex !== draggedIndex && !isNaN(targetIndex)) {
            const newImages = [...imageList];
            const draggedItem = newImages[draggedIndex];
            newImages.splice(draggedIndex, 1);
            newImages.splice(targetIndex, 0, draggedItem);

            onUpload(newImages);
            setDraggedIndex(targetIndex);
        }
    };

    const handleTouchEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => widgetRef.current.open()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Upload size={18} />
                    Carica Immagini
                </button>
            </div>

            {imageList.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {imageList.map((img, index) => (
                        <div
                            key={index}
                            data-index={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onTouchStart={(e) => handleTouchStart(e, index)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onContextMenu={(e) => {
                                // Prevent context menu only if we are interacting with it for reordering
                                // For now, prevent it always on the image container to avoid popup
                                e.preventDefault();
                            }}
                            style={{
                                position: 'relative',
                                width: '100px',
                                height: '100px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: index === 0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                cursor: 'grab',
                                opacity: draggedIndex === index ? 0.5 : 1,
                                transition: 'transform 0.2s'
                            }}
                            title={index === 0 ? "Immagine di Copertina" : "Trascina per riordinare"}
                        >
                            <img
                                src={img}
                                alt={`Uploaded ${index}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />

                            {/* Remove Button - Top Right, Small */}
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'red',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}
                                title="Rimuovi"
                            >
                                <X size={12} />
                            </button>

                            {index === 0 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    textAlign: 'center',
                                    padding: '2px'
                                }}>
                                    COPERTINA
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
