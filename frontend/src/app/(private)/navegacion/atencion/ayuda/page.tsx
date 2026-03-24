"use client";

import React, { useState } from "react";
import { 
  Search, LifeBuoy, Mail, Phone, ChevronRight, 
  BookOpen, Activity, Users, Calendar, 
  FileSpreadsheet, ShieldAlert, Stethoscope,
  ClipboardList, User 
} from "lucide-react";

const EXTENDED_FAQS = [
    {
        category: "📊 Panel de Atención y Filtros",
        icon: <Activity className="text-emerald-500" size={24}/>,
        items: [
            { 
                q: "¿Qué significan los indicadores (KPIs) de mi Panel de Atención?", 
                a: <>
                    <p className="mb-3">Tu panel superior te brinda una radiografía exacta de tu carga laboral. Se divide en 4 métricas:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>En Navegación:</strong> Es el universo total de pacientes asignados a tu gestión.</li>
                        <li><strong>Gestión Exitosa:</strong> Trámites que ya lograste llevar a feliz término (marcados como "Realizados"). Es el indicador de tu efectividad.</li>
                        <li><strong>Pendientes:</strong> <span className="text-orange-600 font-bold">¡Tu prioridad número uno!</span> Representa la cantidad de casos que están estancados o que acaban de ingresar al sistema y nadie los ha tocado.</li>
                        <li><strong>Citas:</strong> Pacientes que ya tienen un agendamiento futuro programado y están a la espera de ser atendidos.</li>
                    </ul>
                </>
            },
            { 
                q: "¿Cómo encuentro a un paciente específico rápidamente?", 
                a: <>
                    <p className="mb-2">El <strong>Motor de Búsqueda Rápida</strong> es tu mejor aliado. Está diseñado para buscar en tiempo real sin necesidad de presionar "Enter". Puedes escribir:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>El número de cédula exacto.</li>
                        <li>Nombres o apellidos del paciente.</li>
                        <li>El código CUPS del procedimiento que estás buscando.</li>
                    </ul>
                    <p className="mt-2 text-sm italic text-slate-500">Tip pro: Si necesitas buscar un grupo específico, usa los filtros desplegables para cruzar datos (Ej: Ver todos los pacientes de "Asmet Salud" que estén en estado "Agendado" entre el 1 y el 15 del mes).</p>
                </>
            },
            { 
                q: "¿Cómo actualizo el estado de 20 pacientes al mismo tiempo?", 
                a: <>
                    <p className="mb-2">Para evitar que edites paciente por paciente, diseñamos la <strong>Gestión de Grupo (Acción Masiva)</strong>:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>En la tabla de tu panel, marca las casillas cuadradas (checkbox) que están a la izquierda del nombre de cada paciente que deseas actualizar.</li>
                        <li>Notarás que aparece un botón flotante oscuro en la parte inferior de tu pantalla indicando el número de seleccionados.</li>
                        <li>Haz clic en ese botón flotante. Se abrirá una ventana de Actualización Operativa.</li>
                        <li>Selecciona el nuevo estado (ej. "Citar Pacientes") y escribe una nota de evolución que aplique para todos (ej. "Jornada de ecografías confirmada para el sábado").</li>
                        <li>Haz clic en "Guardar Cambios". El sistema registrará el evento individualmente en el historial de cada paciente seleccionado al instante.</li>
                    </ol>
                </>
            }
        ]
    },
    {
        category: "👥 Directorio y Expediente Clínico 360°",
        icon: <Users className="text-teal-500" size={24}/>,
        items: [
            { 
                q: "¿Qué herramientas encuentro dentro del Perfil del Paciente?", 
                a: <>
                    <p className="mb-3">El Perfil del Paciente es la central de mando individual. Al hacer clic en el ícono del "Ojo" en la tabla, accederás a:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Botón de WhatsApp Integrado:</strong> Verás un botón verde bajo el contacto del paciente. Al presionarlo, el sistema abrirá automáticamente WhatsApp (Web o App) iniciando un chat con el paciente, ahorrándote tener que guardar su número en tus contactos.</li>
                        <li><strong>Historia de Gestión (Timeline):</strong> Una línea de tiempo inmodificable que muestra todo el recorrido del paciente. Verás exactamente qué día se solicitó el servicio, qué fecha de cita se le dio, y todas las notas clínicas escritas por ti o tus compañeros, con fecha, hora y autor.</li>
                        <li><strong>Panel de Edición:</strong> Botones superiores para corregir los datos demográficos (Dirección, Teléfono, EPS) o descargar la historia completa en formato PDF para impresión o envío.</li>
                    </ul>
                </>
            },
            { 
                q: "¿Cómo registro a un paciente nuevo que no vino en el Excel de la EPS?", 
                a: <>
                    <p className="mb-2">Si llegó un paciente "incidente" de forma presencial o por ventanilla:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>Dirígete a la pestaña <strong>"Directorio"</strong> en el menú principal.</li>
                        <li>Haz clic en el botón oscuro <strong>"Registrar Paciente"</strong>.</li>
                        <li>Llena el formulario con cuidado. Los campos con asterisco rojo (<span className="text-rose-500">*</span>) como Cédula, Nombres y Apellidos son estrictamente obligatorios.</li>
                        <li>Es vital que registres correctamente el número de celular para que el botón de WhatsApp funcione en el futuro.</li>
                        <li>Una vez guardado, el paciente quedará en estado "ACTIVO" listo para que le asignes su primer trámite o procedimiento.</li>
                    </ol>
                </>
            }
        ]
    },
    {
        category: "🏥 Flujo de Trámites, Notas y Barreras",
        icon: <Stethoscope className="text-blue-500" size={24}/>,
        items: [
            { 
                q: "¿Cómo registro que contacté a un paciente o le tramité una autorización?", 
                a: <>
                    <p className="mb-2">Para dejar trazabilidad de tu trabajo diario:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Actualizar un trámite que ya existe:</strong> En la tabla de tu Panel de Atención, busca al paciente y haz clic en "Gestionar Ahora" (el ícono del lápiz). Allí podrás cambiar su estado, agregar la fecha de la cita y escribir en el cuadro de "Nota de Evolución" qué hablaste con el paciente.</li>
                        <li><strong>Agregar un nuevo trámite a un paciente antiguo:</strong> Ve al perfil del paciente y haz clic en el botón esmeralda "Nuevo Seguimiento". Esto abrirá una ficha en blanco para que registres una nueva solicitud de servicio (ej. Si el paciente venía por Quimioterapia y ahora le ordenaron un Laboratorio).</li>
                    </ul>
                </>
            },
            { 
                q: "¿Qué significan los Estados y cuál debo usar?", 
                a: <>
                    <p className="mb-3">El éxito de las métricas de la clínica depende de que uses el estado correcto:</p>
                    <ul className="space-y-3">
                        <li><span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded text-xs">🟠 PENDIENTE</span> <br/>El trámite recién fue cargado al sistema. Nadie de tu equipo lo ha tocado o procesado aún.</li>
                        <li><span className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-xs">🟡 EN GESTIÓN</span> <br/>Ya iniciaste el proceso. Significa que solicitaste autorización a la EPS, radicaste documentos o llamaste al paciente y no contestó. El trámite "se está moviendo" pero no tiene fecha fija.</li>
                        <li><span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-xs">🔵 AGENDADO</span> <br/>¡Logro intermedio! El paciente ya tiene una clínica asignada, fecha y hora confirmada para su procedimiento.</li>
                        <li><span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-xs">🟢 REALIZADO</span> <br/>Cierre de ciclo. El paciente asistió a su cita médica satisfactoriamente.</li>
                        <li><span className="bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded text-xs">🔴 CANCELADO</span> <br/>El trámite "murió". Se usa si el paciente rechazó el servicio, la orden médica se venció o el paciente falleció.</li>
                    </ul>
                </>
            },
            { 
                q: "El paciente no contesta o la EPS no autoriza. ¿Dónde registro esto?", 
                a: "Al momento de editar la gestión del paciente, verás un recuadro rojo llamado 'Barrera de Acceso Detectada'. Si seleccionas opciones como 'No contesta', 'Teléfono Apagado' o 'Sin Autorización', el sistema pintará una alerta visible en el expediente del paciente. Esto es vital para justificar por qué los pacientes se están demorando en recibir atención."
            }
        ]
    },
    {
        category: "📅 Calendario y Mi Agenda",
        icon: <Calendar className="text-purple-500" size={24}/>,
        items: [
            { 
                q: "¿Tengo que agregar las citas al calendario a mano?", 
                a: "¡No! El módulo 'Mi Agenda' es 100% inteligente y automático. Cuando entras al editor de gestión de un paciente, simplemente cambia su estado a 'AGENDADO' y selecciona el día en el campo 'Fecha de la Cita'. Al presionar Guardar, el sistema dibujará automáticamente el evento en el calendario."
            },
            { 
                q: "¿Qué significan los colores de los cuadros en el calendario?", 
                a: <>
                    <p className="mb-2">Diseñamos el calendario para que identifiques el tipo de servicio con un solo vistazo a los colores:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong className="text-emerald-600">Verde Esmeralda:</strong> Consultas Especializadas.</li>
                        <li><strong className="text-teal-600">Verde Azulado (Teal):</strong> Quimioterapias.</li>
                        <li><strong className="text-cyan-600">Celeste:</strong> Radioterapias.</li>
                        <li><strong className="text-rose-600">Rojo:</strong> Procedimientos Quirúrgicos (Cirugías).</li>
                        <li><strong className="text-indigo-600">Índigo / Morado:</strong> Imagenología (Rayos X, TACS).</li>
                        <li><strong className="text-blue-600">Azul Rey:</strong> Laboratorios Clínicos.</li>
                    </ul>
                </>
            },
            { 
                q: "¿Puedo revisar los datos del paciente desde el Calendario sin salir de ahí?", 
                a: "Totalmente. Si haces clic sobre cualquier evento (cuadro de color) de tu calendario mensual, se desplegará una barra lateral a la derecha. Allí verás el nombre del paciente, su EPS, el código CUPS, las notas que dejaste y dos botones directos para llamarlo por teléfono o enviarle un WhatsApp."
            }
        ]
    },
    {
        category: "🚨 Alertas y Casos de Soporte",
        icon: <ShieldAlert className="text-rose-500" size={24}/>,
        items: [
            { 
                q: "¿Qué reviso en el Panel de Alertas?", 
                a: "Este panel te ayuda a que nada se te escape. Te mostrará 'Inconsistencias' (si por error pusiste que la cita fue antes que la fecha de solicitud) y 'Retrasos Críticos' (pacientes que llevan más de 30 días en estado Pendiente). Desde ahí mismo tienes un botón para ir a gestionar esos casos urgentes."
            },
            { 
                q: "¿Para qué sirve el módulo de 'Casos'?", 
                a: "Es un sistema de tickets (Live API) donde caen solicitudes de soporte técnico o requerimientos especiales (ej. un paciente pide reagendamiento). Verás la prioridad del caso (Urgente, Media, Baja) y tendrás un atajo para agendar la solución sin perder el hilo."
            }
        ]
    },
    {
        category: "📂 Importación Masiva (Excel / CSV)",
        icon: <FileSpreadsheet className="text-amber-500" size={24}/>,
        items: [
            { 
                q: "¿Cómo cargo la base de datos o censo enviado por la EPS?", 
                a: <>
                    <p className="mb-2">El <strong>Cargador de Inteligencia de Datos</strong> procesa miles de filas de forma segura:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>En el menú principal, entra a "Carga Masiva".</li>
                        <li>Haz clic en el recuadro central para abrir el explorador de archivos, o simplemente arrastra y suelta tu archivo Excel (.xlsx, .xls) o CSV sobre el recuadro.</li>
                        <li>Verás el peso del archivo confirmando que está listo.</li>
                        <li>Haz clic en "Iniciar Carga Masiva". <strong>IMPORTANTE:</strong> No cierres ni recargues la página mientras el ícono esté girando. El sistema está leyendo y creando perfiles.</li>
                    </ol>
                </>
            },
            { 
                q: "Si subo el Excel dos veces, ¿Se duplican los pacientes?", 
                a: "¡No te preocupes! El sistema tiene un motor inteligente. Si detecta una Cédula que ya existe en Vidanova, NO creará un paciente duplicado; simplemente leerá el nuevo procedimiento que viene en el Excel y se lo añadirá al historial del paciente existente, dejándolo en estado 'PENDIENTE'."
            },
            { 
                q: "Me equivoqué de archivo al arrastrarlo. ¿Qué hago?", 
                a: "Si seleccionaste el Excel equivocado y aún no has presionado 'Iniciar Carga Masiva', simplemente haz clic en el ícono rojo de la papelera que aparece flotando en la esquina superior derecha del archivo cargado. Esto limpiará la zona para que puedas subir el correcto."
            }
        ]
    },
    {
        category: "⚙️ Configuración y Mi Cuenta",
        icon: <User className="text-slate-500" size={24}/>,
        items: [
            { 
                q: "¿Cómo actualizo mi número de teléfono y mi perfil?", 
                a: "En el menú haz clic en 'Configuración'. En la pestaña 'Mi Perfil' podrás actualizar tus Nombres, Correo electrónico, Teléfono de Contacto (WhatsApp) y tu biografía. Recuerda hacer clic en 'Actualizar Datos' al final para que el sistema guarde los cambios."
            },
            { 
                q: "¿Cómo cambio mi contraseña de ingreso al sistema?", 
                a: "Dentro de 'Configuración', ve a la pestaña 'Seguridad'. El sistema te pedirá ingresar tu contraseña actual, y luego escribir la nueva clave dos veces para evitar errores. Por protección, el sistema te cerrará la sesión automáticamente apenas cambies la clave para que vuelvas a ingresar con la nueva."
            }
        ]
    }
];

