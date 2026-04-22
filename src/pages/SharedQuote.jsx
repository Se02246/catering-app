import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShoppingBag, Calendar, ArrowLeft, Send, Copy, Check, Download, Eye, QrCode } from 'lucide-react';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const SharedQuote = ({ isMenuMode = false }) => {
    const { id, menuId } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isGeneratingQr, setIsGeneratingQr] = useState(false);

    const handleCopyToClipboard = () => {
        let text = `Riepilogo preventivo\n`;
        text += `ID preventivo: ${id}\n`;
        text += `Creato il ${new Date(quote?.created_at).toLocaleDateString('it-IT')}\n\n`;
        text += `Prodotti:\n`;
        if (quote && quote.items) {
            quote.items.forEach(item => {
                const qty = !item.hide_quantity ? `${parseFloat(item.quantity)} ${item.is_sold_by_piece ? 'pz' : 'kg'}` : "";
                text += `- ${item.name}${qty ? ` (${qty})` : ''}\n`;
            });
        }
        text += `\nLink della pagina share: ${window.location.href}`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => console.error('Errore durante la copia:', err));
    };

    useEffect(() => {
        const fetchQuote = async (isFirstLoad = false) => {
            if (isFirstLoad) setLoading(true);
            try {
                const data = menuId ? await api.getQuoteByMenuId(menuId) : await api.getQuote(id);
                setQuote(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching quote:', err);
                if (isFirstLoad) setError('Preventivo non trovato o scaduto.');
            } finally {
                if (isFirstLoad) setLoading(false);
            }
        };

        fetchQuote(true);
        const interval = setInterval(() => fetchQuote(false), 5000);
        return () => clearInterval(interval);
    }, [id, menuId]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            <p>Caricamento preventivo...</p>
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
        const message = `Ciao Barbara, ho visualizzato questo preventivo sul tuo sito e vorrei maggiori informazioni:\n\n${url}\n\nTotale: € ${quote.total_price}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const isQuoteGlutenFree = quote.is_gluten_free || (quote.items.length > 0 && quote.items.every(item => item.is_gluten_free));
    const isQuoteLactoseFree = quote.is_lactose_free || (quote.items.length > 0 && quote.items.every(item => item.is_lactose_free));

    const suggestedTotal = quote.items.reduce((sum, item) => {
        const price = item.is_sold_by_piece 
            ? item.price_per_piece 
            : item.price_per_kg;
        return sum + (price * item.quantity);
    }, 0);

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
            pdfW = width * (4.5 / fontSize); 
            pdfH = height * (4.5 / fontSize);
        } catch(e) {
            console.error("Error drawing logo canvas", e);
        }
        
        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');

        yPos += 10;

        let globalSubtitle = "";
        if (isQuoteGlutenFree && isQuoteLactoseFree) {
            globalSubtitle = "Menù gluten free e senza lattosio";
        } else if (isQuoteGlutenFree) {
            globalSubtitle = "Menù gluten free";
        } else if (isQuoteLactoseFree) {
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

        for (let i = 0; i < quote.items.length; i++) {
            const item = quote.items[i];
            
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
                        
                        const radius = size * 0.15; // 15% corner radius for smooth rounded corners
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
            if (item.is_gluten_free && !isQuoteGlutenFree) labels.push("Gluten Free");
            if (item.is_lactose_free && !isQuoteLactoseFree) labels.push("Senza Lattosio");
            
            if (labels.length > 0) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(255, 152, 0); // using an orange tone for labels or general dark text
                doc.text(labels.join(" - "), xText, textY);
                textY += 6;
            }

            if (item.menu_description || item.description) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80);
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.menu_description || item.description;
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
                doc.addImage(logoDataUrl, 'PNG', 195 - pdfW, 10, pdfW, pdfH);
            } else {
                doc.setFontSize(9);
                doc.setFont('times', 'italic');
                doc.setTextColor(155, 57, 61);
                doc.text("Muse Catering", 195, 15, { align: 'right' });
                doc.setTextColor(0);
            }
        }

        doc.save(`Menu_Preventivo.pdf`);
        } catch (error) {
            console.error("Generazione PDF fallita", error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const generateQRCodePDF = async () => {
        setIsGeneratingQr(true);
        try {
            const menuUrl = `${window.location.origin}/menu/${quote.menu_id}`;
            const qrDataUrl = await QRCode.toDataURL(menuUrl, { width: 800, margin: 2, color: { dark: '#111111', light: '#ffffff' } });
            
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            doc.setFillColor(252, 250, 245);
            doc.rect(0, 0, 210, 297, 'F');
            
            let logoDataUrl = null;
            let pdfW = 0;
            let pdfH = 0;
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const fontSize = 100;
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
                pdfW = width * (14 / fontSize); 
                pdfH = height * (14 / fontSize);
            } catch(e) {
                console.error("Error drawing logo canvas", e);
            }

            if (logoDataUrl) {
                doc.addImage(logoDataUrl, 'PNG', 105 - (pdfW / 2), 25, pdfW, pdfH);
            } else {
                doc.setFont('times', 'bold');
                doc.setFontSize(28);
                doc.setTextColor(155, 57, 61);
                doc.text('MUSE CATERING', 105, 50, { align: 'center' });
            }
            
            doc.setFont('times', 'italic');
            doc.setFontSize(16);
            doc.setTextColor(80, 80, 80);
            doc.text('Scansiona il codice per visualizzare il menù digitale', 105, 85, { align: 'center' });
            doc.text('e avere maggiori dettagli sui prodotti', 105, 95, { align: 'center' });
            
            doc.addImage(qrDataUrl, 'PNG', 55, 115, 100, 100);

            doc.save(`QR_Menu_${id.substring(0,8).toUpperCase()}.pdf`);
        } catch (err) {
            console.error('Error generating QR Code PDF', err);
        } finally {
            setIsGeneratingQr(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem 1rem', position: 'relative' }}>
            <h1 className="brand-logo" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '1.4rem', margin: 0, zIndex: 10 }}>Muse Catering</h1>
            <button 
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: '2rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
                <ArrowLeft size={20} /> Torna al sito
            </button>

            <div className="glass-panel" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '5px', background: 'var(--color-primary)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h1 style={{ color: 'var(--color-primary-dark)', margin: 0 }}>{isMenuMode ? 'Menù' : 'Riepilogo Preventivo'}</h1>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isQuoteGlutenFree && (
                                    <span style={{ color: '#FF9800', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                        Senza Glutine
                                    </span>
                                )}
                                {isQuoteLactoseFree && (
                                    <span style={{ color: '#03A9F4', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                        Senza Lattosio
                                    </span>
                                )}
                            </div>
                        </div>
                        {!isMenuMode && (
                            <p style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} /> Creato il {new Date(quote.created_at).toLocaleDateString('it-IT')}
                            </p>
                        )}
                    </div>
                    {!isMenuMode && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                            <div 
                                style={{ textAlign: 'right', cursor: 'pointer' }} 
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    if (token) {
                                        navigate(`/admin?tab=quotes&searchId=${id}`);
                                    } else {
                                        navigate(`/login?redirect=/admin?tab=quotes&searchId=${id}`);
                                    }
                                }}
                                title="Gestisci questo preventivo (Amministratore)"
                            >
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>ID Preventivo</p>
                                <p style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'underline' }}>{id.substring(0, 8).toUpperCase()}</p>
                            </div>
                            <button
                                onClick={handleCopyToClipboard}
                                title="Copia preventivo come testo"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: copied ? '#4CAF50' : 'var(--color-primary)',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '8px',
                                    backgroundColor: copied ? 'rgba(76, 175, 80, 0.1)' : 'rgba(175, 68, 72, 0.05)'
                                }}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingBag size={20} /> Prodotti Selezionati
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {quote.items.map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedProduct(item)}
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '1rem', 
                                    backgroundColor: 'rgba(255,255,255,0.5)', 
                                    borderRadius: '12px', 
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    ':hover': {
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }
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
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {item.image_url && (
                                        <img src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                                    )}
                                    <div>
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>
                                            {item.name}
                                            <span style={{ marginLeft: '0.5rem', display: 'inline-flex', gap: '0.25rem' }}>
                                                {item.is_gluten_free && !quote.is_gluten_free && (
                                                    <span style={{ color: '#FF9800', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        Senza Glutine
                                                    </span>
                                                )}
                                                {item.is_lactose_free && !quote.is_lactose_free && (
                                                    <span style={{ color: '#03A9F4', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        Senza Lattosio
                                                    </span>
                                                )}
                                            </span>
                                        </p>
                                        {!isMenuMode && (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
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
                                                {item.show_servings && item.servings_per_unit && !item.hide_quantity && (
                                                    <span style={{ color: 'var(--color-primary)', marginLeft: '0.5rem' }}>
                                                        ({(Number(item.servings_per_unit) * Number(item.quantity)).toFixed(0)} persone)
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {!isMenuMode && (
                                    <p style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                        € {(Number(item.is_sold_by_piece ? item.price_per_piece : item.price_per_kg) * (Number(item.quantity) || 0)).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    {!isMenuMode && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Totale Preventivo</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>(prezzo indicativo)</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {suggestedTotal > parseFloat(quote.total_price) && (
                                    <span style={{ 
                                        fontSize: '1.2rem', 
                                        color: 'var(--color-text-muted)', 
                                        textDecoration: 'line-through',
                                        marginRight: '0.75rem',
                                        fontWeight: '500'
                                    }}>
                                        € {suggestedTotal.toFixed(2)}
                                    </span>
                                )}
                                <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
                                    € {parseFloat(quote.total_price).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    {!isMenuMode && (
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', marginBottom: '1rem', fontSize: '1.1rem' }}
                            onClick={() => window.open(`/menu/${quote.menu_id}`, '_blank')}
                        >
                            <Eye size={20} /> Visualizza menù digitale
                        </button>
                    )}

                    {!isMenuMode && (
                        <button 
                            className="btn btn-outline" 
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', marginBottom: '1rem', fontSize: '1.1rem', backgroundColor: 'white', color: 'var(--color-primary-dark)', borderColor: 'var(--color-primary-dark)' }}
                            onClick={generateQRCodePDF}
                            disabled={isGeneratingQr}
                        >
                            {isGeneratingQr ? (
                                <>
                                    <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                    Generazione in corso...
                                </>
                            ) : (
                                <>
                                    <QrCode size={20} /> QR Code Menù
                                </>
                            )}
                        </button>
                    )}

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

                    {!isMenuMode && (
                        <div style={{ backgroundColor: 'rgba(175, 68, 72, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px dashed var(--color-primary)', marginBottom: '2rem', textAlign: 'center' }}>
                            <p style={{ marginBottom: '1rem', fontWeight: '500' }}>Ti piace questo preventivo? Contattaci per confermare la disponibilità!</p>
                            <button 
                                className="btn btn-primary" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}
                                onClick={sendToWhatsApp}
                            >
                                <Send size={20} /> Richiedi Informazioni su WhatsApp
                            </button>
                        </div>
                    )}

                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        Muse Catering - Qualità e Passione per i tuoi eventi
                    </p>
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

export default SharedQuote;
