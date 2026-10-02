import type { AssistantResponse } from "@/lib/types";

export const SUGGESTED_QUESTIONS = [
  "¿Qué aspectos debería revisar una organización con 480 empleados frente a sus obligaciones de inclusión laboral?",
  "Analice nuestra población caracterizada e identifique vacíos de información relevantes para nuestra estrategia de inclusión.",
  "¿Qué documentación debería revisar antes de implementar un programa de inclusión laboral?",
  "Con base en nuestros datos actuales, ¿qué situaciones laborales requieren revisión prioritaria?",
];

export const DISCLAIMER =
  "NEXA ofrece información y análisis para apoyar la toma de decisiones. Los asuntos que requieran concepto jurídico formal o representación profesional deben ser revisados por un abogado.";

const OBLIGATIONS: AssistantResponse = {
  analysis:
    "Para una organización de aproximadamente 480 empleados, los aspectos de inclusión laboral a revisar se agrupan en tres frentes: las protecciones constitucionales y legales para trabajadores en condición de vulnerabilidad, los deberes de seguridad y salud en el trabajo —incluidos los ajustes razonables— y las disposiciones recientes de la reforma laboral que refuerzan las expectativas de inclusión para empleadores de mayor tamaño. A esta escala, también se espera contar con un SG-SST plenamente documentado y con instancias internas formales (COPASST y Comité de Convivencia Laboral).",
  considerations: [
    "La Ley 1618 de 2013 establece el deber de garantizar el ejercicio efectivo de los derechos de las personas con discapacidad, incluido el acceso al empleo en condiciones de igualdad y con ajustes razonables.",
    "La Ley 361 de 1997 y la jurisprudencia de la Corte Constitucional reconocen la estabilidad laboral reforzada de trabajadores con condiciones de salud o discapacidad. En estos casos, la terminación del contrato generalmente requiere autorización previa del Ministerio del Trabajo.",
    "La Ley 2466 de 2025 (reforma laboral) incorpora disposiciones de inclusión para empleadores de mayor tamaño. Los umbrales específicos y su aplicabilidad a su organización deben validarse con un abogado frente al texto normativo vigente.",
    "El Decreto 1072 de 2015 y la Resolución 0312 de 2019 establecen estándares mínimos del SG-SST según el tamaño y el nivel de riesgo; las organizaciones con más de 50 trabajadores deben cumplir la totalidad de los estándares.",
    "Los datos sensibles, como la condición de discapacidad o el autorreconocimiento étnico, están protegidos por la Ley 1581 de 2012 y requieren autorización expresa y voluntaria.",
  ],
  actions: [
    "Realizar un diagnóstico de inclusión con base en la metodología de inclusión organizacional disponible en el Centro de Conocimiento.",
    "Verificar el número actual de trabajadores con discapacidad reportada y contrastarlo con los requisitos aplicables de la reforma.",
    "Revisar los procedimientos de terminación para identificar casos de estabilidad reforzada antes de cualquier decisión.",
    "Auditar la documentación del SG-SST en materia de protocolos de ajustes razonables y evaluación de adaptabilidad de puestos.",
    "Lanzar una campaña voluntaria de autorreconocimiento, con autorización expresa, para cerrar los vacíos de información de inclusión.",
  ],
  sources: [
    { id: "s1", title: "Ley 1618 de 2013 — Derechos de las personas con discapacidad", area: "labor-law", excerpt: "…garantizar y asegurar el ejercicio efectivo de los derechos de las personas con discapacidad, mediante la adopción de medidas de inclusión, acción afirmativa y de ajustes razonables…", reference: "Art. 1, Art. 13", relevance: 96 },
    { id: "s2", title: "Ley 361 de 1997 — Estabilidad laboral reforzada", area: "labor-law", excerpt: "…ninguna persona en situación de discapacidad podrá ser despedida o su contrato terminado por razón de su discapacidad, salvo que medie autorización de la oficina de Trabajo…", reference: "Art. 26", relevance: 92 },
    { id: "s3", title: "Ley 2466 de 2025 — Reforma Laboral", area: "labor-law", excerpt: "Disposiciones sobre la vinculación de personas con discapacidad por parte de empleadores privados; su aplicabilidad depende del tamaño de la planta de personal.", reference: "Capítulo de inclusión", relevance: 84 },
    { id: "s4", title: "Resolución 0312 de 2019 — Estándares mínimos del SG-SST", area: "osh", excerpt: "Empresas de más de cincuenta (50) trabajadores… deberán cumplir con los estándares mínimos establecidos en el Capítulo III.", reference: "Cap. III", relevance: 81 },
    { id: "s5", title: "Metodología de inclusión laboral efectiva", area: "sergio-flores", excerpt: "Fase 1 — Diagnóstico: cuantificar la planta actual, identificar vacíos de información y evaluar la preparación organizacional antes de definir metas de inclusión.", reference: "Sección 2.1", relevance: 89 },
  ],
};

