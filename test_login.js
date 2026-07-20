const bcrypt = require('bcryptjs');

async function test() {
    const hash = '$2b$12$IK/YDxZyuQzPVRFX68Pl5uh6uT2Z8GyDob5pZf/Byr4c4KERK3fem';
    const passwords = [
        'Ushan@123',
        'Ushan1234',
        'Ushan@1234',
        'ushanhathurusinghe',
        'admin123',
        'Admin@123',
        'Password123'
    ];
    for (const p of passwords) {
        if (await bcrypt.compare(p, hash)) {
            console.log('Password is:', p);
            return;
        }
    }
    console.log('None of the guesses matched.');
}
test();
