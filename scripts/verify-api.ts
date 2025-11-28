// Native fetch is available in Node.js 18+

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(method: string, path: string, body?: any) {
    console.log(`Testing ${method} ${path}...`);
    try {
        const options: any = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${BASE_URL}${path}`, options);
        const status = response.status;
        let data;

        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.log('❌ Failed to parse JSON. Response text:', text.substring(0, 500));
            data = null;
        }

        console.log(`Status: ${status}`);
        if (status >= 200 && status < 300) {
            console.log('✅ Success');
        } else if (status === 401) {
            console.log('🔒 Protected (Expected for Admin routes without auth)');
        } else {
            console.log('❌ Error:', data);
        }
        console.log('---');
        return { status, data };
    } catch (error) {
        console.error('❌ Request failed:', error);
        return { status: 0, error };
    }
}

async function runTests() {
    console.log('🚀 Starting API Verification\n');

    // -1. Test Home Page
    await testEndpoint('GET', '/'); // Should be 200 (HTML)

    // 0. Test Simple
    await testEndpoint('GET', '/api/test-simple');

    // 1. Test Reservas (Public/Protected mixed)
    await testEndpoint('GET', '/api/reservas'); // Should list

    // 2. Test Servicios (Public GET, Protected POST)
    await testEndpoint('GET', '/api/servicios');
    await testEndpoint('POST', '/api/servicios', { nombre: 'Test Service', precioBase: 10000 }); // Should be 401

    // 3. Test Aliados (Protected)
    await testEndpoint('GET', '/api/aliados');
    await testEndpoint('POST', '/api/aliados', {
        nombre: 'Test Aliado',
        email: 'test@aliado.com',
        whatsapp: '3001234567'
    }); // Should be 401

    // 4. Test Conductores (Public GET?)
    await testEndpoint('GET', '/api/conductores');
    await testEndpoint('POST', '/api/conductores', {
        nombre: 'Test Conductor',
        whatsapp: '3001234567'
    }); // Should be 401

    // 5. Test Vehiculos (Public GET?)
    await testEndpoint('GET', '/api/vehiculos');
    await testEndpoint('POST', '/api/vehiculos', {
        nombre: 'Van Test',
        capacidadMinima: 1,
        capacidadMaxima: 7
    }); // Should be 401

    console.log('\n✨ Verification Complete');
}

runTests();
