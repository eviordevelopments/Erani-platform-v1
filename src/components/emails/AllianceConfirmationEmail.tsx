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
  Hr
} from '@react-email/components';

interface AllianceConfirmationEmailProps {
  contactName: string;
  companyName: string;
  sessionLink: string;
}

export const AllianceConfirmationEmail = ({
  contactName,
  companyName,
  sessionLink
}: AllianceConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Hemos recibido tu solicitud de alianza para {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>ERANI Services+</Heading>
          
          <Text style={text}>
            Hola <strong>{contactName}</strong>,
          </Text>

          <Text style={text}>
            Hemos recibido correctamente tu postulación para integrar a <strong>{companyName}</strong> en nuestro ecosistema de alianzas estratégicas y herramientas corporativas.
          </Text>

          <Text style={text}>
            Nuestro equipo evaluará tu propuesta de valor y su potencial impacto para nuestra red de clientes AAA. Para dar seguimiento a esta colaboración, hemos creado una sesión interactiva donde tu Project Manager asignado (Diego Arredondo) estará en contacto contigo.
          </Text>

          <Section style={buttonContainer}>
            <Link href={sessionLink} style={button}>
              Acceder a mi Sesión de Proyecto
            </Link>
          </Section>

          <Text style={text}>
            También puedes responder directamente a este correo si tienes alguna duda adicional.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            <strong>Erani Platform</strong><br />
            Impulsando ecosistemas de alto valor.<br />
            <Link href="https://erani.co" style={link}>erani.co</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AllianceConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
  maxWidth: '600px',
};

const h1 = {
  color: '#4f46e5',
  fontSize: '24px',
  fontWeight: 'black',
  padding: '0',
  margin: '0 0 20px',
  textAlign: 'center' as const,
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px',
};

const hr = {
  borderColor: '#eaeaea',
  margin: '30px 0',
};

const link = {
  color: '#4f46e5',
  textDecoration: 'none',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '35px 0',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '16px 28px',
  display: 'inline-block',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
  lineHeight: '20px',
};
