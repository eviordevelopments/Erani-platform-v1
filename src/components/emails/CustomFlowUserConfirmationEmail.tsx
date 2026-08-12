import * as React from 'react';
import {
  Html,
  Body,
  Head,
  Heading,
  Container,
  Preview,
  Section,
  Text,
  Link,
  Hr,
  Img
} from '@react-email/components';

interface CustomFlowUserConfirmationEmailProps {
  userName: string;
  automationName: string;
}

export const CustomFlowUserConfirmationEmail = ({
  userName,
  automationName,
}: CustomFlowUserConfirmationEmailProps) => {
  const meetingLink = "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2EUR-bCUz7R604ttZTsBVNw5TRByBuPyoL8Os2axIgH2v1hjAh0OJURYc2TiH92bH-O5kkJf94";

  return (
    <Html>
      <Head />
      <Preview>⚙️ Solicitud de Ingeniería: {automationName} recibida con éxito.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Img
              src="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/logo.png"
              width="180"
              height="auto"
              alt="ERANI Platform"
              style={{ margin: '0 auto' }}
            />
          </Section>

          <Heading style={h1}>Ingeniería de Automatizaciones ⚙️</Heading>
          
          <Text style={text}>
            Hola <strong>{userName}</strong>, 👋
          </Text>

          <Text style={text}>
            Agradecemos mucho tu interés en potenciar tu ecosistema operativo. Hemos recibido correctamente tu solicitud de diseño e implementación técnica para el flujo: <strong>{automationName}</strong>. 🚀
          </Text>

          <Text style={text}>
            Nuestro equipo de Ingeniería Avanzada ya está analizando los requerimientos de la operación que deseas optimizar y mitigar. Para darle seguimiento oportuno, resolver dudas técnicas y afinar los detalles de la integración, te invitamos a agendar una sesión de valoración interactiva con nuestro Project Manager (Diego Arredondo). 📅
          </Text>

          <Section style={buttonContainer}>
            <Link href={meetingLink} style={button}>
              Agendar Sesión de Valoración Técnica
            </Link>
          </Section>

          <Text style={text}>
            ¡Estamos listos para llevar tu proyecto al siguiente nivel de eficiencia y gobernanza operativa! 💼📈
          </Text>

          <Text style={text}>
            Saludos estratégicos,<br />
            <strong>El Equipo de ERANI Platform</strong>
          </Text>

          <Hr style={hr} />

          <Text style={footerHeading}>¿Necesitas apoyo directo?</Text>
          
          <Text style={footer}>
            <strong>Ventas:</strong> <Link href="mailto:diegoa182700@gmail.com" style={link}>diegoa182700@gmail.com</Link><br />
            <strong>Soporte Técnico:</strong> <Link href="mailto:emilcastle2608@gmail.com" style={link}>emilcastle2608@gmail.com</Link> | +52 462 307 1972
          </Text>

          <Text style={footer}>
            <Link href="https://linkedin.com/company/erani" style={link}>LinkedIn</Link> | <Link href="https://instagram.com/erani.mx" style={link}>Instagram</Link> | <Link href="https://facebook.com/erani.mx" style={link}>Facebook</Link>
          </Text>

          <Text style={footer}>
            <Link href="mailto:contacto@erani.mx" style={link}>contacto@erani.mx</Link> | +52 462 400 4066<br />
            Irapuato, Guanajuato, México
          </Text>

          <Text style={footer}>
            <Link href="https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/T&C_ERANI.pdf" style={link}>Términos y Condiciones</Link> | <Link href="https://erani.mx" style={link}>erani.mx</Link>
          </Text>

          <Text style={legalText}>
            Aviso legal: ERANI es una herramienta de análisis de datos financieros y operativos. Toda la información procesada es confidencial. Este mensaje y cualquier archivo adjunto son para uso exclusivo del destinatario.
          </Text>

          <Text style={copyright}>
            © 2026 Erani Financial Systems. Todos los derechos reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CustomFlowUserConfirmationEmail;

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  maxWidth: '650px',
  borderTop: '4px solid #4f46e5',
};

const h1 = {
  color: '#0a0a0a',
  fontSize: '22px',
  fontWeight: '900',
  padding: '0',
  margin: '0 0 25px',
  textAlign: 'center' as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '0 0 20px',
};

const hr = {
  borderColor: '#eaeaea',
  margin: '35px 0',
};

const link = {
  color: '#4f46e5',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '40px 0',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '18px 32px',
  display: 'inline-block',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
};

const footerHeading = {
  color: '#0a0a0a',
  fontSize: '14px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 10px',
  textTransform: 'uppercase' as const,
};

const footer = {
  color: '#666666',
  fontSize: '13px',
  textAlign: 'center' as const,
  lineHeight: '22px',
  margin: '0 0 15px',
};

const legalText = {
  color: '#999999',
  fontSize: '10px',
  textAlign: 'justify' as const,
  lineHeight: '16px',
  margin: '25px 0',
  padding: '15px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  border: '1px solid #f3f4f6',
};

const copyright = {
  color: '#aaaaaa',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '0',
};
