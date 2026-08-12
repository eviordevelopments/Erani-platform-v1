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

interface AiSummaryEmailProps {
  sessionTitle: string;
  date: string;
  executiveSummary: string;
  todos: string[];
  organizationName?: string;
  sessionUrl?: string;
}

export const AiSummaryEmail: React.FC<AiSummaryEmailProps> = ({
  sessionTitle,
  date,
  executiveSummary,
  todos = [],
  organizationName = 'ERANI',
  sessionUrl = 'https://platform.erani.mx/sessions',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Hallazgos Forenses y Resumen: {sessionTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img 
              src="https://platform.erani.mx/eanilogo.png" 
              width="150" 
              alt="ERANI Platform" 
              style={logoImg} 
            />
            <Text style={headerSubtitle}>Inteligencia Forense y Operativa</Text>
          </Section>

          <Section style={bodySection}>
            <Heading style={title}>Resumen de Sesión Procesado</Heading>
            
            <Text style={text}>
              Hola, esperamos que te encuentres excelente. 
              <br /><br />
              El <strong>Agente Forense de ERANI AI</strong> ha terminado de analizar y procesar la transcripción de la sesión <strong>{sessionTitle}</strong> del {date}. A continuación te presentamos los hallazgos forenses y el plan de acción extraído automáticamente.
            </Text>

            <Section style={summaryCard}>
              <Text style={detailLabel}>
                <Img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" width="14" height="14" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', filter: 'hue-rotate(240deg)'}} alt="AI" />
                Resumen Ejecutivo
              </Text>
              <Text style={executiveText}>{executiveSummary}</Text>
            </Section>

            {todos.length > 0 && (
              <Section style={todosSection}>
                <Text style={detailLabel}>Items Por Hacer Recomendados (Actionables)</Text>
                {todos.map((todo, i) => (
                  <Section key={i} style={taskCard}>
                    <Text style={taskTitle}>{todo}</Text>
                  </Section>
                ))}
              </Section>
            )}

            <Section style={buttonContainer}>
              <Link href={sessionUrl} style={button}>
                Convertir a Tareas en Plataforma
              </Link>
            </Section>

            <Text style={text}>
              Si deseas agregar, modificar o dar seguimiento a estos actionables en tu tablero Kanban, haz clic en el botón superior para ingresar a tu entorno de <strong>{organizationName}</strong>.
              <br /><br />
              Saludos estratégicos,<br />
              <strong>Erani AI Assistant</strong>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Este es un mensaje automático generado por ERANI AI.
              <br /><br />
              <Link href="https://erani.mx" style={footerLink}>erani.mx</Link> | <Link href="mailto:contacto@erani.mx" style={footerLink}>contacto@erani.mx</Link>
              <br /><br />
              Aviso legal: La información procesada por la IA es de carácter confidencial y para uso exclusivo de los miembros autorizados.
              <br />
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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
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

const summaryCard = {
  backgroundColor: '#18181B',
  border: '1px solid #27272A',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const detailLabel = {
  color: '#8A8F98',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  fontSize: '12px',
  letterSpacing: '0.05em',
  marginBottom: '12px',
};

const executiveText = {
  color: '#E4E4E7',
  fontSize: '14px',
  lineHeight: '26px',
  margin: '8px 0 0 0',
  whiteSpace: 'pre-wrap' as const,
};

const todosSection = {
  marginBottom: '32px',
};

const taskCard = {
  marginTop: '12px',
  marginBottom: '12px',
  padding: '16px',
  backgroundColor: '#18181B',
  borderLeft: '4px solid #2563EB', // Erani Blue
  borderRadius: '0 8px 8px 0',
  border: '1px solid #27272A',
  borderLeftWidth: '4px',
};

const taskTitle = {
  color: '#FFFFFF',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#9333EA', // Erani Purple
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
  boxShadow: '0 0 20px rgba(147, 51, 234, 0.4)', // Neon effect
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

export default AiSummaryEmail;
