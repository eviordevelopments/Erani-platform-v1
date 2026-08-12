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

interface DataRoomInviteEmailProps {
  dataRoomName: string;
  dataRoomDesc?: string;
  collectionName?: string;
  inviterName?: string;
  inviterRole?: string;
  inviterAvatarUrl?: string;
  organizationName?: string;
  dataRoomUrl?: string;
}

export const DataRoomInviteEmail: React.FC<DataRoomInviteEmailProps> = ({
  dataRoomName,
  dataRoomDesc,
  collectionName,
  inviterName = 'El Administrador',
  inviterRole = 'Administrador',
  inviterAvatarUrl = 'https://ctgizovelvkzahbmxwgc.supabase.co/storage/v1/object/public/public_access/default-avatar.png',
  organizationName = 'ERANI',
  dataRoomUrl = 'https://platform.erani.mx/collections',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Invitación a Data Room: {dataRoomName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img 
              src="https://platform.erani.mx/eanilogo.png" 
              width="150" 
              alt="ERANI Platform" 
              style={logoImg} 
            />
            <Text style={headerSubtitle}>Análisis Forense y Colaboración</Text>
          </Section>

          <Section style={bodySection}>
            <Heading style={title}>Has sido invitado a un nuevo Data Room</Heading>
            
            <Text style={text}>
              Hola, esperamos que te encuentres excelente. 
              <br /><br />
              Te notificamos que <strong>{inviterName}</strong>, {inviterRole} a cargo, 
              te ha dado acceso exclusivo para colaborar en el Data Room <strong>{dataRoomName}</strong> perteneciente a {organizationName}.
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
                <span style={detailLabel}>📈 Data Room:</span> {dataRoomName}
              </Text>
              {collectionName && (
                <Text style={detailItem}>
                  <span style={detailLabel}>📁 Colección Base:</span> {collectionName}
                </Text>
              )}
            </Section>

            {dataRoomDesc && (
              <Section style={notesSection}>
                <Text style={detailLabel}>Objetivo Estratégico:</Text>
                <Text style={notesText}>{dataRoomDesc}</Text>
              </Section>
            )}

            <Section style={buttonContainer}>
              <Link href={dataRoomUrl} style={button}>
                Ingresar al Data Room
              </Link>
            </Section>

            <Text style={text}>
              Recuerda que dentro del Data Room podrás analizar auditorías interconectadas, revisar reportes forenses y descubrir patrones de fuga en conjunto con tu equipo.
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
              <Link href="mailto:contacto@erani.mx" style={footerLink}>contacto@erani.mx</Link>
              <br />
              Aviso legal: ERANI es una herramienta de análisis de datos. Toda la información es confidencial.
              <br />
              © 2026 Erani Financial Systems. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = { backgroundColor: '#0A0A0B', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' };
const container = { margin: '0 auto', padding: '20px 0 48px', width: '100%', maxWidth: '750px' };
const header = { padding: '30px 40px 20px', backgroundColor: '#0F0F13', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', borderBottom: '1px solid #1E1E24', textAlign: 'center' as const };
const logoImg = { margin: '0 auto', display: 'block' };
const headerSubtitle = { color: '#8A8F98', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.2em', marginTop: '16px', marginBottom: '0' };
const bodySection = { padding: '40px', backgroundColor: '#0F0F13', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', border: '1px solid #1E1E24', borderTop: 'none' };
const title = { color: '#FFFFFF', fontSize: '22px', fontWeight: '800', margin: '0 0 24px', textAlign: 'left' as const };
const text = { color: '#D4D4D8', fontSize: '14px', lineHeight: '24px', marginBottom: '24px' };
const pmCard = { backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '12px', padding: '16px', marginBottom: '24px' };
const pmAvatar = { borderRadius: '50%', border: '2px solid #7404FF', objectFit: 'cover' as const };
const pmName = { color: '#FFFFFF', fontSize: '16px', fontWeight: '800', margin: '0 0 4px 0' };
const pmRole = { color: '#8A8F98', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0' };
const detailsCard = { backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '12px', padding: '24px', marginBottom: '24px' };
const detailItem = { margin: '0 0 12px 0', color: '#FFFFFF', fontSize: '14px' };
const detailLabel = { color: '#8A8F98', fontWeight: '700', textTransform: 'uppercase' as const, fontSize: '12px', letterSpacing: '0.05em' };
const notesSection = { marginBottom: '24px' };
const notesText = { color: '#A1A1AA', fontSize: '14px', lineHeight: '24px', fontStyle: 'italic', marginTop: '8px', padding: '16px', borderLeft: '4px solid #7404FF', backgroundColor: '#18181B' };
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' };
const button = { backgroundColor: '#7404FF', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', fontWeight: '800', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 28px', textTransform: 'uppercase' as const, letterSpacing: '0.1em', boxShadow: '0 0 20px rgba(116, 4, 255, 0.4)' };
const hr = { borderColor: '#27272A', margin: '32px 0' };
const footer = { textAlign: 'center' as const };
const footerText = { color: '#71717A', fontSize: '12px', lineHeight: '20px' };
const footerLink = { color: '#A1A1AA', textDecoration: 'underline' };

export default DataRoomInviteEmail;
