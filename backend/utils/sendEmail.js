import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // Mode développement - ENVOYER pour de vrai mais avec logging
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 DEVELOPPEMENT - Envoi réel d\'email');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    
    // Mais on envoie quand même l'email
  }

  // Validation des variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials are required');
  }

  try {
    // Configuration Gmail avec sécurisation
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Options supplémentaires pour meilleure délivrabilité
      secure: true,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Vérifier la connexion
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Options de l'email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html?.replace(/<[^>]*>/g, ''),
      // Headers pour éviter le spam
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High'
      }
    };

    // Envoyer l'email
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', options.to);
    console.log('Message ID:', result.messageId);
    
    return result;

  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    if (error.code === 'EAUTH') {
      throw new Error('Authentication failed. Check your Gmail app password.');
    }
    
    // Gestion d'erreurs spécifiques Gmail
    if (error.response?.includes('550-5.7.1')) {
      throw new Error('Email rejected by Gmail. Check recipient address and domain reputation.');
    }
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export default sendEmail;