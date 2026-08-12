import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Preview,
  Heading,
  Hr,
  Img,
  Row,
  Column,
} from '@react-email/components';

interface ActivationCodeEmailProps {
  customerName: string;
  activationCode: string;
  amountPaid?: string;
  organizationName?: string;
  slaUrl?: string;
  customerBillingInfo?: {
    name: string;
    rfc: string;
    address: string;
    email?: string;
  };
}

export const ActivationCodeEmail: React.FC<ActivationCodeEmailProps> = ({
  customerName,
  activationCode,
  amountPaid,
  organizationName = 'ERANI',
  slaUrl,
  customerBillingInfo,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Confirmación de pago y tu código de activación de {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <table align="center" border={0} cellPadding={0} cellSpacing={0} style={{ margin: '0 auto' }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'middle' }}>
                    <Img 
                      src="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/eanilogo.png" 
                      width="130" 
                      alt="ERANI" 
                      style={{ display: 'block', height: 'auto', maxWidth: '140px' }} 
                    />
                  </td>
                  <td style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                      paddingLeft: '12px',
                      fontSize: '11px',
                      fontWeight: 900,
                      letterSpacing: '0.3em',
                      color: '#6366F1',
                      textTransform: 'uppercase'
                    }}>
                      PLATFORM
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={headerSubtitle}>Confirmación de Pago</Text>
          </Section>

          <Section style={bodySection}>
            <Heading style={title}>¡Pago exitoso! Tu código de activación está listo.</Heading>
            
            <Section style={paymentSummary}>
              <Row>
                <Column>
                  <Img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" width="60" alt="Stripe" style={{ marginBottom: '8px' }} />
                  <Text style={paymentText}>Pago procesado de forma segura por Stripe.</Text>
                </Column>
                <Column align="right">
                  <Text style={amountText}>{amountPaid}</Text>
                  <Text style={paymentText}>Monto Pagado (MXN)</Text>
                </Column>
              </Row>
            </Section>

            {customerBillingInfo && (
              <Section style={billingCard}>
                <Text style={billingTitle}>Confirmación de Facturación</Text>
                <Text style={billingText}>
                  <strong>Razón Social:</strong> {customerBillingInfo.name}
                  <br />
                  <strong>RFC:</strong> {customerBillingInfo.rfc}
                  <br />
                  <strong>Domicilio Fiscal:</strong> {customerBillingInfo.address}
                  {customerBillingInfo.email && (
                    <>
                      <br />
                      <strong>Correo:</strong> {customerBillingInfo.email}
                    </>
                  )}
                </Text>
                <Text style={billingNotice}>
                  Tu factura será procesada y enviada a la brevedad con estos datos.
                </Text>
              </Section>
            )}

            <Text style={text}>
              Hola <strong>{customerName}</strong>,
              <br /><br />
              Hemos recibido y validado exitosamente tu pago a nombre de {organizationName}. Agradecemos tu confianza para transformar tus operaciones financieras.
              <br /><br />
              Para habilitar tu entorno seguro y comenzar a utilizar el Agente Forense de Inteligencia Artificial en ERANI Beta, utiliza el siguiente código único de activación:
            </Text>

            <Section style={codeCard}>
              <Text style={codeText}>{activationCode}</Text>
            </Section>

            <Text style={text}>
              <strong>Instrucciones de Activación:</strong>
              <br />
              1. Ingresa a la plataforma ERANI.
              <br />
              2. Dirígete a la configuración de tu cuenta o perfil corporativo.
              <br />
              3. Ingresa este código alfanumérico en el apartado de "Validar Suscripción".
            </Text>

            <Section style={buttonContainer}>
              <Link href="https://platform.erani.mx" style={button}>
                Ir a la Plataforma
              </Link>
            </Section>

            <Text style={text}>
              A la brevedad recibirás un segundo correo con la bienvenida oficial a ERANI Beta, los siguientes pasos y el contacto de tu Project Manager asignado.
              <br /><br />
              Adjunto en los enlaces a continuación encontrarás tu <strong>Service Level Agreement (SLA) debidamente firmado</strong> por el administrador responsable de tu organización, así como nuestros datos de facturación y domicilio fiscal.
              <br /><br />
              Si tienes dudas sobre tu facturación o requieres soporte inmediato, no dudes en contactarnos a través de los canales en la parte inferior.
              <br /><br />
              Saludos estratégicos,<br />
              <strong>El Equipo de Ventas de {organizationName}</strong>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              <strong>¿Necesitas apoyo directo?</strong>
              <br /><br />
              Ventas: <Link href="mailto:diegoa182700@gmail.com" style={footerLink}>diegoa182700@gmail.com</Link>
              <br />
              Soporte Técnico: <Link href="mailto:emilcastle2608@gmail.com" style={footerLink}>emilcastle2608@gmail.com</Link> | +52 462 307 1972
              <br /><br />
              <Link href="https://linkedin.com/company/erani" style={footerLink}>LinkedIn</Link> | <Link href="https://instagram.com/erani" style={footerLink}>Instagram</Link> | <Link href="https://facebook.com/erani" style={footerLink}>Facebook</Link>
              <br /><br />
              <Link href="mailto:contacto@erani.mx" style={footerLink}>contacto@erani.mx</Link> | +52 462 400 4066
              <br />
              Irapuato, Guanajuato, México
              <br /><br />
              <Link href="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/T&C_ERANI.pdf" style={footerLink}>Términos y Condiciones</Link> | <Link href={slaUrl || "https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/SLA_ERANI%20(2).pdf"} style={footerLink}>SLA Firmado (Tu Organización)</Link> | <Link href="https://erani.mx" style={footerLink}>erani.mx</Link>
              <br /><br />
              <strong>Datos de Facturación y Domicilio Fiscal:</strong>
              <br />
              Erani Financial Systems
              <br />
              RFC: EFS260819ABC
              <br />
              Blvd. Villas de Irapuato 1460, Irapuato, Gto. CP 36670
              <br /><br />
              Aviso legal: ERANI es una herramienta de análisis de datos financieros y operativos. Toda la información procesada es confidencial. Este mensaje y cualquier archivo adjunto son para uso exclusivo del destinatario.
              <br /><br />
              © 2026 Erani Financial Systems. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Estilos
