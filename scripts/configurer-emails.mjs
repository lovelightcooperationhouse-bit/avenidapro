/**
 * Configure l'envoi des e-mails d'authentification Supabase par Resend (SMTP)
 * et installe les modèles en français aux couleurs Avenida
 * (confirmation de compte, mot de passe oublié, invitation, lien de connexion, changement d'e-mail).
 *
 * Usage (PowerShell) :
 *   $env:RESEND_API_KEY="re_..."; node scripts/configurer-emails.mjs
 * Facultatif : $env:EMAIL_FROM="notifications@hotelecoleavenida.net"  (domaine vérifié dans Resend)
 * Le jeton Supabase est lu dans SUPABASE_ACCESS_TOKEN ou dans .agents/mcp_config.json (jamais commité).
 */
import fs from "fs";

const key = process.env.RESEND_API_KEY;
if (!key?.startsWith("re_")) {
  console.error("Définissez RESEND_API_KEY (clé Resend commençant par re_).");
  process.exit(1);
}
const from = process.env.EMAIL_FROM || "notifications@hotelecoleavenida.net";
const token =
  process.env.SUPABASE_ACCESS_TOKEN || JSON.parse(fs.readFileSync(".agents/mcp_config.json", "utf8")).mcpServers.supabase.env.SUPABASE_ACCESS_TOKEN;
const PROJECT = "xlugccxuittetcayjsxc";

const wrap = (title, text, button, note) => `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#06152E;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:1px">HÔTEL ÉCOLE <span style="color:#FF3B47">AVENIDA</span></td></tr>
<tr><td style="height:4px;background:#E30613"></td></tr>
<tr><td style="padding:28px 24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#0C356A">${title}</h1>
<p style="margin:0 0 24px;line-height:1.6">${text}</p>
<a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#E30613;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${button}</a>
<p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.5">${note}</p>
</td></tr>
<tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b">Hôtel École Avenida · 30, rue d'Almeida Léopold, Cocoteraie, Lomé · Travail – Discipline – Excellence<br>www.hotelecoleavenida.net</td></tr>
</table></td></tr></table></body></html>`;

const ignore = "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.";
const body = {
  mailer_subjects_confirmation: "Confirmez votre compte – Hôtel École Avenida",
  mailer_templates_confirmation_content: wrap("Bienvenue à l'Hôtel École Avenida", "Merci d'avoir créé votre compte. Confirmez votre adresse e-mail pour accéder à votre espace personnel.", "Confirmer mon adresse", ignore),
  mailer_subjects_recovery: "Réinitialisation de votre mot de passe – Avenida",
  mailer_templates_recovery_content: wrap("Nouveau mot de passe", "Vous avez demandé à changer le mot de passe de votre compte Avenida. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.", "Choisir un nouveau mot de passe", ignore + " Votre mot de passe actuel reste inchangé."),
  mailer_subjects_magic_link: "Votre lien de connexion – Hôtel École Avenida",
  mailer_templates_magic_link_content: wrap("Connexion à votre espace", "Cliquez sur le bouton ci-dessous pour vous connecter à votre espace Avenida.", "Me connecter", ignore),
  mailer_subjects_invite: "Invitation à rejoindre l'espace Hôtel École Avenida",
  mailer_templates_invite_content: wrap("Vous êtes invité(e)", "L'administration de l'Hôtel École Avenida vous a créé un accès à la plateforme en ligne. Acceptez l'invitation pour activer votre compte.", "Activer mon compte", ignore),
  mailer_subjects_email_change: "Confirmez votre nouvelle adresse e-mail – Avenida",
  mailer_templates_email_change_content: wrap("Changement d'adresse e-mail", "Confirmez que {{ .NewEmail }} est bien votre nouvelle adresse pour votre compte Avenida.", "Confirmer la nouvelle adresse", ignore),
  mailer_subjects_reauthentication: "Code de confirmation – Avenida",
  mailer_templates_reauthentication_content: `<p>Votre code de confirmation Avenida : <strong>{{ .Token }}</strong></p>`,
};

const smtp = {
  external_email_enabled: true,
  smtp_admin_email: from,
  smtp_sender_name: "Hôtel École Avenida",
  smtp_host: "smtp.resend.com",
  smtp_port: "465",
  smtp_user: "resend",
  smtp_pass: key,
  smtp_max_frequency: 30,
  rate_limit_email_sent: 100,
};

const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ ...smtp, ...body }),
});
const j = await r.json();
if (!r.ok) {
  console.error("Échec :", r.status, JSON.stringify(j).slice(0, 400));
  process.exit(1);
}
console.log(`SMTP Resend actif (expéditeur ${j.smtp_sender_name} <${j.smtp_admin_email}>), modèles français installés.`);
