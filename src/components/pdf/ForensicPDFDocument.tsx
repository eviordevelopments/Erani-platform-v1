import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image, Svg, Rect, Path, Circle } from '@react-pdf/renderer';
import type { ForensicReportData } from '@/app/forensic/page';

// Registro de fuentes Montserrat con URLs robustas
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCvC70w-.ttf', fontWeight: 900 },
  ]
});

const colors = {
  background: '#050505',
  surface: '#0D0D0D',
  surfaceLight: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#666666',
  border: '#222222',
  purple: '#9E80FF',
  coral: '#FF5E5E',
  blue: '#0055A0',
  emerald: '#10B981',
  accent: '#9E80FF'
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: 'Montserrat',
    padding: 30,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 15,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eraniLogo: {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 2,
    color: colors.text,
  },
  headerInfo: {
    textAlign: 'right',
  },
  projectName: {
    fontSize: 10,
    fontWeight: 900,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reportType: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 10,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 900,
    textTransform: 'uppercase',
    color: colors.text,
    marginBottom: 5,
  },
  slideSubtitle: {
    fontSize: 9,
    color: colors.accent,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 25,
  },
  grid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    opacity: 0.05,
  },
  label: {
    fontSize: 7,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: 900,
    letterSpacing: 1,
    marginBottom: 5,
  },
  value: {
    fontSize: 22,
    fontWeight: 900,
    color: colors.text,
  },
  valueSub: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: 700,
  },
  highlight: {
    color: colors.accent,
  },
  coralHighlight: {
    color: colors.coral,
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    padding: 8,
    borderRadius: 6,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  tableCell: {
    fontSize: 8,
    color: colors.text,
  },
  tableCellMuted: {
    fontSize: 8,
    color: colors.textMuted,
  },
  chartContainer: {
    height: 120,
    width: '100%',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  legend: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  }
});

// --- Helper Components ---

const MetricCard = ({ label, value, subValue, color = colors.text, style = {} }: { label: string; value: string | number; subValue?: string; color?: string; style?: any }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardGlow} />
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
    {subValue && <Text style={styles.valueSub}>{subValue}</Text>}
  </View>
);

