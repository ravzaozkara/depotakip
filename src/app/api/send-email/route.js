import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      customerName, 
      customerPhone, 
      customerUnit, 
      productName, 
      quantity, 
      pickupDate, 
      returnDate,
      reservationId 
    } = body;

    // Admin'e bildirim emaili
    const adminEmail = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [process.env.EMAIL_TO || 'admin@example.com'],
      subject: `Yeni Rezervasyon - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Yeni Rezervasyon Bildirimi</h2>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #047857; margin-top: 0;">Rezervasyon Detayları</h3>
            <p><strong>Rezervasyon ID:</strong> #${reservationId}</p>
            <p><strong>Ürün:</strong> ${productName}</p>
            <p><strong>Miktar:</strong> ${quantity} adet</p>
            <p><strong>Teslim Alma Tarihi:</strong> ${new Date(pickupDate).toLocaleDateString('tr-TR')}</p>
            <p><strong>Teslim Etme Tarihi:</strong> ${new Date(returnDate).toLocaleDateString('tr-TR')}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Müşteri Bilgileri</h3>
            <p><strong>Ad Soyad:</strong> ${customerName}</p>
            <p><strong>Telefon:</strong> ${customerPhone}</p>
            <p><strong>Birim:</strong> ${customerUnit}</p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Bu email otomatik olarak gönderilmiştir. Admin panelinden rezervasyonu yönetebilirsiniz.
            </p>
          </div>
        </div>
      `,
    });

    // Müşteriye onay emaili (isteğe bağlı)
    const customerEmail = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [`${customerName.toLowerCase().replace(' ', '.')}@example.com`], // Gerçek email adresi gerekli
      subject: `Rezervasyon Onayı - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Rezervasyon Onayı</h2>
          
          <p>Merhaba ${customerName},</p>
          
          <p>Rezervasyonunuz başarıyla alınmıştır. Detaylar aşağıdaki gibidir:</p>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Rezervasyon ID:</strong> #${reservationId}</p>
            <p><strong>Ürün:</strong> ${productName}</p>
            <p><strong>Miktar:</strong> ${quantity} adet</p>
            <p><strong>Teslim Alma Tarihi:</strong> ${new Date(pickupDate).toLocaleDateString('tr-TR')}</p>
            <p><strong>Teslim Etme Tarihi:</strong> ${new Date(returnDate).toLocaleDateString('tr-TR')}</p>
          </div>

          <p>Herhangi bir sorunuz olması durumunda bizimle iletişime geçebilirsiniz.</p>
          
          <p>İyi günler!</p>
        </div>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      adminEmailId: adminEmail.data?.id,
      customerEmailId: customerEmail.data?.id 
    });

  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}