import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
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
                    <h2 style="color: #333; text-align: center;">Hai ricevuto una nuova recensione!</h2>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Autore:</strong> ${review.author_name}</p>
                        <p><strong>Valutazione:</strong> ${review.rating} / 5 ⭐</p>
                        <p><strong>Commento:</strong></p>
                        <p style="font-style: italic; color: #555;">"${review.comment}"</p>
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
