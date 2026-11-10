import {
  apiKeyFieldsLabels,
  apiKeyFormLabels,
  balanceCardLabels,
  consumptionViewLabels,
  linkedAccountUsageLabels,
  migrationReviewLabels,
  observationStatusLabels,
  privateHistoryLabels,
  providerCardLabels,
  resetInventoryLabels,
  routingExplanationLabels,
  routingPolicyFormLabels,
  synchronizedAccountsLabels,
} from "@fabrials/ai-ui";

// The same pieces in Spanish, for the frame the visual suite reads: a translation a product would write, numbers and dates
// included. Kept beside the bench in a module without markup so the spec can compare every default word against it.

export const esStatus = {
  stale: "Última lectura conocida · ",
  updated: (time: string) => `Actualizado ${time}`,
} satisfies typeof observationStatusLabels;

export const esReset = {
    title: "Créditos de reinicio",
    count: (available: number, lastReported: boolean) =>
      `${available} ${lastReported ? "de la última lectura" : "disponibles"}`,
    unavailable: "No disponible",
    expiries: "Próximos reinicios notificados",
    expiring: (count: number) => `${count} crédito de reinicio caduca en 24 horas.`,
    expired: "Un reinicio notificado ya pasó. Actualiza el inventario para ver los créditos que quedan.",
    stale: "Actualiza el inventario para ver la disponibilidad actual.",
    details: "Ver fechas de caducidad",
    credit: (index: number) => `Reinicio ${index}`,
    expiryUnavailable: "Caducidad no disponible",
    incomplete: "Algunas fechas de caducidad no están disponibles.",
    expiry: {
      unavailable: "Caducidad no disponible",
      pending: "…",
      expired: "Caducado · actualiza el inventario",
    },
    status: esStatus,
  } satisfies typeof resetInventoryLabels;

export const esProvider = {
  connectedProvider: "Proveedor conectado",
    noQuota: "Este proveedor no informa de cuota.",
    resets: "Se reinicia",
    percent: (value: number) => `${Math.round(value)} %`,
    reset: esReset,
  } satisfies typeof providerCardLabels;

