import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShoppingBag, ArrowLeft, Send, CheckCircle, Download } from 'lucide-react';
import { formatCustomText } from '../utils/textFormatting';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import { jsPDF } from 'jspdf';

const SharedPackage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        const fetchPackage = async (isFirstLoad = false) => {
            if (isFirstLoad) setLoading(true);
            try {
                const caterings = await api.getCaterings();
                const found = caterings.find(c => c.id === parseInt(id));
                if (found) {
                    setPkg(found);
                    setError(null);
                } else {
                    if (isFirstLoad) setError('Pacchetto non trovato.');
                }
            } catch (err) {
                console.error('Error fetching package:', err);
                if (isFirstLoad) setError('Errore nel caricamento del pacchetto.');
            } finally {
                if (isFirstLoad) setLoading(false);
            }
        };

        fetchPackage(true);
        const interval = setInterval(() => fetchPackage(false), 5000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            <p>Caricamento pacchetto...</p>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2 style={{ color: 'var(--color-primary-dark)' }}>Oops!</h2>
            <p>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>Torna alla Home</button>
        </div>
    );

    const sendToWhatsApp = () => {
        const phoneNumber = "393495416637";
        const url = window.location.href;
        const finalPrice = pkg.discount_percentage > 0 
            ? (pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)
            : parseFloat(pkg.total_price).toFixed(2);
            
        const message = `Ciao Barbara, sono interessato al pacchetto "${pkg.name}" che ho visto sul sito:\n\n${url}\n\nPrezzo: € ${finalPrice}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const finalPrice = pkg.discount_percentage > 0 
        ? (pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)
        : parseFloat(pkg.total_price).toFixed(2);

    const generatePDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const doc = new jsPDF();
            let yPos = 20;

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("Menù", 105, yPos, { align: 'center' });
        
        let logoDataUrl = null;
        let pdfW = 0;
        let pdfH = 0;
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const fontSize = 80;
            ctx.font = `400 ${fontSize}px "Brittany Signature", "Outfit", sans-serif`;
            const textWidth = Math.ceil(ctx.measureText("Muse Catering").width);
            const width = textWidth + 80;
            const height = fontSize * 3;

            canvas.width = width;
            canvas.height = height;

            ctx.font = `400 ${fontSize}px "Brittany Signature", "Outfit", sans-serif`;
            ctx.fillStyle = "rgb(155, 57, 61)";
            ctx.textBaseline = "middle";
            ctx.fillText("Muse Catering", 40, height / 2);

            logoDataUrl = canvas.toDataURL('image/png');
            pdfW = width * (6.8 / fontSize); 
            pdfH = height * (6.8 / fontSize);
        } catch(e) {
            console.error("Error drawing logo canvas", e);
        }
        
        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');

        yPos += 10;

        let globalSubtitle = "";
        const isPkgGlutenFree = pkg.is_gluten_free || (pkg.items.length > 0 && pkg.items.every(item => item.is_gluten_free));
        const isPkgLactoseFree = pkg.is_lactose_free || (pkg.items.length > 0 && pkg.items.every(item => item.is_lactose_free));

        if (isPkgGlutenFree && isPkgLactoseFree) {
            globalSubtitle = "Menù gluten free e senza lattosio";
        } else if (isPkgGlutenFree) {
            globalSubtitle = "Menù gluten free";
        } else if (isPkgLactoseFree) {
            globalSubtitle = "Menù senza lattosio";
        }

        if (globalSubtitle) {
            doc.setFontSize(14);
            doc.setTextColor(100);
            doc.text(globalSubtitle, 105, yPos, { align: 'center' });
            yPos += 15;
            doc.setTextColor(0);
        } else {
            yPos += 10;
        }

        for (let i = 0; i < pkg.items.length; i++) {
            const item = pkg.items[i];
            
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            let imageHeight = 40;
            let currentY = yPos;

            if (item.image_url) {
                try {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = item.image_url;
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve; 
                    });
                    
                    if (img.width > 0 && img.height > 0) {
                        const size = Math.min(img.width, img.height);
                        const sx = (img.width - size) / 2;
                        const sy = (img.height - size) / 2;

                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        
                        const radius = size * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(radius, 0);
                        ctx.lineTo(size - radius, 0);
                        ctx.quadraticCurveTo(size, 0, size, radius);
                        ctx.lineTo(size, size - radius);
                        ctx.quadraticCurveTo(size, size, size - radius, size);
                        ctx.lineTo(radius, size);
                        ctx.quadraticCurveTo(0, size, 0, size - radius);
                        ctx.lineTo(0, radius);
                        ctx.quadraticCurveTo(0, 0, radius, 0);
                        ctx.closePath();
                        ctx.clip();

                        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
                        const dataUrl = canvas.toDataURL('image/png');
                        
                        doc.addImage(dataUrl, 'PNG', 15, currentY, 40, 40);
                    }
                } catch (e) {
                    console.error("Error drawing image in PDF", e);
                }
            }

            let xText = item.image_url ? 60 : 15;
            let textY = currentY + 5;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            
            const nameQty = item.name || '';
            doc.text(nameQty, xText, textY);
            textY += 6;

            let labels = [];
            if (item.is_gluten_free && !isPkgGlutenFree) labels.push("Gluten Free");
            if (item.is_lactose_free && !isPkgLactoseFree) labels.push("Senza Lattosio");
            
            if (labels.length > 0) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(255, 152, 0);
                doc.text(labels.join(" - "), xText, textY);
                textY += 6;
            }

            if (item.description) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80);
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.description;
                let textDesc = tempDiv.textContent || tempDiv.innerText || "";
                
                const lines = doc.splitTextToSize(textDesc, 200 - xText - 15);
                doc.text(lines, xText, textY);
                textY += (lines.length * 5) + 5;
            }
            
            yPos = Math.max(textY, currentY + imageHeight + 10);
            doc.setTextColor(0);
        }

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.getHeight();
            if (logoDataUrl) {
                doc.addImage(logoDataUrl, 'PNG', 195 - pdfW, pageHeight - pdfH - 10, pdfW, pdfH);
            } else {
                doc.setFontSize(9);
                doc.setFont('times', 'italic');
                doc.setTextColor(155, 57, 61);
                doc.text("Muse Catering", 195, pageHeight - 15, { align: 'right' });
                doc.setTextColor(0);
            }
        }

        doc.save(`Menu_Pacchetto.pdf`);
        } catch (error) {
            console.error("Generazione PDF fallita", error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem 1rem', position: 'relative' }}>
            <h1 className="brand-logo" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '1.4rem', margin: 0, zIndex: 10 }}>Muse Catering</h1>
            <button 
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: '2rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
                <ArrowLeft size={20} /> Torna ai pacchetti
            </button>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
                {pkg.image_url && (
                    <div style={{ width: '100%', height: '300px', overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
                        <img src={pkg.image_url} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
                
                <div style={{ padding: '2.5rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
                            {pkg.name}
                            <span style={{ marginLeft: '1rem', display: 'inline-flex', gap: '0.5rem', verticalAlign: 'middle' }}>
                                {pkg.is_gluten_free && (
                                    <span style={{ color: '#FF9800', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                        Senza Glutine
                                    </span>
                                )}
                                {pkg.is_lactose_free && (
                                    <span style={{ color: '#03A9F4', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                        Senza Lattosio
                                    </span>
                                )}
                            </span>
                        </h1>
                        <p 
                            style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}
                            dangerouslySetInnerHTML={{ __html: formatCustomText(pkg.description) }}
                        />
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingBag size={20} /> Cosa include questo pacchetto
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-responsive">
                            {pkg.items.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setSelectedProduct(item)}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.75rem', 
                                        padding: '0.75rem', 
                                        backgroundColor: 'rgba(255,255,255,0.5)', 
                                        borderRadius: '12px', 
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)';
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <CheckCircle size={18} color="var(--color-primary)" />
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>{item.name}</p>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {item.is_gluten_free && !pkg.is_gluten_free && (
                                                    <span style={{ color: '#FF9800', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Senza Glutine
                                                    </span>
                                                )}
                                                {item.is_lactose_free && !pkg.is_lactose_free && (
                                                    <span style={{ color: '#03A9F4', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Senza Lattosio
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                            {!item.hide_quantity && (
                                                <span style={{ marginRight: '0.4rem' }}>
                                                    {parseFloat(item.quantity)} {item.is_sold_by_piece ? 'pz' : 'kg'}
                                                </span>
                                            )}
                                            <span>
                                                {item.hide_quantity ? '' : '('}
                                                {!item.hide_unit_price ? (
                                                    <>€ {(Number(item.is_sold_by_piece ? item.price_per_piece : item.price_per_kg) || 0).toFixed(2)} /{item.is_sold_by_piece ? 'pz' : 'kg'}</>
                                                ) : null}
                                                {item.hide_quantity ? '' : ')'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ... rest of the content ... */}
                    <button 
                        className="btn btn-outline" 
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}
                        onClick={generatePDF}
                        disabled={isGeneratingPdf}
                    >
                        {isGeneratingPdf ? (
                            <>
                                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                Generazione in corso...
                            </>
                        ) : (
                            <>
                                <Download size={20} /> Scarica il menù
                            </>
                        )}
                    </button>

                    <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', display: 'block' }}>Prezzo del pacchetto</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>€ {finalPrice}</span>
                                    {pkg.discount_percentage > 0 && (
                                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>€ {pkg.total_price}</span>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                className="btn btn-primary" 
                                style={{ padding: '1.2rem 2.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                                onClick={sendToWhatsApp}
                            >
                                <Send size={22} /> Prenota ora
                            </button>
                        </div>

                        <div style={{ backgroundColor: '#fff9f9', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffecec', textAlign: 'center', fontSize: '0.9rem' }}>
                            <p style={{ margin: 0 }}>Il prezzo indicato è bloccato per i prodotti elencati. Eventuali modifiche o aggiunte verranno calcolate separatamente.</p>
                        </div>
                    </div>
                </div>
            </div>

            {selectedProduct && (
                <ProductDetailsModal 
                    product={selectedProduct} 
                    onClose={() => {
                        setIsClosing(true);
                        setTimeout(() => {
                            setSelectedProduct(null);
                            setIsClosing(false);
                        }, 300);
                    }}
                    isClosing={isClosing}
                />
            )}
        </div>
    );
};

export default SharedPackage;
