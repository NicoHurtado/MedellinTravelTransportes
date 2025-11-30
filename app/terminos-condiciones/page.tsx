export default function TerminosCondicionesPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Términos y Condiciones
                </h1>

                <div className="space-y-6 text-gray-700">
                    {/* Sección 1: Aceptación */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            1. Aceptación de los Términos
                        </h2>
                        <p>
                            Al acceder y utilizar los servicios de Transportes Medellín Travel, usted
                            acepta quedar vinculado por estos términos y condiciones. Si no está de
                            acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
                        </p>
                    </section>

                    {/* Sección 2: Descripción del Servicio */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            2. Descripción del Servicio
                        </h2>
                        <p className="mb-3">
                            Transportes Medellín Travel ofrece servicios de transporte terrestre en la
                            región de Medellín y sus alrededores, que incluyen:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Traslados aeropuerto</li>
                            <li>Transporte punto a punto</li>
                            <li>Servicios por horas</li>
                            <li>Tours y excursiones</li>
                            <li>Transporte corporativo</li>
                        </ul>
                    </section>

                    {/* Sección 3: Reservas */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            3. Reservas y Confirmación
                        </h2>
                        <p className="mb-3">
                            <strong>3.1 Proceso de Reserva:</strong> Las reservas pueden realizarse a
                            través de nuestra plataforma web, WhatsApp o por teléfono. Toda reserva debe
                            incluir información completa y veraz del cliente.
                        </p>
                        <p className="mb-3">
                            <strong>3.2 Confirmación:</strong> Las reservas quedan sujetas a disponibilidad
                            y confirmación por parte de Transportes Medellín Travel. Enviaremos una
                            confirmación por correo electrónico o WhatsApp.
                        </p>
                        <p className="mb-3">
                            <strong>3.3 Modificaciones:</strong> Las solicitudes de modificación de reserva
                            deben realizarse con al menos 24 horas de anticipación al servicio programado.
                        </p>
                    </section>

                    {/* Sección 4: Tarifas y Pagos */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            4. Tarifas y Métodos de Pago
                        </h2>
                        <p className="mb-3">
                            <strong>4.1 Tarifas:</strong> Las tarifas publicadas están sujetas a cambios
                            sin previo aviso. El precio confirmado en su reserva será el que se aplicará.
                        </p>
                        <p className="mb-3">
                            <strong>4.2 Métodos de Pago:</strong> Aceptamos pagos mediante:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-3">
                            <li>Tarjetas de crédito y débito (procesadas por Bold)</li>
                            <li>Transferencia bancaria</li>
                            <li>Efectivo al conductor (según disponibilidad)</li>
                        </ul>
                        <p className="mb-3">
                            <strong>4.3 Pagos Online:</strong> Los pagos procesados mediante nuestra
                            plataforma son seguros y están encriptados. No almacenamos información de
                            tarjetas de crédito.
                        </p>
                    </section>

                    {/* Sección 5: Cancelaciones */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            5. Política de Cancelación
                        </h2>
                        <p className="mb-3">
                            <strong>5.1 Cancelación por el Cliente:</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-3">
                            <li>Cancelaciones con más de 24 horas de anticipación: reembolso del 100%</li>
                            <li>Cancelaciones entre 12-24 horas: reembolso del 50%</li>
                            <li>Cancelaciones con menos de 12 horas: sin reembolso</li>
                        </ul>
                        <p className="mb-3">
                            <strong>5.2 Cancelación por la Empresa:</strong> Nos reservamos el derecho de
                            cancelar servicios por causas de fuerza mayor, condiciones climáticas adversas
                            o razones de seguridad. En estos casos, se ofrecerá reprogramación o reembolso completo.
                        </p>
                    </section>

                    {/* Sección 6: Responsabilidades del Cliente */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            6. Responsabilidades del Cliente
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Proporcionar información precisa y completa al momento de la reserva</li>
                            <li>Estar presente en el punto de recogida acordado a la hora programada</li>
                            <li>Mantener un comportamiento respetuoso hacia el conductor y otros pasajeros</li>
                            <li>No transportar artículos ilegales o peligrosos</li>
                            <li>Cumplir con las normas de seguridad del vehículo (uso de cinturón de seguridad)</li>
                            <li>Informar sobre equipaje excesivo o necesidades especiales con anticipación</li>
                        </ul>
                    </section>

                    {/* Sección 7: Responsabilidades de la Empresa */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            7. Responsabilidades de la Empresa
                        </h2>
                        <p className="mb-3">Nos comprometemos a:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Proporcionar vehículos en buen estado y con los permisos legales correspondientes</li>
                            <li>Asignar conductores profesionales y capacitados</li>
                            <li>Cumplir con los horarios acordados dentro de lo razonable</li>
                            <li>Mantener seguros de responsabilidad civil vigentes</li>
                            <li>Brindar atención al cliente oportuna</li>
                        </ul>
                    </section>

                    {/* Sección 8: Limitación de Responsabilidad */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            8. Limitación de Responsabilidad
                        </h2>
                        <p className="mb-3">
                            Transportes Medellín Travel no será responsable por:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Retrasos causados por tráfico, condiciones climáticas o casos de fuerza mayor</li>
                            <li>Pérdida de vuelos, conexiones u otros servicios contratados independientemente</li>
                            <li>Objetos personales dejados en los vehículos (aunque haremos esfuerzos razonables para su recuperación)</li>
                            <li>Daños o pérdidas no reportados inmediatamente al finalizar el servicio</li>
                        </ul>
                    </section>

                    {/* Sección 9: Equipaje */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            9. Equipaje y Objetos Personales
                        </h2>
                        <p className="mb-3">
                            <strong>9.1 Equipaje Permitido:</strong> Cada pasajero tiene derecho a un
                            equipaje estándar (maleta de hasta 23 kg). Equipaje adicional o de gran tamaño
                            debe informarse previamente.
                        </p>
                        <p className="mb-3">
                            <strong>9.2 Objetos de Valor:</strong> El cliente es responsable de sus objetos
                            de valor. Recomendamos mantenerlos consigo en todo momento.
                        </p>
                        <p>
                            <strong>9.3 Objetos Olvidados:</strong> Haremos esfuerzos razonables para
                            devolver objetos olvidados. Los gastos de envío corren por cuenta del cliente.
                        </p>
                    </section>

                    {/* Sección 10: Privacidad y Datos Personales */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            10. Protección de Datos Personales
                        </h2>
                        <p>
                            El tratamiento de sus datos personales se rige por nuestra{' '}
                            <a
                                href="/politica-privacidad"
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Política de Tratamiento de Datos Personales
                            </a>
                            , en cumplimiento de la Ley 1581 de 2012. Al aceptar estos términos, usted
                            también acepta dicha política.
                        </p>
                    </section>

                    {/* Sección 11: Menores de Edad */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            11. Transporte de Menores de Edad
                        </h2>
                        <p>
                            Los menores de edad deben viajar acompañados de un adulto responsable. Los
                            sistemas de retención infantil (sillas para bebés/niños) deben ser solicitados
                            con anticipación y están sujetos a disponibilidad.
                        </p>
                    </section>

                    {/* Sección 12: Modificaciones */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            12. Modificaciones a los Términos
                        </h2>
                        <p>
                            Nos reservamos el derecho de modificar estos términos y condiciones en cualquier
                            momento. Las modificaciones entrarán en vigor inmediatamente después de su
                            publicación en nuestro sitio web. Es responsabilidad del usuario revisar
                            periódicamente estos términos.
                        </p>
                    </section>

                    {/* Sección 13: Ley Aplicable */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            13. Ley Aplicable y Jurisdicción
                        </h2>
                        <p>
                            Estos términos y condiciones se regirán e interpretarán de acuerdo con las
                            leyes de la República de Colombia. Cualquier disputa será sometida a la
                            jurisdicción exclusiva de los tribunales de Medellín, Colombia.
                        </p>
                    </section>

                    {/* Sección 14: Contacto */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            14. Información de Contacto
                        </h2>
                        <p className="mb-2">
                            Para consultas o reclamos relacionados con estos términos:
                        </p>
                        <p className="mb-2">
                            <strong>Correo:</strong> medellintraveltransportes@gmail.com
                        </p>
                        <p className="mb-2">
                            <strong>Teléfono:</strong> +57 317 5177409
                        </p>
                        <p>
                            <strong>Dirección:</strong> Medellín, Colombia
                        </p>
                    </section>

                    {/* Fecha */}
                    <section className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            <strong>Fecha de última actualización:</strong> {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