const POPULATION_GAPS: AssistantResponse = {
  analysis:
    "Según los datos de población disponibles en NEXA para Financiera Comultrasan, la cobertura general de caracterización es del 68 %, pero la dimensión de inclusión es la menos caracterizada, con un 34 %. Esto significa que una estrategia de inclusión diseñada hoy partiría de una visión incompleta de cerca de dos tercios de la población. Los vacíos se concentran en asociados entre 25 y 45 años y en los municipios de Barrancabermeja y Girón.",
  dataContext: [
    { label: "Cobertura de inclusión", value: "34 %" },
    { label: "Discapacidad sin información", value: "329.400" },
    { label: "Jefatura de hogar sin información", value: "271.800" },
    { label: "Información laboral desactualizada", value: "61 % (Santander)" },
  ],
  considerations: [
    "Los atributos de inclusión son datos personales sensibles. Su recolección debe ser voluntaria, con finalidad específica y respaldada por autorización expresa conforme a la Ley 1581 de 2012.",
    "Los asociados entre 25 y 45 años suman 234.300 personas con una cobertura promedio del 63 %: es el segmento de mayor impacto para la caracterización.",
    "La situación laboral es desconocida o está desactualizada para una proporción significativa de asociados en Santander, lo que limita el diseño de programas de inclusión laboral.",
    "La jefatura de hogar y las personas a cargo son insumos críticos para productos con enfoque social y no están disponibles para más de la mitad de la población.",
  ],
  actions: [
    "Priorizar una campaña de caracterización con IA para el segmento de 25 a 45 años, enfocada en información laboral, del hogar y de inclusión voluntaria.",
    "Usar WhatsApp como canal principal para asociados menores de 40 años: actualmente completa 1,4 veces más perfiles que las llamadas.",
    "Incluir un paso de autorización expresa y una opción para no responder las preguntas sensibles de inclusión.",
    "Repetir este análisis cuando la cobertura de inclusión supere el 60 % para contar con una línea base confiable.",
  ],
  sources: [
    { id: "p1", title: "Panorama poblacional NEXA — Financiera Comultrasan", area: "population", excerpt: "500.000 asociados · 68 % de cobertura de caracterización · Dimensión de inclusión con 34 % de cobertura.", reference: "Corte 2026-10-02", relevance: 98 },
    { id: "p2", title: "Analítica de campañas — Caracterización de Asociados 2026", area: "population", excerpt: "Tasa de finalización por WhatsApp del 66 % frente al 50 % de las llamadas con IA en asociados menores de 40 años.", reference: "Campaña cmp-2026-char", relevance: 87 },
    { id: "p3", title: "Guía de diagnóstico organizacional de inclusión", area: "sergio-flores", excerpt: "Una línea base de inclusión confiable requiere al menos un 60 % de cobertura de los atributos de autorreconocimiento en la población objetivo.", reference: "Paso 3", relevance: 85 },
    { id: "p4", title: "Ley 1581 de 2012 — Protección de datos personales", area: "labor-law", excerpt: "…datos sensibles… el Titular no está obligado a autorizar su Tratamiento.", reference: "Art. 5, Art. 6", relevance: 80 },
  ],
};

