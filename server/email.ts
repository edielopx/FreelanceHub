import { MailService } from "@sendgrid/mail";

// Configuração do SendGrid
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Função para enviar emails usando SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email enviado com sucesso para ${params.to}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email via SendGrid:", error);
    return false;
  }
}

/**
 * Envia um email de recuperação de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string,
): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  return await sendEmail({
    to: email,
    from: "noreply@freelancehub.com", // Altere para um email válido verificado no SendGrid
    subject: "Recuperação de Senha - FreelanceHub",
    text: `Você solicitou a recuperação de senha. Por favor, clique no link a seguir para redefinir sua senha: ${resetUrl}. O link expira em 1 hora.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #3f51b5;">FreelanceHub</h1>
        </div>
        <div>
          <p>Olá,</p>
          <p>Você solicitou a recuperação de senha para sua conta no FreelanceHub.</p>
          <p>Por favor, clique no botão abaixo para redefinir sua senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3f51b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Redefinir Senha
            </a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>Este link expira em 1 hora por motivos de segurança.</p>
          <p>Se você não solicitou a recuperação de senha, ignore este email.</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Envia um email de confirmação após o pagamento
 */
export async function sendPaymentConfirmationEmail(params: {
  to: string,
  name: string,
  serviceName: string,
  freelancerName: string,
  amount: number,
  date?: Date,
}): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(params.amount);

  // Usar a data fornecida ou a data atual
  const date = params.date || new Date();
  
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return await sendEmail({
    to: params.to,
    from: "noreply@freelancehub.com", // Altere para um email válido verificado no SendGrid
    subject: "Confirmação de Pagamento - FreelanceHub",
    text: `Olá ${params.name}, seu pagamento foi confirmado para o serviço: ${params.serviceName} com o freelancer ${params.freelancerName}. Valor: ${formattedAmount}. Data: ${formattedDate}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #3f51b5;">FreelanceHub</h1>
        </div>
        <div>
          <h2 style="color: #4caf50;">Pagamento Confirmado!</h2>
          <p>Olá,</p>
          <p>Seu pagamento foi confirmado com sucesso.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Serviço:</strong> ${serviceName}</p>
            <p><strong>Freelancer:</strong> ${freelancerName}</p>
            <p><strong>Valor:</strong> ${formattedAmount}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
          </div>
          <p>Obrigado por usar o FreelanceHub!</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    `,
  });
}
