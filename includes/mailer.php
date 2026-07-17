<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';

if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    // Instalado vía Composer (composer require phpmailer/phpmailer)
    require_once __DIR__ . '/../vendor/autoload.php';
} else {
    // Vendorizado a mano en includes/PHPMailer/src/ (ver README)
    require_once __DIR__ . '/PHPMailer/src/Exception.php';
    require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
    require_once __DIR__ . '/PHPMailer/src/SMTP.php';
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/**
 * Envía un mail HTML vía SMTP de Hostinger. Devuelve true/false, nunca lanza
 * al caller (el error queda logueado con error_log para no filtrar detalles SMTP).
 */
function send_mail(string $toEmail, string $toName, string $subject, string $htmlBody): bool
{
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = ((int) SMTP_PORT === 465) ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = (int) SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
        $mail->addAddress($toEmail, $toName);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $htmlBody)));

        $mail->send();
        return true;
    } catch (PHPMailerException $e) {
        error_log('Mailer error: ' . $mail->ErrorInfo);
        return false;
    }
}

function send_magic_link_mail(string $toEmail, string $toName, string $loginUrl): bool
{
    $subject = 'Tu acceso al portal de ChichaLabs Studio';
    return send_mail($toEmail, $toName, $subject, magic_link_email_template($toName, $loginUrl));
}

function magic_link_email_template(string $name, string $loginUrl): string
{
    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeUrl  = htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8');

    return <<<HTML
    <div style="font-family: Arial, Helvetica, sans-serif; background:#F7F7F7; padding:32px; color:#0B0B0B;">
      <p style="color:#00BF63; font-weight:bold; letter-spacing:0.05em; margin:0 0 24px;">[ CHICHALABS STUDIO ]</p>
      <p>Hola {$safeName},</p>
      <p>Entrá a tu portal con este link. Es válido por 20 minutos y se puede usar una sola vez:</p>
      <p style="margin:24px 0;">
        <a href="{$safeUrl}" style="display:inline-block; padding:12px 28px; border:2px solid #00BF63; border-radius:4px; color:#0B0B0B; text-decoration:none; font-weight:bold; text-transform:uppercase; font-size:13px;">
          Entrar al portal
        </a>
      </p>
      <p style="color:rgba(11,11,11,0.6); font-size:13px;">Si no pediste este acceso, podés ignorar este mail.</p>
    </div>
    HTML;
}
