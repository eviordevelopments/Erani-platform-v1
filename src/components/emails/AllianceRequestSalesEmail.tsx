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

interface AllianceRequestSalesEmailProps {
  companyName: string;
  serviceName: string;
  valueProposition: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  sessionLink: string;
}

export const AllianceRequestSalesEmail = ({
  companyName,
  serviceName,
  valueProposition,
  contactName,
  contactEmail,
  contactPhone,
  sessionLink
}: AllianceRequestSalesEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Nueva Solicitud de Alianza Estratégica: {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nueva Solicitud de Alianza</Heading>
          
          <Text style={text}>
            Un nuevo prospecto ha solicitado unirse al ecosistema de <strong>ERANI Services+</strong>.
          </Text>

          <Section style={dataSection}>
            <Text style={dataField}><strong>Empresa:</strong> {companyName}</Text>
            <Text style={dataField}><strong>Servicio/Software:</strong> {serviceName}</Text>
            <Text style={dataField}><strong>Propuesta de Valor:</strong></Text>
            <Text style={blockText}>{valueProposition}</Text>
          </Section>

          <Hr style={hr} />

          <Section style={dataSection}>
            <Heading as="h3" style={h3}>Datos de Contacto</Heading>
            <Text style={dataField}><strong>Nombre:</strong> {contactName}</Text>
            <Text style={dataField}><strong>Email:</strong> <Link href={`mailto:${contactEmail}`} style={link}>{contactEmail}</Link></Text>
            <Text style={dataField}><strong>Teléfono:</strong> {contactPhone}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Link href={sessionLink} style={button}>
              Ver Sesión en ERANI
            </Link>
          </Section>

          <Text style={footer}>
            Notificación automática de ERANI Platform.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AllianceRequestSalesEmail;

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
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 20px',
};

const h3 = {
  color: '#444',
  fontSize: '18px',
  margin: '0 0 10px',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const dataSection = {
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
};

const dataField = {
  color: '#333',
  fontSize: '15px',
  margin: '0 0 8px',
};

const blockText = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  backgroundColor: '#fff',
  padding: '12px',
  borderRadius: '4px',
  borderLeft: '4px solid #4a90e2',
};

const hr = {
  borderColor: '#eaeaea',
  margin: '20px 0',
};

const link = {
  color: '#4a90e2',
  textDecoration: 'none',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '14px 24px',
  display: 'inline-block',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '30px',
};