const main = {
  backgroundColor: '#0A0A0B',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '100%',
  maxWidth: '750px',
};

const header = {
  padding: '30px 40px 20px',
  backgroundColor: '#0F0F13',
  borderTopLeftRadius: '16px',
  borderTopRightRadius: '16px',
  borderBottom: '1px solid #1E1E24',
  textAlign: 'center' as const,
};

const logoImg = {
  margin: '0 auto',
  display: 'block',
};

const headerSubtitle = {
  color: '#8A8F98',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.2em',
  marginTop: '16px',
  marginBottom: '0',
};

const bodySection = {
  padding: '40px',
  backgroundColor: '#0F0F13',
  borderBottomLeftRadius: '16px',
  borderBottomRightRadius: '16px',
  border: '1px solid #1E1E24',
  borderTop: 'none',
};

const title = {
  color: '#FFFFFF',
  fontSize: '22px',
  fontWeight: '800',
  margin: '0 0 24px',
  textAlign: 'left' as const,
};

const text = {
  color: '#D4D4D8',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '24px',
};

const paymentSummary = {
  backgroundColor: '#18181B',
  border: '1px solid #27272A',
  borderRadius: '8px',
  padding: '16px 24px',
  marginBottom: '24px',
};

const amountText = {
  color: '#10B981', // Emerald for money
  fontSize: '24px',
  fontWeight: '800',
  margin: '0 0 4px 0',
};

const paymentText = {
  color: '#A1A1AA',
  fontSize: '12px',
  margin: '0',
};

const billingCard = {
  backgroundColor: '#18181B',
  borderLeft: '4px solid #10B981', // Emerald for billing
  padding: '16px 24px',
  marginBottom: '24px',
};

const billingTitle = {
  color: '#10B981',
  fontSize: '14px',
  fontWeight: '800',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
};

const billingText = {
  color: '#D4D4D8',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px 0',
};

const billingNotice = {
  color: '#8A8F98',
  fontSize: '12px',
  fontStyle: 'italic',
  margin: '0',
};

const codeCard = {
  backgroundColor: '#18181B',
  border: '1px dashed #4F46E5', // Erani Purple
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const codeText = {
  color: '#FFFFFF',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '0.1em',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563EB', // Erani Blue
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: '800',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)', // Neon effect
};

const hr = {
  borderColor: '#27272A',
  margin: '32px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerText = {
  color: '#71717A',
  fontSize: '12px',
  lineHeight: '20px',
};

const footerLink = {
  color: '#A1A1AA',
  textDecoration: 'underline',
};

export default ActivationCodeEmail;
