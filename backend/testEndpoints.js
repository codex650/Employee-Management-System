const test = async () => {
    const baseUrl = 'http://localhost:5000/api/auth';
    let adminToken;
    let employeeToken;

    console.log('--- 1. Testing Admin Login ---');
    const loginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@ems.com', password: 'Admin123!' })
    });
    const loginData = await loginRes.json();
    if (loginData.token) {
        console.log('Login successful');
        adminToken = loginData.token;
    } else {
        console.error('Login failed:', loginData);
        return;
    }

    console.log('\n--- 2. Testing /api/auth/me (Admin) ---');
    const meRes = await fetch(`${baseUrl}/me`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const meData = await meRes.json();
    console.log('Me data received for:', meData.user.email, '| Role:', meData.user.role);

    console.log('\n--- 3. Testing /api/auth/register (New Employee) ---');
    const regRes = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            email: 'jane.doe@ems.com',
            password: 'Password123',
            role: 'employee',
            employeeData: {
                firstName: 'Jane',
                lastName: 'Doe',
                department: 'Marketing',
                position: 'Manager'
            }
        })
    });
    const regData = await regRes.json();
    if (regRes.status === 201) {
        console.log('Employee registered successfully:', regData.user.email);
    } else {
        console.error('Registration failed:', regData);
    }

    console.log('\n--- 4. Testing Employee Login ---');
    const empLoginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jane.doe@ems.com', password: 'Password123' })
    });
    const empLoginData = await empLoginRes.json();
    console.log('Employee login status:', empLoginRes.status);
    employeeToken = empLoginData.token;

    console.log('\n--- 5. Testing Role Authorization (Employee trying to register) ---');
    const unauthorizedRes = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${employeeToken}`
        },
        body: JSON.stringify({ email: 'hack@ems.com', password: '123' })
    });
    const unauthorizedData = await unauthorizedRes.json();
    console.log('Status (expect 403):', unauthorizedRes.status);
    console.log('Message:', unauthorizedData.message);

    console.log('\n--- Test Completed ---');
};

test();
