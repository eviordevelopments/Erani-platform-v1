-- Seed the erani_services table with initial mock data

INSERT INTO public.erani_services (title, description, service_type, provider_name, logo_url, features, status)
VALUES 
(
    'Cloud Infrastructure & Storage', 
    'Acelera el despliegue de infraestructura corporativa con la red global de servidores y almacenamiento de AWS.', 
    'additional', 
    'Amazon Web Services', 
    'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg', 
    '["Almacenamiento S3", "Cómputo EC2", "Bases de datos RDS", "Soporte Enterprise 24/7"]'::jsonb, 
    'active'
),
(
    'CRM & Sales Analytics', 
    'Plataforma líder global para la gestión de relaciones con clientes, proyecciones de ventas y automatización comercial.', 
    'strategy', 
    'Salesforce', 
    'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg', 
    '["Sales Cloud", "Service Cloud", "Análisis Predictivo Einstein", "Integración API"]'::jsonb, 
    'active'
),
(
    'ERP & Enterprise Management', 
    'Optimiza los recursos financieros, operativos y de cadena de suministro con el ERP industrial más robusto.', 
    'maximization', 
    'SAP', 
    'https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg', 
    '["Gestión Financiera", "Supply Chain", "SAP HANA Analytics", "Operaciones Industriales"]'::jsonb, 
    'active'
),
(
    'Work OS & Productivity', 
    'Gestiona todo el flujo operativo de tu empresa, proyectos, campañas y CRM en un solo espacio de trabajo visual.', 
    'additional', 
    'Monday.com', 
    'https://upload.wikimedia.org/wikipedia/commons/e/ec/Monday_logo.svg', 
    '["Gestión de Proyectos", "Automatizaciones Nativas", "Dashboards Ejecutivos", "Plantillas Ágiles"]'::jsonb, 
    'active'
),
(
    'Quantum Revenue Maximizer', 
    'Algoritmos predictivos propietarios para identificar fugas de ingresos en tiempo real y maximizar el LTV.', 
    'maximization', 
    'Nexus AI Lab', 
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png', 
    '["Análisis LTV", "Identificación de Fugas", "Algoritmos Quantum", "Reportes en Tiempo Real"]'::jsonb, 
    'active'
),
(
    'Enterprise Productivity Suite', 
    'Colaboración empresarial integral con herramientas de ofimática, reuniones y almacenamiento en la nube.', 
    'strategy', 
    'Microsoft 365', 
    'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg', 
    '["Teams", "Sharepoint", "Copilot AI", "Seguridad Avanzada"]'::jsonb, 
    'active'
);