export default function AyudaAtencionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Filtrado de FAQs basado en la búsqueda (escanea tanto Pregunta como Respuesta)
  const filteredFaqs = EXTENDED_FAQS.map(section => ({
      ...section,
      items: section.items.filter(item => {
          const qMatch = item.q.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Extraemos el texto plano de la respuesta JSX para poder buscar dentro de ella
          let aText = "";
          if (typeof item.a === 'string') {
              aText = item.a.toLowerCase();
          } else if (React.isValidElement(item.a)) {
              aText = JSON.stringify(item.a).toLowerCase();
          }

          const aMatch = aText.includes(searchTerm.toLowerCase());
          const catMatch = section.category.toLowerCase().includes(searchTerm.toLowerCase());
          
          return qMatch || aMatch || catMatch;
      })
  })).filter(section => section.items.length > 0);

  return (
    <div className="w-full min-h-screen bg-[#FDFDFD] font-sans text-slate-800 pb-24">
      
      {/* HEADER HERO (TEMA ESMERALDA OPERATIVO) */}
      <div className="bg-emerald-600 px-6 py-16 md:py-24 text-center rounded-b-[3rem] shadow-xl shadow-emerald-900/10 mb-10 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <ClipboardList size={400} strokeWidth={1} />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto">
              <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md text-white rounded-3xl mb-6 shadow-inner border border-white/20">
                  <LifeBuoy size={40} />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                  Base de Conocimientos
              </h1>
              <p className="text-lg md:text-xl text-emerald-50 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
                  Resuelve tus dudas operativas rápidamente. Aprende a dominar las herramientas de navegación y gestión de pacientes en Vidanova.
              </p>

              {/* BUSCADOR ROBUSTO */}
              <div className="relative max-w-2xl mx-auto group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <Search className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={24} />
                  </div>
                  <input 
                      type="text" 
                      placeholder="¿Qué necesitas hacer? (Ej: Importar, Agendar, Cambiar estado...)" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-white border-none rounded-2xl shadow-2xl text-slate-800 font-bold text-lg focus:ring-4 focus:ring-emerald-400/30 outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                  />
              </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
          
          {/* RESULTADOS DE BÚSQUEDA */}
          {filteredFaqs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-4"/>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No encontramos resultados precisos</h3>
                  <p className="text-slate-500 font-medium">Intenta buscando con palabras más simples o generales.</p>
              </div>
          ) : (
              <div className="space-y-8">
                  {filteredFaqs.map((section, idx) => (
                      <div key={idx} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                          {/* Cabecera de Categoría */}
                          <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                  {section.icon}
                              </div>
                              <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm md:text-base">
                                  {section.category}
                              </h2>
                          </div>
                          
                          {/* Lista de Preguntas */}
                          <div className="divide-y divide-slate-100">
                              {section.items.map((item, i) => {
                                  const uniqueId = idx * 100 + i;
                                  const isOpen = expandedFaq === uniqueId;
                                  return (
                                      <div key={i} className={`group transition-all duration-300 ${isOpen ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                                          <button 
                                              onClick={() => setExpandedFaq(isOpen ? null : uniqueId)} 
                                              className="w-full flex items-center justify-between p-8 text-left cursor-pointer focus:outline-none"
                                          >
                                              <span className={`font-bold text-base md:text-lg pr-8 transition-colors ${isOpen ? 'text-emerald-700' : 'text-slate-700 group-hover:text-emerald-600'}`}>
                                                  {item.q}
                                              </span>
                                              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-emerald-600 text-white rotate-90 shadow-md' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                                                  <ChevronRight size={20} />
                                              </div>
                                          </button>
                                          
                                          {/* Respuesta (Acordeón) */}
                                          <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-8' : 'grid-rows-[0fr] opacity-0'}`}>
                                              <div className="overflow-hidden px-8">
                                                  <div className="text-base text-slate-600 leading-relaxed bg-white/80 p-6 rounded-2xl border border-emerald-100/50 shadow-sm font-medium">
                                                      {item.a}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* TARJETA DE SOPORTE TÉCNICO ESCALADO */}
          <div className="mt-16 bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-5 text-white pointer-events-none">
                  <LifeBuoy size={200} />
              </div>
              <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white mb-2">¿Encontraste un error en el sistema?</h3>
                  <p className="text-slate-400 font-medium max-w-md">Si el sistema no carga, la pantalla se queda en blanco o no puedes ingresar con tu clave, repórtalo de inmediato.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto relative z-10">
                  <a href="mailto:soporte@vidanova.com" className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all backdrop-blur-sm">
                      <Mail size={18} className="text-emerald-400"/> Enviar Reporte
                  </a>
                  <a href="tel:+576028200000" className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-900/50">
                      <Phone size={18}/> Contactar a IT
                  </a>
              </div>
          </div>
      </div>
    </div>
  );
}