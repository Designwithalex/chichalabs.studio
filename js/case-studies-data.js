/* ============================================================
   ChichaLabs Studio — Case Studies CMS
   Fuente de verdad para todos los proyectos.
   Editar aquí para actualizar los datos en index.html y case-study.html
   ============================================================ */

const CASE_STUDIES = [

  /* -------------------------------------------------------
     1. PACTO ESTUDIO
  ------------------------------------------------------- */
  {
    slug: 'pacto-estudio',
    client: 'Pacto Estudio',
    emoji: '🏦',
    title: 'Website MVP & Scalable Portfolio',
    subtitle: 'De Wix desactualizado a portfolio de arquitectura de primer nivel',
    url: 'https://pactoestudio.com',
    urlLabel: 'pactoestudio.com',
    showInHome: true,
    category: 'Web & Portfolio',
    industry: 'Arquitectura',
    tags: ['Web comercial', 'Portfolio', 'PHP', 'UX/UI Design'],
    theme: 'architecture',
    accent: '#C4A882',
    accentDark: '#8B6F4E',
    bgDark: '#0F0E0C',
    snippet: 'Portfolio interactivo moderno para estudio de arquitectura. MVP en 1 semana para la expo de Milán, luego escala en PHP con panel admin propio.',
    overview: 'Pacto Estudio es un estudio de arquitectura que necesitaba un portfolio interactivo moderno para mostrar sus proyectos. El objetivo era lanzar rápido —asistían a una expo de arquitectura en <strong>Milán</strong>— para validar la dirección con clientes, y luego escalar la plataforma sin la complejidad de un backend personalizado.',
    role: 'Lead Designer & Developer',
    responsibilities: [
      'UX/UI Design',
      'Front-End Development (HTML, CSS, JS, PHP)',
      'Integración con Sheet.best (Google Sheets como backend liviano)',
      'Media hosting con Cloudinary',
      'Diseño e implementación de panel admin personalizado'
    ],
    tools: ['Figma', 'HTML / CSS / JS', 'PHP', 'Sheet.best', 'Cloudinary'],
    problem: 'El estudio necesitaba un lanzamiento rápido manteniendo un camino claro hacia la escalabilidad futura. El desafío era balancear time-to-market y buen diseño, con una configuración técnica flexible que evitara infraestructura pesada.',
    constraints: 'Deadline ajustado para la expo de Milán. Presupuesto limitado. Proyecto ejecutado como trabajo adicional con tiempo escaso. Complejidad bajo control.',
    solutionIntro: 'Un enfoque en dos etapas garantizó velocidad y sostenibilidad:',
    solutionItems: [
      { title: 'Rapid MVP', desc: 'Google Sheets como "base de datos" liviana via Sheet.best. Cloudinary para medios. El equipo podía agregar proyectos e imágenes sin depender de desarrollo.' },
      { title: 'Implementación escalable', desc: 'Reemplazamos Sheet.best y Cloudinary por PHP + panel admin personalizado para mejorar la performance, la gestión de contenido y la mantenibilidad a largo plazo.' }
    ],
    process: [
      { num: '01', title: 'Entender el objetivo', desc: 'El cliente tenía un sitio en Wix desactualizado. Recopilamos referencias de sitios de arquitectura de primer nivel para alinear rápidamente la arquitectura de información y el estilo visual.' },
      { num: '02', title: 'Inspiración y dirección', desc: 'Rustarch.com como inspiración principal para guiar el comportamiento UI, interacciones de componentes y presentación de contenido, respetando el manual de marca de Pacto.' },
      { num: '03', title: 'Wireframing', desc: 'Wireframes rápidos para alinear con stakeholders antes del viaje a Milán. Reuniones presenciales para capturar la esencia de la marca. Sin prototipo por restricciones de tiempo.' },
      { num: '04', title: 'MVP: Sheets + Cloudinary', desc: 'Una semana para entregar un sitio funcional. El equipo podía editar contenido desde Google Sheets y subir imágenes directamente a Cloudinary. Se testeó el MVP en la segunda reunión con gran feedback.' },
      { num: '05', title: 'Escala: PHP + Panel Admin', desc: 'Post-Milán, reconstruimos el sitio en PHP con un panel admin personalizado. Performance mejorada, gestión de contenido optimizada. La v2 fue aprobada sin cambios adicionales.' }
    ],
    results: [
      'MVP entregado en ~1 semana para validación antes de la expo de Milán',
      'Autonomía de contenido desde el día uno (v1 via Sheets → v2 via PHP + Admin)',
      'Performance mejorada y eliminación de dependencias externas en v2',
      'Alta satisfacción del cliente: v2 aprobada sin cambios adicionales'
    ],
    conclusion: 'No dejar que la urgencia borre los fundamentos: recordar siempre el proceso completo de diseño, especialmente mobile. El enfoque en dos etapas (MVP → build escalable) permitió lanzar rápido y consolidar lo que funcionaba. Con presupuestos y timelines ajustados, la infraestructura simple puede ser un puente poderoso hacia una solución robusta.',
    images: {
      hero: 'assets/cases/pacto-estudio/hero.jpg',
      gallery: [
        'assets/cases/pacto-estudio/01.jpg',
        'assets/cases/pacto-estudio/02.jpg',
        'assets/cases/pacto-estudio/03.jpg',
        'assets/cases/pacto-estudio/04.jpg',
        'assets/cases/pacto-estudio/05.jpg',
        'assets/cases/pacto-estudio/06.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     2. AGRIEDGE
  ------------------------------------------------------- */
  {
    slug: 'agriedge',
    client: 'Agriedge',
    emoji: '🧑🏻‍🌾',
    title: 'Digital Platform for Soil Trials',
    subtitle: 'Plataforma digital para gestión de ensayos de suelo en agritech',
    url: 'https://www.trialedge.agriedge.ma/',
    urlLabel: 'trialedge.agriedge.ma',
    showInHome: true,
    category: 'Producto Digital',
    industry: 'Agritech',
    tags: ['UX/UI', 'Product Design', 'Dashboard', 'Mobile App'],
    theme: 'agritech',
    accent: '#40C074',
    accentDark: '#1B7A3E',
    bgDark: '#060F06',
    snippet: 'Plataforma web + app móvil para gestión de ensayos de suelo en agronegocios. Proceso completo de UX en un mes: research con agrónomos, wireframes, prototipos hi-fi y handoff.',
    overview: 'Trial Edge es una plataforma digital para ensayos de suelo y productos en la industria agritech. Ayuda a agricultores, gestores de campo y agronegocios a testear cómo diferentes productos se desempeñan en las mismas secciones de suelo — fertilizantes, herbicidas o nuevos productos en el mercado. El cliente fue Agriedge, quienes contrataron a nuestro equipo para crear el producto <strong>desde cero</strong>.',
    role: 'Senior Product Designer',
    responsibilities: [
      'Investigación con agrónomos y stakeholders',
      'Definición de flujos de usuario, wireframes y prototipos',
      'Liderazgo de iteraciones en casos de uso del gestor de ensayos de campo',
      'Diseño de prototipos hi-fi y preparación del handoff al equipo de desarrollo'
    ],
    tools: ['Figma', 'FigJam', 'Google Meet', 'Slack', 'ChatGPT (research support)', 'Untitled UI library'],
    problem: 'Los ensayos de campo son lentos, costosos y complejos. Los resultados suelen estar dispersos, son difíciles de confiar y complicados de comparar. Esto genera incertidumbre para los agricultores y frena la adopción de productos para los agronegocios.',
    constraints: 'Solo un mes para ejecutar el proceso completo de diseño. Producto completamente nuevo que requería comprender vocabulario científico y metodologías de ensayo. Equipo cross-funcional pequeño con reuniones diarias para mantener el alineamiento.',
    solutionIntro: 'Una plataforma web (desktop + tablet) con app móvil complementaria:',
    solutionItems: [
      { title: 'Visualización de datos', desc: 'Comparaciones lado a lado de productos en las mismas condiciones de suelo, con resultados claros y accionables.' },
      { title: 'Flujos mobile-friendly', desc: 'Para gestores en campo que necesitan herramientas simples y visuales bajo condiciones exigentes.' },
      { title: 'Reportes y alertas en tiempo real', desc: 'Para decisiones más rápidas y confiadas, descargables para compartir con stakeholders.' },
      { title: 'Flujos estandarizados', desc: 'Reduciendo errores humanos y aumentando la confianza en los resultados de los ensayos.' }
    ],
    process: [
      { num: '01', title: 'Entender el objetivo (Por qué)', desc: 'Colaboré con agrónomos y stakeholders. Trial Edge hace que los ensayos sean más rápidos, baratos y confiables, dando a agricultores y empresas datos claros para tomar decisiones y abrir nuevas oportunidades de mercado.' },
      { num: '02', title: 'Definir audiencia (Quién)', desc: 'Identificamos tres personas: Agricultores, Distribuidores y Gestores de Ensayos de Campo (usuario primario). Los gestores supervisan ensayos, registran datos y garantizan que los resultados sean utilizables. Son móviles, trabajan bajo presión de tiempo y necesitan herramientas visuales simples.' },
      { num: '03', title: 'Contexto del usuario (Dónde/Cuándo)', desc: 'En campo, moviéndose entre parcelas de prueba. Tiempo limitado, necesitan feedback en tiempo real. Plataforma principalmente mobile/tablet, a veces desktop. Frustrados por los retrasos, esperanzados por la claridad que puede traer la herramienta.' },
      { num: '04', title: 'Investigación y benchmarking', desc: 'Estudiamos herramientas internas existentes y referencias externas para entender puntos de dolor actuales, features faltantes y oportunidades de mejora de UX en el contexto agrícola.' },
      { num: '05', title: 'Wireframes y flujos', desc: 'Wireframes lo-fi de los flujos principales: creación de ensayos y visualización de resultados. Iteraciones sobre cómo definir/dibujar una sección de ensayo de campo y cómo visualizar comparaciones entre productos.' },
      { num: '06', title: 'Prototipos hi-fi y handoff', desc: 'Diseños hi-fi usando Untitled UI adaptada a las guías de marca de Agriedge (verde). Prototipos interactivos validados con usuarios reales. Wireflows (pantallas + notas backend) preparados para el equipo de desarrollo.' }
    ],
    results: [
      'Diseño de producto validado y listo para desarrollo',
      'Flujos claros para creación y comparación de ensayos, testeados con usuarios reales',
      'Fuerte alineación con objetivos de negocio: validación más rápida de productos y mayor confianza',
      'Developer-ready: wireflows + prototipos interactivos reducen la ambigüedad en implementación'
    ],
    conclusion: 'Trial Edge demuestra cómo el design thinking puede simplificar procesos científicos en agricultura. La plataforma reduce la complejidad de los ensayos, ahorrando tiempo y dinero mientras aumenta la confianza en los datos. Con los ensayos de campo como piedra angular del agritech, Trial Edge posiciona a Agriedge como innovador en agricultura digital.',
    images: {
      hero: 'assets/cases/agriedge/hero.jpg',
      gallery: [
        'assets/cases/agriedge/01.jpg',
        'assets/cases/agriedge/02.jpg',
        'assets/cases/agriedge/03.jpg',
        'assets/cases/agriedge/04.jpg',
        'assets/cases/agriedge/05.jpg',
        'assets/cases/agriedge/06.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     3. PATAGONIA BERRIES
  ------------------------------------------------------- */
  {
    slug: 'patagonia-berries',
    client: 'Patagonia Berries',
    emoji: '🍓',
    title: 'Authentic Digital Presence',
    subtitle: 'Identidad digital auténtica para marca de mermeladas artesanales',
    url: 'https://patagoniaberriesarg.com',
    urlLabel: 'patagoniaberriesarg.com',
    showInHome: true,
    category: 'Web & Branding',
    industry: 'Alimentos artesanales',
    tags: ['Diseño web', 'Identidad digital', 'HTML/CSS/JS', 'UX/UI'],
    theme: 'food-brand',
    accent: '#C44530',
    accentDark: '#8B2E1F',
    bgDark: '#1A0A00',
    snippet: 'Sitio web artesanal, storytelling-first para una marca de mermeladas de Patagonia. Diseño editorial con paleta de tonos tierra, implementado en HTML/CSS/JS.',
    overview: 'Patagonia Berries elabora <strong>mermeladas artesanales</strong> usando frutos premium de la Patagonia. La marca necesitaba un sitio web moderno y auténtico para mostrar sus productos y su historia, facilitando que los consumidores la descubrieran online y se conectaran con la calidad artesanal detrás de cada frasco. El proyecto llegó por recomendación del dueño de KIKE Coffee Shop.',
    role: 'Lead Designer & Developer',
    responsibilities: [
      'Definición de la identidad digital a través del diseño y la implementación',
      'Construcción de interfaz limpia, storytelling-driven, que destaca la autenticidad',
      'Desarrollo con layouts responsive y optimización de performance',
      'Diseño de secciones de showcase de productos'
    ],
    tools: ['Figma', 'Illustrator (brand elements & icons)', 'HTML / CSS / JS', 'Cursor (AI-assisted development)'],
    problem: 'A pesar de la calidad de sus productos, Patagonia Berries carecía de presencia digital. Esto dificultaba que los clientes descubrieran la marca y se conectaran con su historia artesanal. El desafío era crear un sitio que se sintiera <strong>natural y auténtico</strong>, mientras era intuitivo y fácil de navegar.',
    constraints: 'Proyecto con presupuesto limitado. La prioridad era destacar la autenticidad y el storytelling, en lugar de construir funcionalidades complejas. La marca debía sentirse premium pero accesible.',
    solutionIntro: 'El proyecto siguió un enfoque storytelling-first:',
    solutionItems: [
      { title: 'Lenguaje visual auténtico', desc: 'Paleta de colores naturales y tipografía elegante para reflejar el espíritu artesanal de la Patagonia.' },
      { title: 'Páginas centradas en productos', desc: 'Showcasing de cada variedad de mermelada con descripciones e imágenes de alta calidad.' },
      { title: 'Elementos de storytelling', desc: 'Sección "Nuestra Historia" para conectar emocionalmente con los consumidores y construir identidad de marca.' },
      { title: 'Implementación liviana', desc: 'Sitio construido con HTML, CSS y JS, asegurando performance y responsividad completa.' }
    ],
    process: [
      { num: '01', title: 'Entender la marca', desc: 'Me sumergí en la filosofía de producción artesanal. El diseño tenía que sentirse natural, premium y cercano al origen del producto: la Patagonia argentina.' },
      { num: '02', title: 'Diseño visual', desc: 'Creé una UI limpia y minimal usando tonos tierra, fuentes premium y generoso espacio en blanco para destacar la calidad de las mermeladas. Iteraciones en Figma con enfoque editorial.' },
      { num: '03', title: 'Showcase de productos', desc: 'Diseñé secciones dedicadas a cada variedad de mermelada, enfatizando los visuales y el storytelling descriptivo para hacer apetecible cada producto.' },
      { num: '04', title: 'Implementación', desc: 'El sitio fue construido con HTML, CSS y JS, usando Cursor como apoyo de desarrollo, asegurando una experiencia liviana, responsive y pulida.' }
    ],
    results: [
      'Percepción de marca más fuerte, asociando la presencia digital con la calidad artesanal',
      'Incremento de consultas de clientes a través del formulario de contacto',
      'Mayor visibilidad online, haciendo a Patagonia Berries descubrible por un público más amplio',
      'La presencia digital ahora alinea con la filosofía artesanal de la marca'
    ],
    conclusion: 'Traducir valores de marca auténticos a digital crea una conexión emocional más profunda con los consumidores. Incluso un sitio simple, orientado al storytelling, puede generar un impacto de negocio sólido. La presencia digital de Patagonia Berries ahora sienta las bases para el crecimiento futuro.',
    images: {
      hero: 'assets/cases/patagonia-berries/hero.jpg',
      gallery: [
        'assets/cases/patagonia-berries/01.jpg',
        'assets/cases/patagonia-berries/02.jpg',
        'assets/cases/patagonia-berries/03.jpg',
        'assets/cases/patagonia-berries/04.jpg',
        'assets/cases/patagonia-berries/05.jpg',
        'assets/cases/patagonia-berries/06.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     4. CHEMIKAL
  ------------------------------------------------------- */
  {
    slug: 'chemikal',
    client: 'Chemikal',
    emoji: '🧪',
    title: 'Website Redesign & Digital Strategy',
    subtitle: 'Rediseño completo de sitio web para empresa líder en productos de limpieza',
    url: 'https://chemikal.com.ar/',
    urlLabel: 'chemikal.com.ar',
    showInHome: false,
    category: 'Web & Strategy',
    industry: 'B2B / Limpieza industrial',
    tags: ['UX/UI', 'Redesign', 'Bootstrap', 'B2B', 'HTML/CSS/JS'],
    theme: 'b2b',
    accent: '#0A7AFF',
    accentDark: '#0055CC',
    bgDark: '#030B1A',
    snippet: 'Rediseño completo del sitio web de empresa líder en limpieza argentina: nueva identidad visual, arquitectura de información mejorada e implementación responsive con Bootstrap.',
    overview: '<strong>Chemikal</strong> es una empresa líder en productos de limpieza de Argentina. Su sitio web estaba desactualizado, difícil de navegar y no alineado con los objetivos de crecimiento de la empresa. El desafío era <strong>rediseñar y modernizar su presencia online</strong> para reflejar mejor la identidad de marca, mejorar la usabilidad y permitirles mostrar productos de manera más efectiva. El rediseño también apuntaba a soportar el <strong>crecimiento B2B</strong>, facilitando que los clientes naveguen y encuentren información técnica de productos.',
    role: 'UX/UI Designer & Front-End Developer',
    responsibilities: [
      'Desk research (benchmarking, heurísticas, personas)',
      'Definición de objetivos de rediseño y estrategia UX',
      'Diseño de flujos responsive y UI de alta fidelidad',
      'Desarrollo del sitio web'
    ],
    tools: ['Figma', 'FigJam', 'HTML / CSS / JS', 'Bootstrap', 'Google Meet', 'Slack'],
    problem: 'El sitio existente de Chemikal fallaba en: representar la identidad de marca moderna, proveer un sistema de navegación de productos claro, ofrecer una experiencia amigable en dispositivos móviles, y soportar conversaciones de venta B2B con información técnica relevante. Esto llevaba a mala usabilidad y oportunidades perdidas con clientes.',
    constraints: 'El rediseño debía completarse en un timeframe limitado para alinearse con campañas de marketing entrantes. La solución necesitaba ser escalable, permitiendo integración futura con e-commerce o portales B2B.',
    solutionIntro: 'Un rediseño completo estructurado en tres pilares:',
    solutionItems: [
      { title: 'Identidad de marca modernizada', desc: 'Diseño limpio alineado con las guías actualizadas de Chemikal. Fuerte jerarquía visual para destacar productos y categorías.' },
      { title: 'Arquitectura de información mejorada', desc: 'Catálogo de productos reorganizado por tipo y aplicación. Páginas de detalle claras con fichas técnicas disponibles para descarga.' },
      { title: 'Diseño responsive y escalable', desc: 'Implementación mobile-first con Bootstrap. Build front-end liviano y eficiente, listo para integración futura con e-commerce.' }
    ],
    process: [
      { num: '01', title: 'Research y benchmarking', desc: 'Análisis de competidores y referencias de la industria. Evaluación heurística del sitio antiguo de Chemikal. Definición de objetivos de rediseño y personas de usuario.' },
      { num: '02', title: 'Estrategia UX', desc: 'Creación de sitemap y flujos de categorización de productos. Definición de patrones de navegación para mejorar la descubribilidad de productos.' },
      { num: '03', title: 'Wireframes y prototipos', desc: 'Wireframes de baja fidelidad para validación temprana. Iteración hacia UI de alta fidelidad alineada con los colores y tipografía de marca.' },
      { num: '04', title: 'Desarrollo', desc: 'Implementación con HTML, CSS, JS y Bootstrap. Responsividad asegurada en desktop y mobile. Performance optimizada para tiempos de carga rápidos.' },
      { num: '05', title: 'Handoff y lanzamiento', desc: 'Entrega de sitio funcional y responsive listo para escalar hacia iniciativas digitales futuras.' }
    ],
    results: [
      'Sitio web moderno y responsive alineado con la identidad de marca de Chemikal',
      'Navegación mejorada, facilitando la exploración del catálogo de productos',
      'Base escalable para e-commerce B2B futuro',
      'Mayor confianza de stakeholders en la presencia digital de la empresa'
    ],
    conclusion: 'El rediseño de Chemikal fue tanto un proyecto de diseño como de desarrollo. Fortaleció la identidad digital de la empresa, simplificó la descubribilidad de productos y posicionó a Chemikal para expandirse hacia e-commerce B2B en el futuro.',
    images: {
      hero: 'assets/cases/chemikal/hero.jpg',
      gallery: [
        'assets/cases/chemikal/01.jpg',
        'assets/cases/chemikal/02.jpg',
        'assets/cases/chemikal/03.jpg',
        'assets/cases/chemikal/04.jpg',
        'assets/cases/chemikal/05.jpg',
        'assets/cases/chemikal/06.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     5. GAUCHITAS
  ------------------------------------------------------- */
  {
    slug: 'gauchitas',
    client: 'Gauchitas',
    emoji: '🥔',
    title: 'Brand Identity & Website',
    subtitle: 'Identidad de marca y presencia digital para snack argentino',
    url: 'https://gauchitas.com.ar/',
    urlLabel: 'gauchitas.com.ar',
    showInHome: false,
    category: 'Branding & Web',
    industry: 'Snacks / Alimentos',
    tags: ['Branding', 'Identidad visual', 'Web', 'Packaging', 'HTML/CSS/JS'],
    theme: 'brand',
    accent: '#E63030',
    accentDark: '#A81F1F',
    bgDark: '#0A0A0A',
    snippet: 'Identidad de marca completa y sitio web para Gauchitas, papas fritas estilo kettle argentinas. Logo, tipografía, packaging y web desde cero.',
    overview: '<strong>Gauchitas</strong> es una marca de papas fritas estilo kettle de Argentina, buscando destacarse en un mercado competitivo de snacks con una fuerte <strong>identidad visual</strong> y una <strong>presencia digital moderna</strong>. El desafío era diseñar una marca que se sintiera <strong>auténtica, divertida y premium</strong>, a la vez que crear un <strong>sitio web</strong> que pudiera mostrar los productos y conectar con clientes potenciales.',
    role: 'Brand & UX/UI Designer + Front-End Developer',
    responsibilities: [
      'Diseño de identidad visual completa (logo, tipografía, paleta de colores, conceptos de packaging)',
      'Diseño y desarrollo del sitio web para destacar los productos y la historia de la marca'
    ],
    tools: ['Illustrator', 'Photoshop (brand design & packaging assets)', 'Figma (UI/UX design, prototipado)', 'HTML / CSS / JS'],
    problem: 'La marca necesitaba: crear una identidad fuerte que refleje las raíces argentinas pero apele a una audiencia moderna; destacarse en góndola con packaging llamativo; y establecer una presencia online donde los clientes pudieran explorar la marca y los productos.',
    constraints: 'El proyecto debía balancear elementos tradicionales (para conectar con las raíces locales) con diseño moderno (para apelar a audiencias jóvenes). El sitio web necesitaba ser liviano, rápido y responsive, ya que sería el primer punto de contacto digital de la marca.',
    solutionIntro: 'El proyecto combinó diseño de marca con implementación digital:',
    solutionItems: [
      { title: 'Identidad de marca', desc: 'Logo, tipografía y paleta de colores (texturas de papel kraft, acentos rojo/negro/blanco). Conceptos de packaging para destacar en góndola.' },
      { title: 'Diseño web', desc: 'Sitio storytelling-driven para presentar la marca y sus productos. Layouts limpios con visuales bold para combinar con el estilo del packaging.' },
      { title: 'Desarrollo web', desc: 'Implementado con HTML, CSS y JS, asegurando responsividad completa. Micro-interacciones para hacer el sitio dinámico y atractivo.' }
    ],
    process: [
      { num: '01', title: 'Research y moodboards', desc: 'Exploración de branding de snacks y cultura visual argentina para definir un look que se sintiera auténtico pero moderno.' },
      { num: '02', title: 'Diseño de marca', desc: 'Creación de variaciones de logo, sistema tipográfico y mockups de packaging, testeados sobre fondos kraft.' },
      { num: '03', title: 'Diseño web', desc: 'Wireframes desktop y mobile que evolucionaron hacia UI hi-fi alineada con la identidad de marca.' },
      { num: '04', title: 'Desarrollo', desc: 'Implementación del sitio con HTML, CSS y JS, asegurando performance y responsividad mobile-first.' }
    ],
    results: [
      'Identidad de marca única y distintiva en la industria de snacks',
      'Sitio web moderno y responsive que cuenta la historia de la marca y muestra los productos',
      'Base sólida para expansión futura en marketing digital y e-commerce',
      'Packaging con identidad propia para competir en góndola'
    ],
    conclusion: 'Gauchitas fue un proyecto de alcance completo donde tomé el rol de diseñador y desarrollador. Creé una identidad de marca distintiva, diseñé e implementé un sitio web responsive, y posicioné la marca para el crecimiento con presencia sólida tanto offline (packaging) como online.',
    images: {
      hero: 'assets/cases/gauchitas/hero.jpg',
      gallery: [
        'assets/cases/gauchitas/01.jpg',
        'assets/cases/gauchitas/02.jpg',
        'assets/cases/gauchitas/03.jpg',
        'assets/cases/gauchitas/04.jpg',
        'assets/cases/gauchitas/05.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     6. KIKE CAFÉ
  ------------------------------------------------------- */
  {
    slug: 'kike-cafe',
    client: 'Kike Café',
    emoji: '☕',
    title: 'Digital Presence & Landing Page',
    subtitle: 'Presencia digital para café gourmet con e-commerce en desarrollo',
    url: 'https://kikecafe.com.ar',
    urlLabel: 'kikecafe.com.ar',
    showInHome: false,
    category: 'Web & Framer',
    industry: 'Gastronomía / Café',
    tags: ['Framer', 'Landing page', 'UX/UI', 'E-commerce (próximo)'],
    theme: 'coffee',
    accent: '#C8863A',
    accentDark: '#8B5E25',
    bgDark: '#1A0800',
    snippet: 'Landing page en Framer para café gourmet KIKE. Diseño colaborativo con Juan Cabrales, con e-commerce en desarrollo activo como fase 2.',
    overview: '<strong>KIKE Coffee Shop</strong> es un café gourmet que honra el arte y la esencia del café. A pesar de tener una sólida reputación local, necesitaban una <strong>landing page moderna</strong> para expandir su presencia digital y conectar con una audiencia más amplia. El objetivo fue diseñar y desarrollar una plataforma que reflejara su identidad y valores de marca, mientras atraía nuevos clientes. Hoy, la colaboración continúa: estamos construyendo su <strong>plataforma de e-commerce completa</strong>.',
    role: 'Front-End Developer & Design Collaborator',
    responsibilities: [
      'Trabajo de diseño conjunto con Juan Cabrales',
      'Implementación y refinamiento de la landing page en Framer',
      'Múltiples rondas de revisión presentando el diseño implementado',
      'Desarrollo activo de la plataforma de e-commerce (fase 2 en curso)'
    ],
    tools: ['Framer (desarrollo e implementación)', 'Figma (colaboración de diseño e iteraciones)', 'Illustrator (ajustes gráficos y assets de marca)'],
    problem: 'A pesar de tener una base de clientes dedicada, KIKE Coffee Shop no tenía presencia online. El desafío era <strong>traducir la identidad del café a digital</strong>, creando una plataforma visualmente compellente que mostrara sus valores mientras era intuitiva y atractiva para los visitantes.',
    constraints: 'Presupuesto limitado y timeline ajustado, lo que significaba enfocarse solo en lo esencial: una landing page limpia y entrega rápida.',
    solutionIntro: 'El proyecto siguió un enfoque práctico y colaborativo:',
    solutionItems: [
      { title: 'Esfuerzo de diseño colaborativo', desc: 'Trabajo en equipo con Juan Cabrales para asegurar alineación con la marca KIKE.' },
      { title: 'Implementación en Framer', desc: 'Refiné detalles y mejoré la usabilidad durante la implementación para crear una experiencia suave y consistente.' },
      { title: 'Varias rondas de revisión', desc: 'Reuniones con los dueños del café para validar el diseño y finalizar ajustes hasta la versión final.' },
      { title: 'Próximo paso: e-commerce', desc: 'Expansión del proyecto hacia una tienda online escalable para sus productos gourmet (actualmente en desarrollo).' }
    ],
    process: [
      { num: '01', title: 'Entender la marca', desc: 'Trabajé de cerca con los dueños del café y Juan Cabrales para asegurar que la experiencia digital coincidiera con la identidad y valores de KIKE.' },
      { num: '02', title: 'Colaboración de diseño', desc: 'El diseño visual fue desarrollado junto con Juan Cabrales. Mi rol fue implementarlo en Framer y refinar los detalles para crear una experiencia suave y consistente.' },
      { num: '03', title: 'Desarrollo en Framer', desc: 'Implementé la landing page en Framer, asegurando una experiencia responsive y visualmente pulida. La herramienta permitió ir del diseño a un sitio funcional rápidamente.' },
      { num: '04', title: 'Sesiones de revisión', desc: 'Mantuvimos múltiples reuniones donde presenté el diseño implementado, recopilé feedback y apliqué mejoras hasta aprobar la versión final.' }
    ],
    results: [
      'Landing page moderna que representa la identidad de KIKE',
      'Entrega rápida completada en un timeframe corto',
      'Feedback positivo de los stakeholders, validando el primer paso digital de la marca',
      'Proyecto de e-commerce en curso, posicionando a KIKE para el crecimiento online'
    ],
    conclusion: 'La colaboración entre Juan Cabrales (diseño) y mi rol (implementación y mejoras en Framer) garantizó creatividad y ejecución de calidad. El proyecto de landing page corto y enfocado sentó una base sólida. La colaboración continúa con el desarrollo del e-commerce de KIKE, expandiendo su presencia digital y potencial de ventas.',
    images: {
      hero: 'assets/cases/kike-cafe/hero.jpg',
      gallery: [
        'assets/cases/kike-cafe/01.jpg',
        'assets/cases/kike-cafe/02.jpg',
        'assets/cases/kike-cafe/03.jpg',
        'assets/cases/kike-cafe/04.jpg',
        'assets/cases/kike-cafe/05.jpg',
        'assets/cases/kike-cafe/06.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     7. LONGEVITY ARGENTINA
  ------------------------------------------------------- */
  {
    slug: 'longevity-argentina',
    client: 'Longevity Argentina',
    emoji: '🧬',
    title: 'Landing Page & Brand Digital Presence',
    subtitle: 'Presencia digital médica para startup de longevidad y salud preventiva',
    url: 'https://longevityargentina.com/',
    urlLabel: 'longevityargentina.com',
    showInHome: false,
    category: 'Web & Salud',
    industry: 'Salud / Medicina preventiva',
    tags: ['Landing page', 'Branding', 'HTML/CSS/JS', 'GoDaddy', 'Claude Code'],
    theme: 'health',
    accent: '#4CAF50',
    accentDark: '#2E7D32',
    bgDark: '#050F05',
    snippet: 'Landing page para startup de medicina de longevidad argentina. Diseño que equilibra autoridad médica y accesibilidad, con formularios de captación y CTAs a WhatsApp.',
    overview: '<strong>Longevity Argentina</strong> es una marca de salud y bienestar enfocada en medicina de longevidad y prácticas de salud preventiva. Necesitaban una <strong>landing page</strong> para establecer su presencia digital, comunicar su propuesta de valor a un público argentino consciente de la salud, y capturar leads para sus servicios. El proyecto entregó una <strong>presencia web pulida y alineada con la marca</strong>, hosteada en GoDaddy.',
    role: 'UX Designer & Front-End Developer',
    responsibilities: [
      'Liderazgo del diseño, desarrollo y despliegue end-to-end',
      'Definición de posicionamiento y mensajes clave con el equipo',
      'Diseño visual alineado con el espacio de salud y longevidad',
      'Implementación y configuración en GoDaddy'
    ],
    tools: ['Figma (UX/UI design)', 'HTML / CSS / JS (front-end)', 'GoDaddy (hosting & dominio)', 'Claude Code (AI-assisted development)'],
    problem: 'Longevity Argentina operaba sin una presencia web dedicada, dependiendo de canales informales para comunicar su oferta. La marca necesitaba un <strong>hogar digital</strong> que transmitiera credibilidad médica, autoridad y la naturaleza aspiracional del espacio de longevidad, siendo accesible y clara para su audiencia argentina.',
    constraints: 'Marca en etapa temprana: la identidad visual y los mensajes debían desarrollarse en paralelo con el producto digital. El espacio de salud requería equilibrar credibilidad clínica con estética accesible. La infraestructura de GoDaddy condicionó decisiones técnicas.',
    solutionIntro: 'Una landing page diseñada y desarrollada que:',
    solutionItems: [
      { title: 'Comunica la propuesta de valor', desc: 'Servicios y beneficios de Longevity Argentina presentados con claridad y jerarquía visual.' },
      { title: 'Construye confianza', desc: 'Lenguaje visual que comunica confianza y expertise: layouts limpios, paleta contenida, tipografía que equilibra autoridad con accesibilidad.' },
      { title: 'Genera leads', desc: 'Formularios de solicitud de consulta y CTAs a WhatsApp integrados y funcionales desde el lanzamiento.' },
      { title: 'Fácil de mantener', desc: 'Activa y mantenida en GoDaddy con flujo de actualización sencillo para el cliente.' }
    ],
    process: [
      { num: '01', title: 'Alineación de marca y mensajes', desc: 'Trabajé con el equipo de Longevity Argentina para definir su posicionamiento, los segmentos de audiencia clave y los mensajes que resonarían con profesionales de salud conscientes buscando medicina preventiva.' },
      { num: '02', title: 'UX y diseño visual', desc: 'Diseñé la página en Figma con un lenguaje visual que comunica confianza y expertise: layouts limpios, paleta contenida, tipografía que equilibra autoridad con accesibilidad.' },
      { num: '03', title: 'Desarrollo front-end', desc: 'Implementé el diseño en HTML/CSS/JS, optimizando para performance y responsividad mobile. Stack técnico liviano para adaptarse al entorno de hosting de GoDaddy.' },
      { num: '04', title: 'Deploy y handoff', desc: 'Desplegué en GoDaddy, configuré el dominio y entregué documentación para que el cliente pueda manejar actualizaciones básicas de contenido de forma independiente.' }
    ],
    results: [
      'Presencia digital creíble lanzada para una marca en un mercado de bienestar competitivo',
      'Mecanismos de captación de leads (formulario + CTA WhatsApp) integrados y funcionales desde el día uno',
      'Feedback positivo del cliente sobre el alineamiento visual con su visión de marca',
      'Base establecida para expansión digital futura a medida que la marca crece'
    ],
    conclusion: 'Un proyecto web exitoso, con foco en la marca, para una startup de salud que entra al espacio de medicina de longevidad argentino. Los fundamentos sólidos de UX y la colaboración cercana con el cliente en los mensajes aseguraron que el producto final se sintiera alineado con su visión, siendo práctico de construir y mantener dentro de sus restricciones.',
    images: {
      hero: 'assets/cases/longevity-argentina/hero.jpg',
      gallery: [
        'assets/cases/longevity-argentina/01.jpg',
        'assets/cases/longevity-argentina/02.jpg',
        'assets/cases/longevity-argentina/03.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     8. ERNESTO AUTOMOTORES
  ------------------------------------------------------- */
  {
    slug: 'ernesto-automotores',
    client: 'Ernesto Automotores',
    emoji: '🚗',
    title: 'Landing Page & Web Presence',
    subtitle: 'Presencia web y portal de gestión de inventario para concesionaria',
    url: 'https://www.ernestoautomotores.com.ar/',
    urlLabel: 'ernestoautomotores.com.ar',
    showInHome: false,
    category: 'Web & Automatización',
    industry: 'Automotriz',
    tags: ['Landing page', 'PHP', 'Panel admin', 'Claude Code', 'FTP deploy'],
    theme: 'automotive',
    accent: '#B8965E',
    accentDark: '#8B6F3E',
    bgDark: '#080808',
    snippet: 'Landing page mobile-first para concesionaria de usados + portal de auto-gestión de inventario. Deploy automatizado via Claude Code hooks.',
    overview: '<strong>Ernesto Automotores</strong> es una concesionaria de autos usados establecida en Buenos Aires. Con un inventario creciente y una base de clientes cada vez más digital, necesitaban una <strong>presencia web profesional</strong> que pudiera mostrar sus vehículos, generar confianza en compradores potenciales y capturar leads calificados. El proyecto entregó una <strong>landing page y pipeline de deploy</strong> que le dio al negocio una vidriera digital creíble y moderna.',
    role: 'UX Designer & Front-End Developer',
    responsibilities: [
      'Liderazgo de diseño, desarrollo y deploy',
      'Gestión de mantenimiento y actualizaciones via flujos automatizados',
      'Diseño y construcción del portal de auto-gestión de inventario (Fase 2)'
    ],
    tools: ['PHP / HTML / CSS / JS (desarrollo front-end)', 'Hostinger (hosting & deploy)', 'Claude Code (AI-assisted development + FTP deploy automation via hooks)', 'Figma (UX/UI design)', 'markitdown (compresión de contexto)'],
    problem: 'Ernesto Automotores no tenía <strong>presencia digital</strong> más allá del boca a boca y canales informales. Los clientes buscando autos usados online no tenían forma de descubrir o evaluar el inventario de la concesionaria, generando una brecha entre la reputación del negocio y su visibilidad digital.',
    constraints: 'Cliente con presupuesto ajustado: la solución necesitaba ser costo-efectiva con mínimos costos de hosting recurrentes. Stakeholder no técnico: las actualizaciones de contenido debían ser manejables sin intervención de un desarrollador. Fast time-to-market.',
    solutionIntro: 'Una landing page limpia, mobile-first, que:',
    solutionItems: [
      { title: 'Presencia digital completa', desc: 'Presenta la identidad de la concesionaria, highlights de inventario e información de contacto de manera clara y profesional.' },
      { title: 'CTAs para leads', desc: 'Llamadas a la acción claras (WhatsApp, teléfono) para impulsar la generación de leads calificados.' },
      { title: 'Deploy automatizado', desc: 'Hosteado en Hostinger con flujo de deploy FTP automatizado via Claude Code hooks — updates rápidos con mínima fricción.' },
      { title: 'Portal de gestión de inventario', desc: 'Fase 2: back-office donde el equipo gestiona todo el inventario de vehículos de forma independiente.' }
    ],
    process: [
      { num: '01', title: 'Discovery y estrategia de contenido', desc: 'Trabajé con el cliente para definir los mensajes clave, categorías de vehículos y señales de confianza (años de experiencia, ubicación, métodos de contacto) que resonarían con su audiencia objetivo.' },
      { num: '02', title: 'UX y diseño visual', desc: 'Diseñé la página en Figma con foco en mobile. Prioricé contenido scannable, CTAs de contacto prominentes y estilo visual consistente con el sector automotriz.' },
      { num: '03', title: 'Desarrollo front-end', desc: 'Implementé el diseño en PHP/HTML/CSS/JS vanilla — elección deliberada por simplicidad, performance y bajos requerimientos de hosting en Hostinger.' },
      { num: '04', title: 'Pipeline de deploy', desc: 'Configuré un flujo de deploy FTP automatizado via Claude Code hooks, permitiendo que los updates lleguen al sitio en vivo con mínimos pasos manuales. Redujo significativamente la fricción del mantenimiento.' },
      { num: '05', title: 'Portal de auto-gestión (Fase 2)', desc: 'Back-office donde el equipo puede cargar vehículos con formulario estructurado, editar listings, eliminar vendidos, y previsualizar cómo aparece cada auto en el sitio público antes de publicar.' }
    ],
    results: [
      'Presencia web profesional lanzada para un negocio que no tenía ninguna',
      'Generación de leads via WhatsApp y CTAs de teléfono integrados directamente en la página',
      'Pipeline de deploy automatizado: updates reducidos de gestión FTP manual a flujo optimizado',
      'El equipo gestiona todo el inventario de forma independiente, sin dependencia del desarrollador para el día a día'
    ],
    conclusion: 'Un proyecto web enfocado y pragmático que entregó valor real de negocio para una PYME local. La combinación de elecciones tecnológicas simples, fundamentos sólidos de UX y tooling de deploy automatizado resultó en una solución rápida, mantenible y ajustada al presupuesto y realidad operativa del cliente.',
    images: {
      hero: 'assets/cases/ernesto-automotores/hero.jpg',
      gallery: [
        'assets/cases/ernesto-automotores/01.jpg',
        'assets/cases/ernesto-automotores/02.jpg',
        'assets/cases/ernesto-automotores/03.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     9. CAFÉ LA HUMEDAD
  ------------------------------------------------------- */
  {
    slug: 'cafe-la-humedad',
    client: 'Café La Humedad',
    emoji: '☕',
    title: 'Event Automation & Digital Presence',
    subtitle: 'Pipeline de automatización para publicación de eventos en café cultural',
    url: 'https://cafelahumedad.com/',
    urlLabel: 'cafelahumedad.com',
    showInHome: false,
    category: 'Automatización',
    industry: 'Cultura / Gastronomía',
    tags: ['Automatización', 'Playwright', 'Python', 'Whisper AI', 'UX/UI'],
    theme: 'cultural',
    accent: '#FF6B35',
    accentDark: '#CC4A1A',
    bgDark: '#140800',
    snippet: 'Pipeline Playwright + Python para automatizar la carga masiva de eventos en café cultural porteño. De 2 horas manuales a minutos. Incluye transcripción de audio con Whisper.',
    overview: '<strong>Café La Humedad</strong> es un café cultural y espacio creativo de Buenos Aires con una agenda de eventos vibrante: música en vivo, noches de poesía, exhibiciones de arte y más. A pesar de su programación activa, gestionar y publicar su agenda de eventos era un <strong>proceso manual y time-consuming</strong> sin ningún flujo sistematizado. El objetivo fue construir un <strong>pipeline de automatización</strong> para agilizar la carga de eventos y reducir la carga operativa del equipo.',
    role: 'UX Designer & Developer',
    responsibilities: [
      'Liderazgo del flujo completo desde discovery hasta implementación',
      'Diseño y construcción del pipeline de automatización',
      'Integración de transcripción de mensajes de voz con Whisper'
    ],
    tools: ['Playwright (automatización de browser & scripts de upload)', 'Python (scripting & procesamiento CSV)', 'Claude (Anthropic — AI-assisted development)', 'Figma (UX design)', 'Whisper (transcripción local, CUDA-accelerated)'],
    problem: 'El equipo de Café La Humedad <strong>cargaba eventos manualmente</strong> en su plataforma uno por uno — un proceso repetitivo y propenso a errores que consumía tiempo significativo cada semana. Con una agenda cultural densa, este cuello de botella limitaba su capacidad de comunicar su programación efectivamente.',
    constraints: 'Sin equipo técnico dedicado: la solución debía ser simple para que el personal no técnico pudiera operarla. Presupuesto limitado para herramientas o infraestructura. Los eventos llegan en formatos variados (mensajes de voz, textos informales, planillas), requiriendo manejo flexible de inputs.',
    solutionIntro: 'Una automatización Playwright + CSV que:',
    solutionItems: [
      { title: 'Input via CSV estructurado', desc: 'Template CSV simple que el equipo completa (o que se auto-completa desde notas de voz transcritas), sirviendo como fuente única de verdad para cada batch de eventos.' },
      { title: 'Upload automático', desc: 'Script Playwright que navega la plataforma de eventos, completa los campos del formulario y sube cada evento del CSV automáticamente, con logging de errores.' },
      { title: 'Transcripción de audios', desc: 'Integración de Whisper (local, CUDA-accelerated) para transcribir mensajes de voz de WhatsApp del cliente a texto estructurado listo para el CSV.' }
    ],
    process: [
      { num: '01', title: 'Discovery y mapeo del flujo', desc: 'Mapeé el proceso manual end-to-end: cómo se recibían los eventos, cómo se formateaban y cómo se publicaban. Identifiqué los puntos de mayor fricción.' },
      { num: '02', title: 'Estandarización del input', desc: 'Diseñé un template CSV simple que el equipo puede completar (o que puede auto-completarse desde notas de voz transcritas), sirviendo como única fuente de verdad para cada batch.' },
      { num: '03', title: 'Desarrollo de la automatización', desc: 'Construí el script Playwright para navegar la plataforma de eventos, manejar los campos del formulario y enviar cada fila del CSV. Incluye error handling y logging para que el equipo pueda revisar qué se cargó.' },
      { num: '04', title: 'Transcripción de mensajes de voz', desc: 'Integré Whisper para procesar mensajes de WhatsApp del cliente, convirtiendo detalles de eventos hablados en texto estructurado que alimenta el pipeline CSV.' },
      { num: '05', title: 'Handoff y capacitación', desc: 'Entregué un runbook simple para que el equipo del cliente pueda ejecutar la automatización de forma independiente, con una sesión de walkthrough.' }
    ],
    results: [
      '~90% de reducción en tiempo dedicado a la carga de eventos por semana',
      'El equipo pasó de copy-paste manual a un flujo de upload batch en un clic',
      'Los mensajes de voz del cliente ahora se transcriben automáticamente y están listos para revisión',
      'El café puede comunicar su agenda completa de eventos de forma consistente sin cuellos de botella operativos'
    ],
    conclusion: 'Una solución de automatización enfocada resolvió un punto de dolor operativo concreto para un negocio cultural con recursos técnicos limitados. El proyecto demostró cómo tooling liviano y flujos de trabajo asistidos por IA pueden entregar impacto significativo sin requerir infraestructura compleja ni gran inversión.',
    images: {
      hero: 'assets/cases/cafe-la-humedad/hero.jpg',
      gallery: [
        'assets/cases/cafe-la-humedad/01.jpg',
        'assets/cases/cafe-la-humedad/02.jpg',
        'assets/cases/cafe-la-humedad/03.jpg'
      ]
    }
  },

  /* -------------------------------------------------------
     10. IDENTIDAD GENESIS
  ------------------------------------------------------- */
  {
    slug: 'identidad-genesis',
    client: 'Identidad Génesis',
    emoji: '♾️',
    title: 'Designer Portfolio Website',
    subtitle: 'Portfolio personal minimalista con CMS para diseñador independiente',
    url: 'https://identidadgenesis.framer.website/',
    urlLabel: 'identidadgenesis.framer.website',
    showInHome: false,
    category: 'Web & Framer',
    industry: 'Diseño / Portfolio',
    tags: ['Framer', 'CMS', 'Animaciones', 'Portfolio', 'UX/UI'],
    theme: 'portfolio',
    accent: '#FFFFFF',
    accentDark: '#CCCCCC',
    bgDark: '#080808',
    snippet: 'Portfolio minimalista en Framer con CMS integrado para el diseñador Juani Cabrales. Animaciones cuidadas, diseño limpio, gestión de proyectos autónoma.',
    overview: '<strong>Identidad Génesis</strong> es el portfolio personal de <strong>Juani Cabrales</strong>, diseñador con quien también colaboré en el proyecto KIKE Coffee Shop. Necesitaba un <strong>sitio web moderno y minimalista</strong> para presentar su trabajo de manera limpia y profesional mientras mantenía control total sobre sus proyectos. El objetivo fue construir un <strong>sitio CMS-powered en Framer</strong>, dándole la flexibilidad de agregar, editar y gestionar proyectos sin depender de soporte externo.',
    role: 'Front-End Implementer en Framer',
    responsibilities: [
      'Configuración y personalización del CMS para gestión de proyectos',
      'Foco en minimalismo y animaciones para elevar la experiencia de navegación',
      'Entrega de proyecto corto y enfocado con turnaround rápido'
    ],
    tools: ['Framer (site build, CMS, animaciones)', 'Figma (design handoff & referencias de layout)'],
    problem: 'Juani necesitaba un <strong>portfolio simple pero de alto impacto</strong>. El sitio debía enfatizar el <strong>minimalismo y las animaciones suaves</strong>, mientras le daba la capacidad de <strong>gestionar y actualizar sus proyectos de forma independiente</strong>.',
    constraints: 'Proyecto corto con tiempo suficiente para enfocarse en el polish y los detalles. En lugar de funcionalidad compleja, el foco fue en simpleza, velocidad y storytelling visual.',
    solutionIntro: 'El proyecto siguió un enfoque directo y minimalista:',
    solutionItems: [
      { title: 'Layout minimal', desc: 'Interfaz limpia y libre de distracciones, centrada en los proyectos de Juani.' },
      { title: 'Setup de CMS', desc: 'Estructurado en Framer para permitir updates fáciles sin dependencia técnica.' },
      { title: 'Animaciones y polish', desc: 'Diseño de movimiento sutil para traer interactividad y sensación premium sin sobrecargarlo.' },
      { title: 'Implementación responsive', desc: 'Optimizado para desktop y mobile.' }
    ],
    process: [
      { num: '01', title: 'Implementación en Framer', desc: 'Construí el portfolio en Framer, configurando el CMS para proyectos de modo que Juani pudiera agregar y editarlos fácilmente de forma autónoma.' },
      { num: '02', title: 'Animaciones y polish', desc: 'Dedicamos tiempo a afinar animaciones, transiciones y diseño de movimiento, enriqueciendo el layout minimal sin sobrecargarlo.' }
    ],
    results: [
      'Portfolio minimal y elegante alineado con la filosofía de diseño de Juani',
      'Flujo de trabajo CMS-powered: gestión autónoma de proyectos',
      'Experiencia de usuario pulida con animaciones y diseño responsive'
    ],
    conclusion: 'Un proyecto corto y enfocado que entregó resultados sólidos con mínima complejidad. Combinando el CMS de Framer con animaciones cuidadosamente diseñadas, creamos una plataforma que era tanto funcional como visualmente atractiva. La colaboración fortaleció el trabajo en equipo que habíamos iniciado en KIKE Coffee Shop.',
    images: {
      hero: 'assets/cases/identidad-genesis/hero.jpg',
      gallery: [
        'assets/cases/identidad-genesis/01.jpg',
        'assets/cases/identidad-genesis/02.jpg',
        'assets/cases/identidad-genesis/03.jpg',
        'assets/cases/identidad-genesis/04.jpg',
        'assets/cases/identidad-genesis/05.jpg',
        'assets/cases/identidad-genesis/06.jpg'
      ]
    }
  }

];

/* Helper para obtener un caso por slug */
function getCaseBySlug(slug) {
  return CASE_STUDIES.find(c => c.slug === slug) || null;
}

/* Helper para obtener los casos "show in home" */
function getFeaturedCases() {
  return CASE_STUDIES.filter(c => c.showInHome);
}
