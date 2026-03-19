"use client";

import React, { useState } from "react";
import { 
  Search, LifeBuoy, Mail, Phone, ChevronRight, 
  BookOpen, LayoutDashboard, Users, Calendar, 
  FileSpreadsheet, Activity, ShieldCheck, PieChart, Settings
} from "lucide-react";

// --- BASE DE CONOCIMIENTO (SÚPER ROBUSTA Y DETALLADA) ---
const EXTENDED_FAQS = [
    {
        category: "📊 Torre de Control y Panel Operativo",
        icon: <LayoutDashboard className="text-blue-500" size={24}/>,
        items: [
            { 
                q: "¿Qué me muestran los indicadores principales (KPIs)?", 
                a: <>
                    <p className="mb-2">La Torre de Control te da una radiografía instantánea de tu operación diaria. Verás 4 bloques clave:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Total de Registros/Navegación:</strong> Es tu universo completo de pacientes en el sistema.</li>
                        <li><strong>Gestión Completa/Exitosa:</strong> Pacientes cuyo trámite ya se marcó como "Realizado". ¡Es tu meta!</li>
                        <li><strong>Pendientes/En Gestión:</strong> Tu prioridad operativa. Casos que requieren que los llames, audites o tramites.</li>
                        <li><strong>Agendados:</strong> Casos que ya tienen una cita futura asignada en el calendario.</li>
                    </ul>
                </>
            },
            { 
                q: "¿Cómo uso el Motor de Búsqueda y los Filtros Inteligentes?", 
                a: <>
                    <p className="mb-2">No pierdas tiempo buscando manualmente fila por fila. Utiliza nuestras herramientas de filtrado:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Búsqueda Rápida:</strong> Escribe un nombre, número de cédula, código CUPS o una palabra clave de la observación. El sistema filtra mientras escribes.</li>
                        <li><strong>Filtros Combinados:</strong> Puedes mezclar opciones. Por ejemplo, selecciona la EPS "Sanitas", estado "Pendiente" y modalidad "Quimioterapia" para obtener un listado exacto de a quién debes gestionar hoy.</li>
                        <li><strong>Filtro por Diagnóstico (CAC):</strong> Selecciona un grupo de patología (Ej: CAC Mama o CAC Próstata) para focalizar tu atención en poblaciones de alto riesgo.</li>
                    </ul>
                </>
            },
            { 
                q: "¿Qué significan los colores en la tabla de pacientes?", 
                a: <>
                    <p className="mb-2">La tabla utiliza <strong>semaforización inteligente</strong> para alertarte sobre los tiempos de atención:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Fila Normal (Gris/Blanco):</strong> El paciente está dentro de los tiempos regulares de espera.</li>
                        <li><strong>Fila con borde Rojo / Días en Rojo:</strong> ¡Alerta! El paciente ha superado los 15 días (o la meta establecida) desde su fecha de solicitud. Requiere atención urgente.</li>
                        <li><strong>Fila Verde:</strong> Trámite exitoso y finalizado.</li>
                        <li><strong>Fila Opaca/Tachada:</strong> El trámite fue cancelado, desistido o el paciente no asistió.</li>
                    </ul>
                </>
            },
            { 
                q: "¿Cómo funciona la Acción Masiva de pacientes?", 
                a: <>
                    <p className="mb-2">Ideal para cuando haces gestiones en bloque (ej. agendar 10 pacientes en la misma clínica). Para usarla:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>Marca las casillas cuadradas a la izquierda de los pacientes en la tabla.</li>
                        <li>Aparecerá un botón flotante oscuro en la parte inferior de la pantalla. Haz clic en él.</li>
                        <li>Selecciona el nuevo estado (ej. "Agendado").</li>
                        <li>Escribe una nota de evolución general (ej. "Asignación de citas masiva para el mes actual").</li>
                        <li>Guarda los cambios. El sistema actualizará a todo el grupo en un solo segundo.</li>
                    </ol>
                </>
            }
        ]
    },
    {
        category: "👥 Directorio y Expediente del Paciente",
        icon: <Users className="text-emerald-500" size={24}/>,
        items: [
            { 
                q: "¿Qué encuentro en el Perfil 360 del paciente?", 
                a: <>
                    <p className="mb-2">Es la hoja de vida digital del paciente. Desde su perfil puedes ver:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Sus datos de identificación y EPS activa.</li>
                        <li>Su ubicación (Ciudad/Departamento) y datos de contacto.</li>
                        <li><strong>Botón de WhatsApp:</strong> Un ícono verde que al presionarlo abre un chat directo con el paciente en tu celular o web.</li>
                        <li><strong>Línea de Tiempo (Historial):</strong> Un registro cronológico de cada llamada, autorización, cita médica o nota que todo tu equipo ha registrado sobre este paciente.</li>
                    </ul>
                </>
            },
            { 
                q: "¿Cómo descargo la Historia Clínica en PDF?", 
                a: "Dentro del perfil del paciente, en la parte superior derecha, encontrarás un botón llamado 'PDF'. Al hacer clic, el sistema generará un documento formal tamaño A4 con el membrete de Vidanova, datos del paciente y todo su historial clínico. Puedes imprimirlo directamente o guardarlo como archivo PDF."
            },
            { 
                q: "¿Qué pasa si elimino a un paciente?", 
                a: "Al eliminar a un paciente desde el panel de edición, se borrarán de manera irreversible sus datos personales y todo su historial de seguimientos/citas del sistema. Por seguridad, el sistema te pedirá confirmación. Hazlo solo si el paciente fue creado por error o si se trata de un registro duplicado."
            }
        ]
    },
    {
        category: "🏥 Registros Clínicos y Evolución",
        icon: <Activity className="text-rose-500" size={24}/>,
        items: [
            { 
                q: "¿Cómo registro una gestión o avance médico?", 
                a: <>
                    <p className="mb-2">Existen dos formas de hacerlo:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Nuevo Seguimiento:</strong> Desde el perfil del paciente, haz clic en "Nuevo Seguimiento". Úsalo para registrar un procedimiento nuevo desde cero.</li>
                        <li><strong>Editar Gestión:</strong> En la tabla principal (Torre de Control), haz clic en el ícono del Lápiz. Úsalo para actualizar un trámite existente (ej. pasar un laboratorio de "Pendiente" a "Realizado").</li>
                    </ul>
                </>
            },
            { 
                q: "¿Qué significan los Estados de Gestión?", 
                a: <>
                    <p className="mb-2">Determinan la ruta del paciente en el sistema:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>🟠 PENDIENTE:</strong> Recién ingresado, nadie lo ha tocado.</li>
                        <li><strong>🟡 EN GESTIÓN:</strong> Ya lo llamaste, pediste autorización, o estás tramitando con la clínica. Aún no tiene fecha definida.</li>
                        <li><strong>🔵 AGENDADO:</strong> Ya tiene una fecha y hora exactas para su procedimiento. (Aparecerá en el calendario).</li>
                        <li><strong>🟢 REALIZADO:</strong> Trámite completado exitosamente. Cierra el ciclo.</li>
                        <li><strong>🔴 CANCELADO:</strong> El paciente desistió, no asistió, o la orden venció.</li>
                    </ul>
                </>
            },
            { 
                q: "¿Para qué sirve el registro de Barreras de Acceso?", 
                a: "Es fundamental para la auditoría de calidad. Si no puedes agendar a un paciente porque 'No contesta el teléfono' o 'No hay agenda en la clínica', debes registrarlo en el campo 'Barrera Detectada'. Esto permite a gerencia tomar decisiones y reportar fallas en la red prestadora (EPS/Clínicas)."
            }
        ]
    },
    {
        category: "📅 Agenda Médica",
        icon: <Calendar className="text-purple-500" size={24}/>,
        items: [
            { 
                q: "¿Tengo que agregar las citas manualmente al Calendario?", 
                a: "¡No! El calendario es 100% automático. Cuando ingresas a gestionar a un paciente, le cambias el estado a 'AGENDADO' y le colocas una 'Fecha de Cita', el sistema lo inyecta instantáneamente en tu calendario mensual."
            },
            { 
                q: "¿Qué significan los colores en el calendario?", 
                a: "Para que no tengas que leer cada evento, el sistema usa colorimetría clínica: Azul para Consultas Generales, Índigo para Quimioterapias, Violeta para Radioterapias, Rojo para Cirugías, Verde/Cyan para Imágenes y Celeste para Laboratorios."
            },
            { 
                q: "¿Puedo ver los detalles de la cita desde el Calendario?", 
                a: "Sí. Haz clic sobre cualquier evento (cuadro de color) en el calendario. Se abrirá una tarjeta a la derecha mostrando la EPS, el nombre del procedimiento, el contacto del paciente y las observaciones. Desde ahí mismo puedes saltar al expediente completo del paciente."
            }
        ]
    },
    {
        category: "📂 Importación y Maestros de Datos",
        icon: <FileSpreadsheet className="text-amber-500" size={24}/>,
        items: [
            { 
                q: "¿Cómo funciona la subida masiva de Excel?", 
                a: <>
                    <p className="mb-2">El Cargador de Inteligencia de Datos te permite subir miles de pacientes en segundos:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>Ve a 'Carga Masiva' en el menú.</li>
                        <li>Arrastra tu archivo Excel o CSV proporcionado por la EPS.</li>
                        <li>El sistema leerá las columnas. Si detecta que un paciente no existe, lo crea automáticamente. Si detecta que ya existe, solo le agregará el nuevo procedimiento solicitado en estado 'PENDIENTE'.</li>
                        <li>El motor anti-errores ignorará filas vacías o datos basura.</li>
                    </ol>
                </>
            },
            { 
                q: "¿Qué es el Maestro de Procedimientos (Configuración CUPS)?", 
                a: "A veces, las clínicas envían descripciones extrañas de los servicios. El Maestro de Procedimientos lee los códigos CUPS importados y usa Inteligencia para clasificarlos (Ej: Lee 'GAMAGRAFIA OSEA' y lo clasifica como 'RADIOTERAPIA'). Si el sistema no sabe cómo clasificar uno nuevo, lo mandará a la sección de 'Sin Clasificar' para que tú le asignes la categoría correcta manualmente y el sistema aprenda."
            }
        ]
    },
    {
        category: "📈 Auditoría y Analítica",
        icon: <PieChart className="text-cyan-500" size={24}/>,
        items: [
            { 
                q: "¿Qué soluciona la Auditoría de Datos?", 
                a: "Es el policía del sistema. La auditoría rastrea tres problemas críticos: 1) Registros duplicados subidos por error humano, 2) Fechas inconsistentes (ej. Una fecha de cita que es anterior a la fecha en que se solicitó el servicio) y 3) Trámites 'vencidos' que llevan más de 30 días sin gestión. Te permite limpiarlos o corregirlos con un solo clic."
            },
            { 
                q: "¿Qué es el Rastro de Actividad (Logs)?", 
                a: "Por normatividad médica, el sistema guarda un registro inmutable de quién hace qué. En la pestaña de Auditoría, puedes ver una línea de tiempo indicando qué usuario eliminó a un paciente, qué usuario cambió un estado, o a qué hora se subió un Excel. Esto garantiza la transparencia del equipo."
            },
            { 
                q: "¿Puedo exportar la información del sistema?", 
                a: "Sí. En el menú lateral izquierdo encontrarás el botón 'Exportar Base de Datos / Backup'. Esto te descargará una sábana de Excel con toda la información cruda y actualizada de los pacientes y sus estados, perfecta para entregar reportes de gestión a las aseguradoras."
            }
        ]
    },
    {
        category: "⚙️ Configuración y Accesos",
        icon: <Settings className="text-slate-500" size={24}/>,
        items: [
            { 
                q: "¿Cómo creo o elimino a miembros de mi equipo?", 
                a: "Si tienes permisos de Administrador o Coordinador, entra al módulo de 'Configuración' y selecciona la pestaña 'Equipo'. Desde ahí podrás invitar nuevos miembros, asignarles un Rol (Operativo, Coordinador o Admin), editar sus datos o bloquear su acceso eliminándolos del sistema."
            },
            { 
                q: "¿Cómo cambio mi contraseña o mis datos personales?", 
                a: "Ve a 'Configuración'. En 'Mi Perfil' puedes actualizar tu nombre, teléfono, cargo y sede de trabajo. En la pestaña 'Seguridad' podrás cambiar tu contraseña actual por una nueva. Recuerda que, por seguridad, el sistema cerrará tu sesión automáticamente tras cambiar la clave."
            }
        ]
    }
];

