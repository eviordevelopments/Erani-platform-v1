import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface CustomFlowEmailProps {
  userName: string;
  userEmail: string;
  projectName: string;
  operationDetails: string;
  automationName: string;
  description: string;
  nodes?: string[];
}

export default function CustomFlowEmail({
  userName = "Usuario",
  userEmail = "usuario@erani.mx",
  projectName = "Sin proyecto",
  operationDetails = "Sin detalles",
  automationName = "Flujo Personalizado",
  description = "Sin descripción",
  nodes = [],
}: CustomFlowEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Solicitud de Ingeniería de Flujo: {automationName}</Preview>
      <Body style={{ backgroundColor: "#09090b", fontFamily: "Montserrat, sans-serif", padding: "20px 0" }}>
        <Container style={{ backgroundColor: "#18181b", padding: "40px", borderRadius: "12px", border: "1px solid #27272a", maxWidth: "600px" }}>
          
          <Section style={{ textAlign: "center", marginBottom: "30px" }}>
            <img src="https://platform.erani.mx/eanilogo.png" alt="ERANI Logo" width="100" style={{ margin: "0 auto", opacity: 0.8 }} />
          </Section>

          <Heading style={{ color: "#ffffff", fontSize: "24px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", textAlign: "center" }}>
            Solicitud de Flujo Automatizado
          </Heading>
          <Text style={{ color: "#a1a1aa", fontSize: "14px", textAlign: "center", marginBottom: "30px" }}>
            Se ha recibido una nueva solicitud de ingeniería forense y automatización por parte del usuario <strong style={{color:"#ffffff"}}>{userName}</strong> ({userEmail}).
          </Text>

          <Hr style={{ borderColor: "#27272a", marginBottom: "30px" }} />

          <Section style={{ marginBottom: "20px" }}>
            <Text style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "5px" }}>Automatización Recomendada</Text>
            <Text style={{ color: "#ffffff", fontSize: "16px", margin: "0 0 20px 0" }}>{automationName}</Text>

            <Text style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "5px" }}>Proyecto o Colección Vinculada</Text>
            <Text style={{ color: "#ffffff", fontSize: "16px", margin: "0 0 20px 0" }}>{projectName}</Text>

            <Text style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "5px" }}>Operación</Text>
            <Text style={{ color: "#ffffff", fontSize: "16px", margin: "0 0 20px 0" }}>{operationDetails}</Text>

            <Text style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "5px" }}>Nodos y Herramientas a Integrar</Text>
            {nodes && nodes.length > 0 ? (
              <div style={{ margin: "0 0 20px 0" }}>
                {nodes.map((node, i) => (
                  <span key={i} style={{ display: "inline-block", backgroundColor: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.4)", color: "#c4b5fd", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", marginRight: "8px", marginBottom: "8px" }}>
                    {node}
                  </span>
                ))}
              </div>
            ) : (
              <Text style={{ color: "#71717a", fontSize: "14px", margin: "0 0 20px 0", fontStyle: "italic" }}>Ningún nodo seleccionado.</Text>
            )}

            <Text style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "5px" }}>Descripción / Requerimientos Específicos</Text>
            <Text style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: "1.6", margin: "0", backgroundColor: "#09090b", padding: "15px", borderRadius: "8px", border: "1px solid #27272a" }}>
              {description}
            </Text>
          </Section>

          <Hr style={{ borderColor: "#27272a", marginTop: "30px", marginBottom: "30px" }} />

          <Text style={{ color: "#a1a1aa", fontSize: "12px", textAlign: "center" }}>
            Este es un correo automático generado por <strong style={{color:"#ffffff"}}>ERANI AI Forensics System</strong>.<br/>
            El Project Manager y el Equipo de Ingeniería se pondrán en contacto a la brevedad.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
