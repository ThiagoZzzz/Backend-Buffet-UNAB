import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOrderReadyMail = async (order, qrUrl) => {
  try {

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
      to: order.user.email,
      subject: `Tu pedido #${order.id} está listo 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hola ${order.user.nombre},</h2>
          <p>Tu pedido <strong>#${order.id}</strong> ya está <strong>listo</strong> para retirar.</p>
          <p><strong>Mostrá este QR en el buffet para confirmar la entrega:</strong></p>
          <img src="cid:qrpedido${order.id}" alt="QR del pedido #${order.id}" style="width:220px;height:220px;" />
          <p>Gracias por tu compra 🍽️</p>
        </div>
      `,
      attachments: [
        {
          filename: `pedido-${order.id}.png`,
          content: qrUrl.split("base64,")[1], 
          encoding: "base64",
          cid: `qrpedido${order.id}`,
        },
      ],
    });

    console.log("✅ Mail enviado a:", order.user.email);
  } catch (error) {
    console.error("❌ Error enviando mail:", error);
  }
};
