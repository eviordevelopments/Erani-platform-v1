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

interface WelcomeEraniBetaEmailProps {
  customerName: string;
  organizationName?: string;
}

export const WelcomeEraniBetaEmail: React.FC<WelcomeEraniBetaEmailProps> = ({
  customerName,
  organizationName = 'ERANI',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a ERANI Beta: Tu nueva era de análisis financiero</Preview>
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
            <Text style={headerSubtitle}>Welcome to Erani Beta</Text>
          </Section>

          <Section style={bodySection}>
            <Heading style={title}>Bienvenido al Futuro, {customerName}.</Heading>
            
            <Text style={text}>
              Hoy marcas un antes y un después en la forma en la que analizas, gestionas y proteges tu información corporativa. Al unirte a <strong>ERANI Beta</strong>, no solo estás adquiriendo un software; estás integrando a tu equipo al Agente Forense de Inteligencia Artificial más avanzado, diseñado específicamente para blindar tu capital y erradicar los riesgos sistémicos ocultos.
            </Text>

            <Text style={text}>
              Sabemos que tomar decisiones basadas en datos crudos es complejo. Nuestra misión es darte claridad, poder predictivo y una ventaja estratégica sin precedentes.
            </Text>

            <Section style={unlocksCard}>
              <Text style={unlocksTitle}>¿Qué acabas de desbloquear?</Text>
              <Text style={unlockItem}>• <strong>Agente Forense 24/7:</strong> Análisis profundo de fugas de capital y riesgos operativos en tiempo real.</Text>
              <Text style={unlockItem}>• <strong>Data Rooms Seguros:</strong> Espacios encriptados para colaboración de alto nivel con tu equipo.</Text>
              <Text style={unlockItem}>• <strong>Visualización Dinámica:</strong> Gráficos interactivos generados al instante por Inteligencia Artificial.</Text>
              <Text style={unlockItem}>• <strong>Automatización de Tareas:</strong> Creación y delegación automática de minutas y puntos de acción tras cada sesión.</Text>
            </Section>

            <Heading style={subtitle}>Primeros Pasos en ERANI Beta</Heading>
            <Text style={text}>
              Para arrancar con el pie derecho y obtener valor inmediato, te recomendamos seguir estos pasos:
            </Text>
            <Section style={tipsCard}>
              <Text style={tipItem}><strong>1. Sincroniza tus fuentes:</strong> Conecta tu ERP o sube tus estados financieros en el Data Room seguro.</Text>
              <Text style={tipItem}><strong>2. Explora tu Dashboard:</strong> Navega por tus KPIs financieros y descubre las visualizaciones generadas por IA.</Text>
              <Text style={tipItem}><strong>3. Interactúa con el Agente Forense:</strong> Hazle preguntas directas sobre tu flujo de efectivo, variaciones de presupuesto o riesgos latentes.</Text>
            </Section>

            <Text style={text}>
              💡 <strong>Consejo Práctico:</strong> Utiliza nuestros <Link href="https://platform.erani.mx/tutorials" style={link}>Tutoriales Interactivos</Link> disponibles dentro de la plataforma para dominar las funcionalidades a tu propio ritmo.
            </Text>

            <Hr style={hr} />

            <Heading style={subtitle}>Tu Project Manager Asignado</Heading>
            
            <Text style={text}>
              Para asegurarnos de que le saques el máximo rendimiento a tu plataforma desde el día 1, te hemos asignado un especialista que te guiará personalmente en tu proceso de Onboarding.
            </Text>

            <Section style={pmCard}>
              <Row>
                <Column style={{ width: '64px' }}>
                  <Img
                    src="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/default-avatar.png"
                    alt="Diego Arredondo"
                    width="48"
                    height="48"
                    style={pmAvatar}
                  />
                </Column>
                <Column>
                  <Text style={pmName}>Diego Arredondo</Text>
                  <Text style={pmRole}>Project Manager · ERANI Platform</Text>
                  <Link href="mailto:diegoa182700@gmail.com" style={pmEmail}>diegoa182700@gmail.com</Link>
                </Column>
              </Row>
            </Section>

            <Section style={buttonContainer}>
              <Text style={textBold}>Agenda tu primera sesión de Onboarding aquí:</Text>
              <Link href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2EUR-bCUz7R604ttZTsBVNw5TRByBuPyoL8Os2axIgH2v1hjAh0OJURYc2TiH92bH-O5kkJf94" style={button}>
                Agendar Sesión con Diego
              </Link>
            </Section>

            <Text style={text}>
              Estamos emocionados de acompañarte en este viaje. El futuro de tu organización comienza hoy.
              <br /><br />
              Con visión y estrategia,<br />
              <strong>El Equipo de {organizationName}</strong>
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
              <Link href="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/T&C_ERANI.pdf" style={footerLink}>Términos y Condiciones</Link> | <Link href="https://erani.mx" style={footerLink}>erani.mx</Link>
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
  maxWidth: '180px',
  height: 'auto',
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

const subtitle = {
  color: '#FFFFFF',
  fontSize: '18px',
  fontWeight: '700',
  margin: '24px 0 16px',
};

const text = {
  color: '#D4D4D8',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '24px',
};

const textBold = {
  color: '#FFFFFF',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '16px',
  fontWeight: '700',
};

const unlocksCard = {
  backgroundColor: '#18181B',
  border: '1px solid #27272A',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const unlocksTitle = {
  color: '#4F46E5', // Erani Purple
  fontSize: '16px',
  fontWeight: '800',
  margin: '0 0 16px 0',
  textTransform: 'uppercase' as const,
};

const unlockItem = {
  color: '#D4D4D8',
  fontSize: '14px',
  margin: '0 0 12px 0',
  lineHeight: '20px',
};

const tipsCard = {
  backgroundColor: '#18181B',
  borderLeft: '4px solid #2563EB', // Erani Blue
  padding: '16px 24px',
  marginBottom: '24px',
};

const tipItem = {
  color: '#D4D4D8',
  fontSize: '14px',
  margin: '0 0 12px 0',
  lineHeight: '22px',
};

const link = {
  color: '#2563EB',
  textDecoration: 'underline',
  fontWeight: '600',
};

const pmCard = {
  backgroundColor: '#18181B',
  border: '1px solid #27272A',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '24px',
};

const pmAvatar = {
  borderRadius: '50%',
  border: '2px solid #2563EB',
  objectFit: 'cover' as const,
};

const pmName = {
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: '800',
  margin: '0 0 4px 0',
};

const pmRole = {
  color: '#8A8F98',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const pmEmail = {
  color: '#4F46E5', // Erani Purple
  fontSize: '13px',
  textDecoration: 'none',
  fontWeight: '600',
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

export default WelcomeEraniBetaEmail;