export default function AyudaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Filtrado de FAQs basado en la búsqueda
  const filteredFaqs = EXTENDED_FAQS.map(section => ({
      ...section,
      items: section.items.filter(item => {
          // Buscamos tanto en la pregunta como en el contenido (al ser JSX, extraemos el texto para buscar)
          const qMatch = item.q.toLowerCase().includes(searchTerm.toLowerCase());
          return qMatch || section.category.toLowerCase().includes(searchTerm.toLowerCase());
      })
  })).filter(section => section.items.length > 0);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-24">
      
      {/* HEADER HERO */}
      <div className="bg-blue-600 px-6 py-16 md:py-24 text-center rounded-b-[3rem] shadow-xl shadow-blue-900/10 mb-10 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <Activity size={400} strokeWidth={1} />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md text-white rounded-3xl mb-6 shadow-inner border border-white/20">
                  <LifeBuoy size={40} />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                  Centro de Conocimiento
              </h1>
              <p className="text-lg md:text-xl text-blue-100 font-medium leading-relaxed mb-10">
                  Descubre cómo dominar Vidanova. Encuentra guías operativas, resuelve dudas y optimiza la navegación de tus pacientes.
              </p>

              {/* BUSCADOR */}
              <div className="relative max-w-xl mx-auto group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={22} />
                  </div>
                  <input 
                      type="text" 
                      placeholder="Busca una duda (Ej: Importación, Filtros, Estados...)" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-2xl text-slate-800 font-bold text-lg focus:ring-4 focus:ring-blue-400/30 outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                  />
              </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
          
          {/* RESULTADOS DE BÚSQUEDA */}
          {filteredFaqs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-4"/>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No encontramos respuestas</h3>
                  <p className="text-slate-500 font-medium">Intenta buscando con palabras más generales.</p>
              </div>
          ) : (
              <div className="space-y-8">
                  {filteredFaqs.map((section, idx) => (
                      <div key={idx} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                          <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                  {section.icon}
                              </div>
                              <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm md:text-base">
                                  {section.category}
                              </h2>
                          </div>
                          <div className="divide-y divide-slate-100">
                              {section.items.map((item, i) => {
                                  const uniqueId = idx * 100 + i;
                                  const isOpen = expandedFaq === uniqueId;
                                  return (
                                      <div key={i} className={`group transition-all duration-300 ${isOpen ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                          <button 
                                              onClick={() => setExpandedFaq(isOpen ? null : uniqueId)} 
                                              className="w-full flex items-center justify-between p-8 text-left cursor-pointer focus:outline-none"
                                          >
                                              <span className={`font-bold text-base md:text-lg pr-8 transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-700'}`}>
                                                  {item.q}
                                              </span>
                                              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-blue-600 text-white rotate-90 shadow-md' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                  <ChevronRight size={20} />
                                              </div>
                                          </button>
                                          
                                          <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-8' : 'grid-rows-[0fr] opacity-0'}`}>
                                              <div className="overflow-hidden px-8">
                                                  <div className="text-base text-slate-600 leading-relaxed border-l-4 border-blue-500 pl-6 py-2">
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

          {/* CONTACTO DE SOPORTE */}
          <div className="mt-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
              <div>
                  <h3 className="text-2xl font-black text-white mb-2">¿Necesitas soporte técnico avanzado?</h3>
                  <p className="text-slate-400 font-medium">Si el sistema presenta errores o necesitas asistencia directa de desarrollo.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <a href="mailto:soporte@vidanova.com" className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold text-white transition-all backdrop-blur-sm">
                      <Mail size={18}/> soporte@vidanova.com
                  </a>
                  <a href="tel:+576028200000" className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-blue-900/50">
                      <Phone size={18}/> (602) 820-0000
                  </a>
              </div>
          </div>

      </div>
    </div>
  );
}