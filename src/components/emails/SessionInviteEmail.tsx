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

interface Attendee {
  name: string;
  role: string;
}

interface LinkedTask {
  title: string;
  notes?: string;
}

interface SessionInviteEmailProps {
  sessionTitle: string;
  projectManagerName: string;
  date: string;
  rawDate?: string;
  meetLink?: string;
  notes?: string;
  projectName?: string;
  attendeesInfo?: Attendee[];
  linkedTasks?: LinkedTask[];
  isTask?: boolean;
  isOperation?: boolean;
  inviterName?: string;
  inviterRole?: string;
  inviterAvatarUrl?: string;
  organizationName?: string;
  actionText?: string;
}

export const SessionInviteEmail: React.FC<SessionInviteEmailProps> = ({
  sessionTitle,
  projectManagerName,
  date,
  rawDate,
  meetLink,
  notes,
  projectName,
  attendeesInfo = [],
  linkedTasks = [],
  isTask = false,
  isOperation = false,
  inviterName = 'El Administrador',
  inviterRole = 'Administrador',
  inviterAvatarUrl = 'https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/default-avatar.png',
  organizationName = 'ERANI',
  actionText,
}) => {
  // Generate Calendar Links
  const startDate = new Date(rawDate || new Date());
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // assume 1 hour duration
  
  const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&text=${encodeURIComponent(sessionTitle)}&details=${encodeURIComponent(notes || 'Sesión Estratégica')}&location=${encodeURIComponent(meetLink || '')}`;
  const msCalUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&subject=${encodeURIComponent(sessionTitle)}&body=${encodeURIComponent(notes || 'Sesión Estratégica')}&location=${encodeURIComponent(meetLink || '')}`;

  return (
    <Html>
      <Head />
      <Preview>{isOperation ? `Nueva Operación: ${sessionTitle}` : isTask ? `Nueva Tarea: ${sessionTitle}` : `Invitación a Sesión Estratégica: ${sessionTitle}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img 
              src="https://platform.erani.mx/eanilogo.png" 
              width="150" 
              alt="ERANI Platform" 
              style={logoImg} 
            />
            <Text style={headerSubtitle}>Sesiones de Estrategia Forense</Text>
          </Section>

          <Section style={bodySection}>
            <Heading style={title}>{isOperation ? 'Se te ha asignado una nueva operación' : isTask ? 'Se te ha asignado una nueva tarea' : 'Has sido convocado a una sesión estratégica'}</Heading>
            
            <Text style={text}>
              Hola, esperamos que te encuentres excelente. 
              <br /><br />
              Este es un recordatorio oficial de que <strong>{inviterName}</strong>, {inviterRole} a cargo, 
              {isOperation
                ? ` te ha asignado como responsable en una nueva operación clave de ${organizationName}.`
                : isTask 
                ? ` te ha asignado como colaborador en una nueva tarea o punto de acción de ${organizationName}.`
                : ` te ha convocado para formar parte de la próxima sesión de alto impacto de ${organizationName}. Tu participación es clave para los acuerdos y la alineación estratégica.`
              }
            </Text>

            <Section style={pmCard}>
              <Row>
                <Column style={{ width: '64px' }}>
                  <Img
                    src={inviterAvatarUrl || 'https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/default-avatar.png'}
                    alt={inviterName}
                    width="48"
                    height="48"
                    style={pmAvatar}
                  />
                </Column>
                <Column>
                  <Text style={pmName}>{inviterName}</Text>
                  <Text style={pmRole}>{inviterRole} · {organizationName}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={detailsCard}>
              <Text style={detailItem}>
                <span style={detailLabel}>{isOperation ? '📍 Operación:' : isTask ? '📍 Tarea:' : '📍 Sesión:'}</span> {sessionTitle}
              </Text>
              {projectName && (
                <Text style={detailItem}>
                  <span style={detailLabel}>📁 Proyecto / Auditoría:</span> {projectName}
                </Text>
              )}
              <Text style={detailItem}>
                <span style={detailLabel}>{isTask ? '⏰ Deadline / Fecha Límite:' : '⏰ Fecha y Hora:'}</span> {date}
              </Text>
            </Section>

            {attendeesInfo.length > 0 && (
              <Section style={attendeesSection}>
                <Text style={detailLabel}>Invitados / Colaboradores:</Text>
                {attendeesInfo.map((a, i) => (
                  <Text key={i} style={attendeeText}>
                    • <strong>{a.name}</strong> <span style={{ color: '#71717A', fontSize: '12px' }}>({a.role})</span>
                  </Text>
                ))}
              </Section>
            )}

            {notes && (
              <Section style={notesSection}>
                <Text style={detailLabel}>{isOperation || isTask ? 'Descripción o Detalles:' : 'Notas de la Sesión:'}</Text>
                <Text style={notesText}>{notes}</Text>
              </Section>
            )}

            {linkedTasks && linkedTasks.length > 0 && (
              <Section style={linkedTasksSection}>
                <Text style={detailLabel}>Agenda / Tareas a Tratar:</Text>
                {linkedTasks.map((task, i) => (
                  <Section key={i} style={taskCard}>
                    <Text style={taskTitle}>• {task.title}</Text>
                    {task.notes && <Text style={taskNotes}>{task.notes}</Text>}
                  </Section>
                ))}
              </Section>
            )}

            <Section style={buttonContainer}>
              <Link href={meetLink || 'https://platform.erani.mx'} style={button}>
                {actionText || (isOperation || isTask ? 'Ver en Plataforma' : 'Unirse a la Reunión')}
              </Link>
            </Section>

            {rawDate && (
              <Section style={calendarLinks}>
                <Text style={calText}>Agrega este evento a tu calendario:</Text>
                <Link href={googleCalUrl} style={calLink}>
                  <Img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" width="16" height="16" alt="Google" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
                  Google Calendar
                </Link>
                <span style={{color: '#3F3F46', margin: '0 16px'}}>|</span>
                <Link href={msCalUrl} style={calLink}>
                  <Img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" width="16" height="16" alt="Outlook" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
                  Outlook Calendar
                </Link>
              </Section>
            )}

            <Text style={text}>
              {(!isTask && !isOperation) && "Por favor, asegúrate de conectarte puntual. Nuestro agente inteligente estará presente grabando y transcribiendo en tiempo real los acuerdos principales de esta junta."}
              <br /><br />
              Saludos estratégicos,<br />
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
  margin: '0',
};

const detailsCard = {
  backgroundColor: '#18181B',
  border: '1px solid #27272A',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const detailItem = {
  margin: '0 0 12px 0',
  color: '#FFFFFF',
  fontSize: '14px',
};

const detailLabel = {
  color: '#8A8F98',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  fontSize: '12px',
  letterSpacing: '0.05em',
};

const attendeesSection = {
  backgroundColor: '#18181B',
  border: '1px solid #27272A',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const attendeeText = {
  color: '#D4D4D8',
  fontSize: '14px',
  margin: '8px 0 0 0',
};

const notesSection = {
  marginBottom: '24px',
};

const notesText = {
  color: '#A1A1AA',
  fontSize: '14px',
  lineHeight: '24px',
  fontStyle: 'italic',
  marginTop: '8px',
  padding: '16px',
  borderLeft: '4px solid #4F46E5', // Erani Purple
  backgroundColor: '#18181B',
};

const linkedTasksSection = {
  marginBottom: '24px',
};

const taskCard = {
  marginTop: '8px',
  marginBottom: '8px',
  padding: '12px 16px',
  backgroundColor: '#18181B',
  borderLeft: '4px solid #2563EB',
  borderRadius: '0 8px 8px 0',
};

const taskTitle = {
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0',
};

const taskNotes = {
  color: '#A1A1AA',
  fontSize: '12px',
  marginTop: '4px',
  marginBottom: '0',
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

const calendarLinks = {
  textAlign: 'center' as const,
  backgroundColor: '#18181B',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid #27272A',
  marginBottom: '24px',
};

const calText = {
  color: '#8A8F98',
  fontSize: '12px',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const calLink = {
  color: '#2563EB',
  fontSize: '14px',
  fontWeight: '700',
  textDecoration: 'none',
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

export default SessionInviteEmail;
