// Base layout para emails
export const getEmailLayout = (content: string, language: 'ES' | 'EN' = 'ES') => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
    <!DOCTYPE html>
    <html lang="${language === 'ES' ? 'es' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transportes Medellín Travel</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
          color: #0A0A0A;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #0A0A0A;
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          color: #D6A75D;
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }
        .content {
          padding: 32px 24px;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background-color: #D6A75D;
          color: #0A0A0A;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 16px 0;
        }
        .button:hover {
          background-color: #F2C94C;
        }
        .info-box {
          background-color: #f5f5f5;
          border-left: 4px solid #D6A75D;
          padding: 16px;
          margin: 16px 0;
        }
        .footer {
          background-color: #0A0A0A;
          color: #ffffff;
          padding: 24px;
          text-align: center;
          font-size: 14px;
        }
        .footer a {
          color: #D6A75D;
          text-decoration: none;
        }
        h1 {
          color: #0A0A0A;
          font-size: 24px;
          margin: 0 0 16px 0;
        }
        h2 {
          color: #0A0A0A;
          font-size: 20px;
          margin: 24px 0 12px 0;
        }
        p {
          line-height: 1.6;
          margin: 12px 0;
        }
        .price {
          font-size: 28px;
          font-weight: bold;
          color: #D6A75D;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        .contact-section {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 20px 24px;
          margin: 32px 24px 0 24px;
          border-radius: 8px;
          text-align: center;
        }
        .contact-section h3 {
          color: #374151;
          font-size: 16px;
          margin: 0 0 12px 0;
          font-weight: 600;
        }
        .contact-section p {
          color: #6b7280;
          margin: 8px 0;
          font-size: 14px;
        }
        .whatsapp-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background-color: #25D366;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
          margin: 12px 0 8px 0;
        }
        .whatsapp-link:hover {
          background-color: #128C7E;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Transportes Medellín Travel</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        
        <!-- Sección de Contacto -->
        <div class="contact-section">
          <h3>${language === 'ES' ? 'Contacta a tu conductor' : 'Contact your driver'}</h3>
          <a href="https://wa.me/573175177409" class="whatsapp-link">
            📱 +57 317 5177409
          </a>
        </div>
        
        <div class="footer">
          <p>
            <strong>${language === 'ES' ? 'Contacto:' : 'Contact:'}</strong><br>
            Email: <a href="mailto:medellintraveltransportes@gmail.com">medellintraveltransportes@gmail.com</a><br>
            Instagram: <a href="https://instagram.com/transportesmedellintravel">@transportesmedellintravel</a>
          </p>
          <p style="margin-top: 16px; font-size: 12px; color: #999;">
            © 2024 Transportes Medellín Travel - ${language === 'ES' ? 'Todos los derechos reservados' : 'All rights reserved'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Utilidad para formatear precio
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
};

// Utilidad para formatear fecha
export const formatDate = (date: Date, language: 'ES' | 'EN' = 'ES') => {
  return new Intl.DateTimeFormat(language === 'ES' ? 'es-CO' : 'en-US', {
    dateStyle: 'long',
  }).format(date);
};
