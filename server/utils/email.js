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
