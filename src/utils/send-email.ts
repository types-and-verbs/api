import sgMail from '@sendgrid/mail';
import { Settings } from 'types';

let fromEmail: string | null = null;

export function setupEmail(settings: Settings): void {
  sgMail.setApiKey(settings.sendgridApiKey);
  fromEmail = settings.sendgridFromEmail;
}

interface Props {
  to: string;
  subject: string;
  message: string;
}

export async function sendEmail({
  to,
  subject,
  message,
}: Props): Promise<void> {
  if (!to || !message || !subject) {
    console.error('Missing data to send email');
    return;
  }

  try {
    await sgMail.send({
      to,
      from: fromEmail,
      subject: subject,
      html: message,
    });
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}