export const es = {
  routingExplanation: {
    text: "El piloto automático elige una cuenta apta del mismo proveedor. Las cuentas fijadas conservan la suya. No cambia de modelo ni de proveedor.",
  } satisfies typeof routingExplanationLabels,
  routingPolicyForm: {
    enable: (provider: string) => `Activar el piloto automático de ${provider}`,
    enabledHint: "La cuenta mejor situada recibe la siguiente petición sin fijar.",
    disabledHint: "Las peticiones sin fijar usan la cuenta activa.",
    threshold: "Omitir cuentas a partir de este uso de cuota (%)",
    saving: "Guardando…",
    save: "Guardar preferencias de encaminamiento",
  } satisfies typeof routingPolicyFormLabels,
  balance: {
    title: "Saldo de crédito",
    available: "Saldo disponible",
    notReported: "Sin datos",
    subscription: "Suscripción",
    purchased: "Créditos comprados",
    status: {},
  } satisfies typeof balanceCardLabels,
  status: esStatus,
  reset: esReset,
  provider: esProvider,
  sources: {
    sources: (count: number) => `Uso de ${count} origen local`,
  } satisfies typeof linkedAccountUsageLabels,
  consumption: {
    ...consumptionViewLabels,
    tokens: "Tokens",
    recordedBy: (incomplete: boolean) =>
      `Registrado por tus clientes${incomplete ? " · recuento incompleto" : ""}`,
    knownCost: "Coste conocido",
    knownCostNote: (partial: boolean) =>
      partial ? "Parcial · faltan datos o precios" : "Costes informados y estimaciones a precio de lista",
    sourcesWithData: "Orígenes con datos",
    sourcesNote: "Consumo local, aparte del tráfico del proxy y de las cuotas",
    breakdown: "Desglose del consumo",
    groupBy: "Agrupar por",
    groupOptions: {
      daily: "Día",
      period_totals: "Totales de sesión o cuenta",
      clients: "Cliente",
      models: "Modelo",
      sessions: "Sesión",
      projects: "Proyecto",
    },
    groupHeadings: {
      daily: "Día",
      period_totals: "Total",
      clients: "Cliente",
      models: "Modelo",
      sessions: "Sesión",
      projects: "Proyecto",
    },
    requests: "Peticiones",
    tokensColumn: "Tokens",
    knownCostColumn: "Coste conocido",
    partial: " · parcial",
    empty: "No hay uso registrado en este periodo.",
    sessionTotalsNote:
      "Algunos orígenes informan de totales de sesión o cuenta. Están en «Totales de sesión o cuenta»; no se reparten por día.",
    sourceStatus: "Estado de los orígenes",
    states: {
      ready: "listo",
      no_activity: "sin actividad",
      no_data: "sin datos",
      needs_connection: "necesita conexión",
      unsupported_format: "formato no admitido",
      partial: "parcial",
      error: "error",
    },
  } satisfies typeof consumptionViewLabels,
  apiKeyForm: {
    title: "Conectar con una clave de API",
    description: "Usa una clave que ya tengas. Las peticiones se facturan a la API de ese proveedor.",
    saving: "Guardando…",
    save: "Guardar clave de API",
    saved: (provider: string, alias: string) =>
      `Guardado ${provider}/${alias}. La clave no se ha comprobado con el proveedor.`,
  } satisfies typeof apiKeyFormLabels,
  apiKeyFields: {
    provider: "Proveedor",
    account: "Nombre de la cuenta",
    secret: "Clave de API",
  } satisfies typeof apiKeyFieldsLabels,
  review: {
    region: "Revisión del traslado",
    from: "Desde",
    to: "Hasta",
    copyApiKey: "Se copia la clave de API. La cuenta importada empieza inactiva.",
    authorizeOAuth: "Autoriza una conexión OAuth nueva en el destino. Los tokens existentes nunca se copian.",
    note: "Las cuentas de origen siguen disponibles. Las importadas no cambian tu cuenta activa ni el encaminamiento.",
  } satisfies typeof migrationReviewLabels,
  accounts: {
    region: "Cuentas sincronizadas",
    title: "Cuentas de tus máquinas",
    description:
      "Tu uso sincronizado. Autoriza un proveedor en ai-relay para usarlo a través del proxy alojado.",
    verified: "Identidad verificada",
    synchronized: "Uso sincronizado",
    installation: (device: string) => `Instalación ${device}`,
    stale: "Última lectura conocida · ",
    localHistory: "Historial del registro local",
    localHistoryDescription:
      "Estos registros pueden tener varias cuentas y solaparse con las peticiones del relay. Los totales van aparte.",
    estimate: (tokens: string, usd: string) => `${tokens} tokens · ~${usd} $ a precio de lista`,
    partial: " (parcial)",
    dailyUsage: "Uso diario",
    date: "Fecha",
    tokens: "Tokens",
    estimatedCost: "Coste estimado",
    provider: {},
  } satisfies typeof synchronizedAccountsLabels,
  history: {
    title: "Historial privado",
    region: "Historial privado",
    loading: "Cargando el historial privado…",
    emptyTitle: "Todavía no hay observaciones sincronizadas",
    emptyDescription:
      "Las observaciones llegan cuando una instalación de Spanreed comparte cuota o peticiones con este relay.",
    loadOlder: "Cargar observaciones anteriores",
    loadingOlder: "Cargando observaciones anteriores…",
    machine: "máquina",
    kinds: { quota: "Lectura de cuota", history: "Muestra de límite", request: "Petición" },
    quotaPercent: (label: string, percent: string) => `${label}: ${percent} %`,
    quotaOf: (used: string, limit: string) => `${used} de ${limit}`,
    quotaNotReported: "Cuota no informada",
    quotaLine: (label: string, value: string) => `${label}: ${value}`,
    historyLine: (label: string, amount: string, resets: string | null) =>
      `${label}: ${amount}.${resets ? ` Se reinicia ${resets}.` : ""}`,
    requestLine: (model: string, input: string, output: string) => `${model} · ${input} de entrada · ${output} de salida`,
    unknownModel: "Modelo desconocido",
    zero: "0",
  } satisfies typeof privateHistoryLabels,
};
