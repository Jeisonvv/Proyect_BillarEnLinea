import nodemailer from "nodemailer";


function getSMTP_HOST() { return process.env.SMTP_HOST; }
function getSMTP_PORT() { return Number(process.env.SMTP_PORT ?? 587); }
function getSMTP_SECURE() { return process.env.SMTP_SECURE === "true"; }
function getSMTP_USER() { return process.env.SMTP_USER; }
function getSMTP_PASS() { return process.env.SMTP_PASS; }
function getMAIL_FROM() { return process.env.MAIL_FROM; }

export function isMailConfigured() {
  return Boolean(
    getSMTP_HOST() &&
    getSMTP_PORT() &&
    getSMTP_USER() &&
    getSMTP_PASS() &&
    getMAIL_FROM()
  );
}

function getTransporter() {
  if (!isMailConfigured()) {
    throw new Error("El servicio de correo no está configurado.");
  }
  return nodemailer.createTransport({
    host: getSMTP_HOST(),
    port: getSMTP_PORT(),
    secure: getSMTP_SECURE(),
    auth: {
      user: getSMTP_USER(),
      pass: getSMTP_PASS(),
    },
  });
}

interface SendPasswordResetEmailParams {
  to: string;
  name?: string | undefined;
  resetUrl: string;
  expiresAt: Date;
}

interface SendAccountSetupEmailParams {
  to: string;
  name?: string | undefined;
  setupUrl: string;
  expiresAt: Date;
}

export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams) {
  const transporter = getTransporter();
  const expirationText = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(params.expiresAt);

  const recipientName = params.name?.trim() || "Hola";

  try {
    await transporter.sendMail({
      from: getMAIL_FROM(),
      to: params.to,
      subject: "Recupera tu contraseña",
      text:
        `${recipientName},\n\n` +
        "Recibimos una solicitud para restablecer tu contraseña.\n" +
        `Abre este enlace para continuar: ${params.resetUrl}\n\n` +
        `Este enlace vence el ${expirationText}.\n\n` +
        "Si no solicitaste este cambio, puedes ignorar este correo.",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
          <h2 style="margin-bottom: 16px; color: #111827;">Recupera tu contraseña</h2>
          <p>${recipientName},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña en Billar en Línea.</p>
          <p style="margin: 24px 0;">
            <a
              href="${params.resetUrl}"
              style="display: inline-block; padding: 12px 20px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;"
            >Restablecer contraseña</a>
          </p>
          <p>Si el botón no abre, copia y pega este enlace en tu navegador:</p>
          <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
          <p>Este enlace vence el ${expirationText}.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `,
    });
    console.log("Correo de recuperación enviado a:", params.to);
  } catch (err) {
    console.error("Error enviando correo de recuperación:", err);
  }
}

export async function sendAccountSetupEmail(params: SendAccountSetupEmailParams) {
  const transporter = getTransporter();
  const expirationText = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(params.expiresAt);

  const recipientName = params.name?.trim() || "Hola";

  await transporter.sendMail({
    from: getMAIL_FROM(),
    to: params.to,
    subject: "Activa tu cuenta",
    text:
      `${recipientName},\n\n` +
      "Creamos una cuenta para ti en Billar en Línea.\n" +
      `Abre este enlace para definir tu contraseña: ${params.setupUrl}\n\n` +
      `Este enlace vence el ${expirationText}.\n\n` +
      "Si no esperabas este mensaje, puedes ignorarlo y contactarnos.",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
        <h2 style="margin-bottom: 16px; color: #111827;">Activa tu cuenta</h2>
        <p>${recipientName},</p>
        <p>Creamos una cuenta para ti en Billar en Línea.</p>
        <p>Usa este enlace para definir tu contraseña y activar el acceso:</p>
        <p style="margin: 24px 0;">
          <a
            href="${params.setupUrl}"
            style="display: inline-block; padding: 12px 20px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;"
          >Definir contraseña</a>
        </p>
        <p>Si el botón no abre, copia y pega este enlace en tu navegador:</p>
        <p><a href="${params.setupUrl}">${params.setupUrl}</a></p>
        <p>Este enlace vence el ${expirationText}.</p>
        <p>Si no esperabas este mensaje, puedes ignorarlo y contactarnos.</p>
      </div>
    `,
  });
}