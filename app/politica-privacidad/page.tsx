export default function PoliticaPrivacidadPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Política de Tratamiento de Datos Personales
                </h1>

                <div className="space-y-6 text-gray-700">
                    {/* Sección 1: Identificación */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            1. Identificación del Responsable
                        </h2>
                        <p className="mb-2">
                            <strong>Razón Social:</strong> Transportes Medellín Travel
                        </p>
                        <p className="mb-2">
                            <strong>Domicilio:</strong> Medellín, Colombia
                        </p>
                        <p className="mb-2">
                            <strong>Correo Electrónico:</strong> medellintraveltransportes@gmail.com
                        </p>
                        <p className="mb-2">
                            <strong>Teléfono:</strong> +57 317 5177409
                        </p>
                    </section>

                    {/* Sección 2: Objeto y Alcance */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            2. Objeto y Alcance
                        </h2>
                        <p>
                            La presente Política de Tratamiento de Datos Personales tiene como objeto dar
                            cumplimiento a la Ley 1581 de 2012 y el Decreto 1377 de 2013, estableciendo
                            los lineamientos para la recolección, almacenamiento, uso, circulación y
                            supresión de datos personales de nuestros clientes, aliados y usuarios de
                            nuestra plataforma de servicios de transporte.
                        </p>
                    </section>

                    {/* Sección 3: Definiciones */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            3. Definiciones
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Dato Personal:</strong> Cualquier información vinculada o que pueda
                                asociarse a una o varias personas naturales determinadas o determinables.
                            </li>
                            <li>
                                <strong>Titular:</strong> Persona natural cuyos datos personales sean objeto
                                de tratamiento.
                            </li>
                            <li>
                                <strong>Tratamiento:</strong> Cualquier operación o conjunto de operaciones
                                sobre datos personales, tales como la recolección, almacenamiento, uso,
                                circulación o supresión.
                            </li>
                            <li>
                                <strong>Base de Datos:</strong> Conjunto organizado de datos personales que
                                sea objeto de tratamiento.
                            </li>
                        </ul>
                    </section>

                    {/* Sección 4: Datos Recolectados */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            4. Tipo de Datos Personales Recolectados
                        </h2>
                        <p className="mb-3">
                            Transportes Medellín Travel recolecta los siguientes tipos de datos personales:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Datos de identificación: nombre completo, tipo y número de documento de identidad</li>
                            <li>Datos de contacto: número de teléfono, correo electrónico, dirección</li>
                            <li>Datos de la reserva: fecha y hora del servicio, lugar de recogida, destino, número de pasajeros</li>
                            <li>Información del servicio: tipo de vehículo, preferencias de viaje</li>
                            <li>Datos de pago: información relacionada con transacciones (no almacenamos datos de tarjetas de crédito)</li>
                            <li>Datos de geolocalización: ubicación de origen y destino del servicio</li>
                        </ul>
                    </section>

                    {/* Sección 5: Finalidad */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            5. Finalidad del Tratamiento de Datos
                        </h2>
                        <p className="mb-3">Los datos personales recolectados serán utilizados para:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Gestionar y procesar las reservas de servicios de transporte</li>
                            <li>Facilitar la comunicación entre el cliente, la empresa y los conductores</li>
                            <li>Realizar seguimiento y confirmación de los servicios contratados</li>
                            <li>Enviar notificaciones sobre el estado de las reservas</li>
                            <li>Procesar pagos y generar facturación</li>
                            <li>Brindar atención al cliente y soporte técnico</li>
                            <li>Mejorar nuestros servicios y la experiencia del usuario</li>
                            <li>Cumplir con obligaciones legales y contractuales</li>
                            <li>Enviar información promocional y ofertas (solo con consentimiento previo)</li>
                            <li>Realizar análisis estadísticos y estudios de mercado</li>
                        </ul>
                    </section>

                    {/* Sección 6: Derechos del Titular */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            6. Derechos del Titular de los Datos
                        </h2>
                        <p className="mb-3">
                            Como titular de sus datos personales, usted tiene derecho a:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Conocer, actualizar y rectificar sus datos personales</li>
                            <li>Solicitar prueba de la autorización otorgada</li>
                            <li>Ser informado sobre el uso que se ha dado a sus datos personales</li>
                            <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones</li>
                            <li>Revocar la autorización y solicitar la supresión de sus datos cuando no exista una obligación legal o contractual que lo impida</li>
                            <li>Acceder de forma gratuita a sus datos personales</li>
                        </ul>
                    </section>

                    {/* Sección 7: Procedimiento */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            7. Procedimiento para Ejercer sus Derechos
                        </h2>
                        <p className="mb-3">
                            Para ejercer sus derechos, el titular o su representante podrá:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                Enviar una solicitud al correo electrónico: <strong>medellintraveltransportes@gmail.com</strong>
                            </li>
                            <li>
                                Comunicarse al teléfono: <strong>+57 317 5177409</strong>
                            </li>
                            <li>
                                Dirigirse a nuestras oficinas en: <strong>Medellín, Colombia</strong>
                            </li>
                        </ul>
                        <p className="mt-3">
                            La solicitud debe contener: nombres y apellidos del titular, número de documento,
                            dirección de contacto, descripción de los hechos, y firma (si es física). Daremos
                            respuesta dentro de los 15 días hábiles siguientes a la recepción de la solicitud.
                        </p>
                    </section>

                    {/* Sección 8: Seguridad */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            8. Medidas de Seguridad
                        </h2>
                        <p>
                            Transportes Medellín Travel implementa medidas técnicas, humanas y administrativas
                            necesarias para proteger sus datos personales y evitar su adulteración, pérdida,
                            consulta, uso o acceso no autorizado. Estas medidas incluyen:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Cifrado de datos sensibles</li>
                            <li>Acceso restringido a las bases de datos</li>
                            <li>Protocolos de seguridad en servidores</li>
                            <li>Capacitación del personal en protección de datos</li>
                            <li>Auditorías periódicas de seguridad</li>
                        </ul>
                    </section>

                    {/* Sección 9: Transferencia */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            9. Transferencia y Transmisión de Datos
                        </h2>
                        <p className="mb-3">
                            Sus datos personales podrán ser compartidos con:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Conductores y aliados de transporte para la prestación del servicio</li>
                            <li>Aliados hoteleros y de alojamiento (cuando aplique)</li>
                            <li>Procesadores de pago para el procesamiento de transacciones</li>
                            <li>Proveedores de servicios tecnológicos que soportan nuestra plataforma</li>
                            <li>Autoridades competentes cuando exista un requerimiento legal</li>
                        </ul>
                        <p className="mt-3">
                            Todos los terceros que accedan a sus datos están obligados a tratarlos de
                            conformidad con la legislación colombiana de protección de datos.
                        </p>
                    </section>

                    {/* Sección 10: Vigencia */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            10. Vigencia de la Base de Datos
                        </h2>
                        <p>
                            Los datos personales serán conservados mientras sean necesarios para las
                            finalidades descritas en esta política y durante el tiempo que existan
                            obligaciones legales o contractuales. Una vez cumplida la finalidad y no
                            existan obligaciones legales, los datos serán eliminados de forma segura.
                        </p>
                    </section>

                    {/* Sección 11: Menores de Edad */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            11. Tratamiento de Datos de Menores de Edad
                        </h2>
                        <p>
                            El tratamiento de datos personales de menores de edad está sujeto al
                            consentimiento previo, expreso e informado de los padres o representantes
                            legales. Solo se recolectarán datos de menores cuando sea estrictamente
                            necesario para la prestación del servicio.
                        </p>
                    </section>

                    {/* Sección 12: Modificaciones */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            12. Modificaciones a la Política
                        </h2>
                        <p>
                            Transportes Medellín Travel se reserva el derecho de modificar esta política
                            en cualquier momento. Cualquier cambio sustancial será comunicado a través
                            de nuestra plataforma web y por correo electrónico. La versión vigente
                            siempre estará disponible en nuestro sitio web.
                        </p>
                    </section>

                    {/* Sección 13: Aceptación */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            13. Aceptación de la Política
                        </h2>
                        <p>
                            Al utilizar nuestra plataforma y servicios, usted acepta esta Política de
                            Tratamiento de Datos Personales. Si no está de acuerdo, deberá abstenerse
                            de utilizar nuestros servicios.
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
