import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendReviewNotification = async (review, frontendUrl) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping review notification.');
            return;
        }

        const adminUrl = `${frontendUrl}/admin?tab=reviews`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ['sebastianomereu02@gmail.com', 'barbaralaisebaemari@gmail.com'],
            subject: 'Nuova Recensione Ricevuta',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="font-family: 'Brittany Signature', 'Outfit', cursive, sans-serif; color: #9b393d; font-size: 42px; text-align: center; margin: 10px 0 20px 0; font-weight: normal;">Muse Catering</h1>
                    <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Hai ricevuto una nuova recensione!</h2>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Nome:</strong> ${review.author_name || 'Utente Anonimo'}</p>
                        <p><strong>Titolo:</strong> ${review.title}</p>
                        <p><strong>Valutazione:</strong> ${review.rating} / 5 ⭐</p>
                        ${review.comment ? `
                        <p><strong>Recensione completa:</strong></p>
                        <p style="font-style: italic; color: #555;">"${review.comment}"</p>
                        ` : ''}
                        ${review.images && review.images.length > 0 ? `
                        <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
                            <p style="margin-bottom: 10px;"><strong>Foto Allegate:</strong></p>
                            <div style="display: block; text-align: center;">
                                ${review.images.map(img => `<img src="${img}" alt="Foto recensione" style="max-width: 100%; max-height: 250px; border-radius: 8px; margin: 5px; display: inline-block;" />`).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${adminUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Rispondi alla recensione</a>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Review notification email sent:', info.messageId);
    } catch (error) {
        console.error('Error sending review notification email:', error);
    }
};

export const sendResponseNotification = async (review, response) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !review.author_email) {
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: review.author_email,
            subject: 'Muse Catering - Risposta alla tua recensione',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="font-family: 'Brittany Signature', cursive; color: #9b393d; font-size: 42px; margin: 0; font-weight: normal;">Muse Catering</h1>
                    </div>
                    
                    <h2 style="color: #333; margin-bottom: 20px;">Ciao ${review.author_name || 'Utente'}, abbiamo risposto alla tua recensione!</h2>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #9b393d;">
                        <p style="margin-top: 0; color: #777; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">La tua recensione:</p>
                        <p style="font-style: italic; color: #555; margin-bottom: 20px;">"${review.comment || review.title}"</p>
                        
                        <p style="margin-top: 20px; color: #9b393d; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">La nostra risposta:</p>
                        <p style="color: #2d2424; line-height: 1.6; font-size: 1.1rem; margin-bottom: 0;">${response}</p>
                    </div>

                    <p style="text-align: center; color: #777; font-size: 0.85rem; margin-top: 30px;">
                        Grazie per aver scelto Muse Catering.<br>
                        <a href="https://musecatering.ordermaster.it" style="color: #9b393d; text-decoration: none;">musecatering.ordermaster.it</a>
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Response notification email sent:', info.messageId);
    } catch (error) {
        console.error('Error sending response notification email:', error);
    }
};