const DOCUMENTATION: AssistantResponse = {
  analysis:
    "Antes de implementar un programa de inclusión laboral, es recomendable revisar la documentación en cuatro frentes: cumplimiento legal y normativo, seguridad y salud en el trabajo, políticas internas y gobierno, y protección de datos. El objetivo es confirmar que el programa tenga un soporte jurídico adecuado, sea viable operativamente y que la organización pueda ofrecer ajustes razonables desde el primer día.",
  considerations: [
    "El Reglamento Interno de Trabajo podría requerir actualizaciones para reflejar compromisos de no discriminación y ajustes razonables.",
    "La documentación del SG-SST debería incluir análisis de puestos de trabajo que identifiquen qué cargos pueden adaptarse y qué ajustes se requieren.",
    "Los procesos de reclutamiento y selección deberían revisarse para eliminar posibles barreras en perfiles de cargo, pruebas y formatos de entrevista.",
    "Las políticas de tratamiento de datos personales deben contemplar la recolección de datos sensibles de inclusión, incluidos los controles de conservación y acceso.",
  ],
  actions: [
    "Revisar el Reglamento Interno de Trabajo y el borrador de la política interna de diversidad e inclusión (v3).",
    "Validar la documentación del SG-SST frente a la Resolución 0312 de 2019 y el protocolo de ajustes razonables.",
    "Auditar perfiles de cargo y procesos de selección en términos de accesibilidad y sesgos.",
    "Actualizar la política de tratamiento de datos y los formatos de autorización para datos sensibles.",
    "Documentar el modelo de gobierno: responsable del programa, participación del COPASST y periodicidad de reportes.",
  ],
  sources: [
    { id: "d1", title: "Lista de verificación de cumplimiento laboral para cooperativas", area: "sergio-flores", excerpt: "Revisión previa a la implementación: RIT, SG-SST, procesos de selección, protección de datos y gobierno.", reference: "Lista §4", relevance: 94 },
    { id: "d2", title: "Decreto 1072 de 2015 — Decreto Único Reglamentario del Sector Trabajo", area: "osh", excerpt: "El empleador debe adoptar disposiciones efectivas para desarrollar las medidas de identificación de peligros, evaluación y valoración de los riesgos…", reference: "Libro 2, Parte 2, Título 4, Cap. 6", relevance: 86 },
    { id: "d3", title: "Protocolo de ajustes razonables en el puesto de trabajo", area: "osh", excerpt: "Cada solicitud de ajuste debe evaluarse dentro de los 15 días hábiles siguientes, con participación del equipo de salud ocupacional.", reference: "Sección 3", relevance: 83 },
    { id: "d4", title: "Política interna de diversidad e inclusión — Borrador v3", area: "sergio-flores", excerpt: "Borrador de política pendiente de aprobación por el Consejo de Administración; incluye metas de inclusión y modelo de rendición de cuentas.", reference: "Borrador v3", relevance: 78 },
  ],
};

const PRIORITY_REVIEW: AssistantResponse = {
  analysis:
    "Al cruzar los datos actuales de su organización con el conocimiento laboral indexado, NEXA identifica tres situaciones que ameritan revisión prioritaria: perfiles con información laboral desactualizada que limitan cualquier análisis de cumplimiento, posibles casos de estabilidad laboral reforzada sin información de salud o discapacidad registrada, y documentación de autorización de datos pendiente en segmentos donde se planea recolectar información sensible. Este análisis es orientativo y busca priorizar el trabajo del equipo jurídico y de talento humano.",
  dataContext: [
    { label: "Información laboral desactualizada", value: "61 % (Santander)" },
    { label: "Discapacidad sin información", value: "329.400" },
    { label: "Autorizaciones de datos pendientes", value: "18.920" },
    { label: "Perfiles con vacíos críticos", value: "42.841" },
  ],
  considerations: [
    "Sin información laboral actualizada no es posible identificar con certeza qué personas podrían estar cubiertas por protecciones especiales, como la estabilidad laboral reforzada.",
    "La ausencia de información de discapacidad no equivale a su inexistencia: las decisiones que afecten la relación laboral deberían contemplar una verificación previa caso a caso.",
    "La recolección de datos sensibles sin autorización vigente podría generar riesgos frente a la Ley 1581 de 2012; conviene completar las autorizaciones antes de nuevas campañas.",
    "Los segmentos con mayor concentración de vacíos (Barrancabermeja y Girón) deberían priorizarse para la actualización de información.",
  ],
  actions: [
    "Priorizar la actualización de información laboral en Santander mediante una campaña de caracterización con IA.",
    "Establecer un control previo en los procesos de terminación para verificar posibles casos de estabilidad reforzada.",
    "Completar las autorizaciones de tratamiento de datos pendientes antes de recolectar información de inclusión.",
    "Remitir los casos identificados al equipo jurídico para su valoración profesional.",
  ],
  sources: [
    { id: "r1", title: "Panorama poblacional NEXA — Financiera Comultrasan", area: "population", excerpt: "42.841 perfiles con vacíos críticos · 61 % de información laboral desactualizada en Santander.", reference: "Corte 2026-10-02", relevance: 97 },
    { id: "r2", title: "Corte Constitucional — Línea jurisprudencial sobre estabilidad reforzada", area: "labor-law", excerpt: "La protección se extiende a trabajadores con afectaciones de salud que dificulten el desempeño de sus labores, aun sin calificación de pérdida de capacidad laboral.", reference: "Línea 2026", relevance: 90 },
    { id: "r3", title: "Ley 1581 de 2012 — Protección de datos personales", area: "labor-law", excerpt: "…se requiere la autorización previa e informada del Titular…", reference: "Art. 9", relevance: 84 },
    { id: "r4", title: "Lista de verificación de cumplimiento laboral para cooperativas", area: "sergio-flores", excerpt: "Priorice la revisión de casos con protección especial antes de cualquier decisión que afecte la relación laboral.", reference: "Lista §2", relevance: 82 },
  ],
};