const BarChart = ({ data, color = colors.accent }: { data: { month: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map((d: { value: number }) => d.value), 1);
  return (
    <View style={styles.chartContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 10 }}>
        {data.map((d: { month: string; value: number }, i: number) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ 
              width: '100%', 
              height: `${(d.value / max) * 90}%`, 
              backgroundColor: color, 
              borderRadius: 4,
              opacity: 0.8 
            }} />
            <Text style={{ fontSize: 6, marginTop: 4, color: colors.textMuted, textTransform: 'uppercase' }}>{d.month}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const LineChart = ({ data, color = colors.accent }: { data: { month: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map((d: { value: number }) => d.value), 1);
  const points = data.map((d: { value: number }, i: number) => ({
    x: (i / (data.length - 1)) * 400,
    y: 100 - (d.value / max) * 100
  }));

  const pathData = points.map((p: { x: number; y: number }, i: number) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <View style={styles.chartContainer}>
      <Svg height="100" width="100%">
        <Path d={pathData} stroke={color} strokeWidth="2" fill="none" />
        {points.map((p: { x: number; y: number }, i: number) => (
          <Circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
        {data.map((d: { month: string }, i: number) => (
          <Text key={i} style={{ fontSize: 6, color: colors.textMuted }}>{d.month}</Text>
        ))}
      </View>
    </View>
  );
};

const formatCurrency = (val: number) => {
  return `$${val.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;
};

// --- Main Document ---

export default function ForensicPDFDocument({ data }: { data: ForensicReportData }) {
  const Header = () => (
    <View style={styles.header} fixed>
      <View style={styles.logoSection}>
        {/* Placeholder for Logo - in a real app, use Image with base64 or absolute URL */}
        <View style={{ width: 30, height: 30, backgroundColor: colors.accent, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.background, fontSize: 14, fontWeight: 900 }}>E</Text>
        </View>
        <Text style={styles.eraniLogo}>ERANI</Text>
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.projectName}>{data.projectName}</Text>
        <Text style={styles.reportType}>Audit Protocol v2.4</Text>
      </View>
    </View>
  );

  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Profitability Firewall | High-Fidelity Forensic Analytics</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Documento Confidencial | Slide ${pageNumber} de ${totalPages}`} />
    </View>
  );

  return (
    <Document title={`ERANI_FORENSIC_${data.projectName}`} author="ERANI Intelligence">
      
      {/* Slide 1: Executive Scorecard */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header />
        <View style={styles.content}>
          <Text style={styles.slideTitle}>Executive Scorecard</Text>
          <Text style={styles.slideSubtitle}>Resumen de Impacto Financiero y Operativo</Text>

          <View style={styles.grid}>
            <MetricCard 
              label="Impacto Directo" 
              value={formatCurrency(data.impactoDirecto)} 
              subValue="Fuga de capital confirmada por auditoría" 
              color={colors.coral} 
              style={{ flex: 2 }}
            />
            <MetricCard 
              label="Scope Creep" 
              value={`${data.scopeCreep}%`} 
              subValue="Desviación de alcance operativo" 
              color={colors.accent} 
            />
          </View>

          <View style={styles.grid}>
            <MetricCard 
              label="Riesgo Latente" 
              value={formatCurrency(data.impactoFuturo)} 
              subValue="Impacto proyectado mensual sin intervención" 
            />
            <MetricCard 
              label="COI (Cost of Inaction)" 
              value={formatCurrency(data.coiAnual)} 
              subValue="Costo de inacción anualizado" 
              color={colors.purple}
            />
            <MetricCard 
              label="Point of Consciousness" 
              value={formatCurrency(data.rentabilidadPoint)} 
              subValue="Umbral de rentabilidad óptima" 
            />
          </View>
        </View>
        <Footer />
      </Page>

      {/* Slide 2: Forensic Analysis */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header />
        <View style={styles.content}>
          <Text style={styles.slideTitle}>Forensic Analysis</Text>
          <Text style={styles.slideSubtitle}>Identificación de Fugas por Ticket/Evento</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.label, { flex: 1, marginBottom: 0 }]}>Ticket ID</Text>
              <Text style={[styles.label, { flex: 4, marginBottom: 0 }]}>Descripción de la Fuga</Text>
              <Text style={[styles.label, { flex: 1, marginBottom: 0 }]}>Categoría</Text>
              <Text style={[styles.label, { flex: 1, marginBottom: 0, textAlign: 'right' }]}>Hrs</Text>
              <Text style={[styles.label, { flex: 1.5, marginBottom: 0, textAlign: 'right' }]}>Costo Invisible</Text>
            </View>
            {data.tickets.slice(0, 8).map((t, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCellMuted, { flex: 1, fontWeight: 900 }]}>{t.id}</Text>
                <Text style={[styles.tableCell, { flex: 4 }]}>{t.description}</Text>
                <Text style={[styles.tableCellMuted, { flex: 1 }]}>{t.filter}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{t.hrs.toFixed(1)}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', color: colors.coral, fontWeight: 700 }]}>{formatCurrency(t.cost)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.grid, { marginTop: 20 }]}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.label}>Consolidación de Fugas</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <Text style={styles.tableCell}>Fuga Externa:</Text>
                <Text style={[styles.tableCell, { fontWeight: 900 }]}>{formatCurrency(data.resumenConsolidacion.fugaExterna)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <Text style={styles.tableCell}>Fuga Interna:</Text>
                <Text style={[styles.tableCell, { fontWeight: 900 }]}>{formatCurrency(data.resumenConsolidacion.fugaInterna)}</Text>
              </View>
            </View>
            <View style={[styles.card, { flex: 2 }]}>
              <Text style={styles.label}>Estado del Inventario</Text>
              <Text style={[styles.tableCell, { fontSize: 9, lineHeight: 1.4 }]}>{data.resumenConsolidacion.estadoInventario}</Text>
            </View>
          </View>
        </View>
        <Footer />
      </Page>

      {/* Slide 3: Operational Health */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header />
        <View style={styles.content}>
          <Text style={styles.slideTitle}>Operational Health</Text>
          <Text style={styles.slideSubtitle}>Métricas de Eficiencia y Datos Oscuros</Text>

          <View style={styles.grid}>
            <View style={[styles.card, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.label}>Bucle de Revisiones</Text>
              <View style={{ position: 'relative', width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
                <Svg height="80" width="80" style={{ position: 'absolute' }}>
                  <Circle cx="40" cy="40" r="35" stroke={colors.surfaceLight} strokeWidth="6" fill="none" />
                  <Path 
                    d={`M 40 5 A 35 35 0 ${data.kpiRevisiones > 50 ? 1 : 0} 1 ${40 + 35 * Math.sin(data.kpiRevisiones * 0.0628)} ${40 - 35 * Math.cos(data.kpiRevisiones * 0.0628)}`} 
                    stroke={colors.accent} 
                    strokeWidth="6" 
                    fill="none" 
                  />
                </Svg>
                <Text style={{ fontSize: 18, fontWeight: 900 }}>{data.kpiRevisiones}%</Text>
              </View>
              <Text style={[styles.valueSub, { textAlign: 'center', marginTop: 10 }]}>Ceguera Operativa Detectada</Text>
            </View>

            <View style={{ flex: 2, gap: 15 }}>
              <View style={styles.card}>
                <Text style={styles.label}>Fricción de Talento</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.value}>{data.kpiFriccionTalento}%</Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${data.kpiFriccionTalento}%`, height: '100%', backgroundColor: colors.purple }} />
                  </View>
                </View>
              </View>
              <View style={styles.card}>
                <Text style={styles.label}>Dark Data Index</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.value}>{data.kpiDarkData}%</Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${data.kpiDarkData}%`, height: '100%', backgroundColor: colors.coral }} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Análisis de Ceguera Operativa</Text>
            <Text style={[styles.tableCell, { fontSize: 9, lineHeight: 1.5 }]}>{data.cegueraOperativa}</Text>
          </View>
        </View>
        <Footer />
      </Page>

      {/* Slide 4: Firewall Strategy */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header />
        <View style={styles.content}>
          <Text style={styles.slideTitle}>Profitability Firewall</Text>
          <Text style={styles.slideSubtitle}>Estrategia de Blindaje y Recuperación</Text>

          <View style={styles.grid}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.label}>ROI de Intervención</Text>
              <Text style={[styles.value, { color: colors.emerald }]}>{data.firewallRoi} Días</Text>
              <Text style={styles.valueSub}>Tiempo estimado para retorno de inversión</Text>
              
              <Text style={[styles.label, { marginTop: 20 }]}>Protocolos de Bloqueo</Text>
              <Text style={[styles.tableCell, { fontSize: 8, lineHeight: 1.4 }]}>{data.firewallProtocolos}</Text>
            </View>

            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.label}>Evolución Proyectada de Margen</Text>
              <LineChart data={data.margenEvolucion.map(m => ({ month: m.month, value: parseInt(m.value) }))} />
              <View style={styles.legend}>
                {data.margenEvolucion.map((m, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                    <Text style={{ fontSize: 6, color: colors.textMuted }}>{m.month}: +{m.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Proyección de Impacto Mensual</Text>
            <BarChart data={data.firewallImpact} />
          </View>
        </View>
        <Footer />
      </Page>

      {/* Slide 5: Technical Annex */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header />
        <View style={styles.content}>
          <Text style={styles.slideTitle}>Technical Annex</Text>
          <Text style={styles.slideSubtitle}>Sustento Metodológico y Glosario</Text>

          <View style={styles.grid}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.label}>Frameworks de Auditoría</Text>
              {data.anexoFrameworks.map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
                  <Text style={{ color: colors.accent, fontSize: 10 }}>•</Text>
                  <Text style={[styles.tableCell, { lineHeight: 1.3 }]}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.label}>Glosario de Términos Forenses</Text>
              {data.anexoGlosario.map((g, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
                  <Text style={{ color: colors.coral, fontSize: 10 }}>•</Text>
                  <Text style={[styles.tableCell, { lineHeight: 1.3 }]}>{g}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 20, padding: 15, backgroundColor: colors.surfaceLight, borderRadius: 10 }}>
            <Text style={[styles.label, { color: colors.text }]}>Validación del Motor de Inferencia</Text>
            <Text style={[styles.tableCellMuted, { fontSize: 7, lineHeight: 1.4 }]}>
              Este reporte ha sido generado utilizando el Motor de Inferencia Forense de Nivel 2 de ERANI. 
              Los cálculos de "Costo Invisible" y "Fuga de Capital" se basan en la triangulación de metadata operativa, 
              registros de ejecución y patrones de latencia. La precisión de este informe está sujeta a la integridad 
              de los datos proporcionados durante la fase de ingesta.
            </Text>
          </View>
        </View>
        <Footer />
      </Page>

    </Document>
  );
}