const GENERIC: AssistantResponse = {
  analysis:
    "Con base en el conocimiento autorizado disponible en NEXA, este tema se relaciona con la normatividad laboral colombiana, las obligaciones de seguridad social y las políticas internas de su organización. El siguiente análisis resume las consideraciones más relevantes identificadas en las fuentes indexadas y en los datos actuales de su población.",
  considerations: [
    "Las obligaciones aplicables dependen del tamaño de la planta, los tipos de vinculación y el nivel de riesgo de cada actividad.",
    "Las disposiciones recientes de la reforma laboral (Ley 2466 de 2025) pueden modificar interpretaciones anteriores; conviene confirmarlas frente a la versión indexada más reciente.",
    "Cuando el tema involucra datos personales o sensibles, aplican los requisitos de autorización de la Ley 1581 de 2012.",
  ],
  actions: [
    "Revisar las fuentes citadas con su equipo jurídico o de cumplimiento laboral.",
    "Identificar los segmentos de población afectados con los filtros de Inteligencia de Personas.",
    "Si los vacíos de información limitan el análisis, lanzar una campaña de caracterización con IA focalizada.",
  ],
  sources: [
    { id: "g1", title: "Código Sustantivo del Trabajo — Compilación actualizada 2026", area: "labor-law", excerpt: "Compilación vigente con modificaciones introducidas por la reforma laboral.", reference: "General", relevance: 82 },
    { id: "g2", title: "Ley 100 de 1993 — Sistema de Seguridad Social Integral", area: "social-security", excerpt: "El Sistema de Seguridad Social Integral… comprende las obligaciones del Estado y la sociedad…", reference: "Art. 1", relevance: 74 },
    { id: "g3", title: "Lista de verificación de cumplimiento laboral para cooperativas", area: "sergio-flores", excerpt: "Marco general de revisión de cumplimiento para instituciones financieras cooperativas.", reference: "Lista §1", relevance: 71 },
  ],
};

export function getMockAssistantResponse(question: string): AssistantResponse {
  const q = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (q.includes("prioritari") || q.includes("situaciones laborales")) return PRIORITY_REVIEW;
  if (q.includes("480") || q.includes("obligacion")) return OBLIGATIONS;
  if (q.includes("poblacion") || q.includes("vacio") || q.includes("caracteriz")) return POPULATION_GAPS;
  if (q.includes("document") || q.includes("antes de implementar") || q.includes("programa")) return DOCUMENTATION;
  return GENERIC;
}

export const THINKING_STEPS = [
  "Comprendiendo la consulta",
  "Consultando el conocimiento de NEXA",
  "Cruzando datos de la organización",
  "Construyendo un análisis fundamentado",
];
