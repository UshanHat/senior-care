const b = require('bcryptjs');
const pw = 'XoxTitaniC@#$1234';
const hash = '$2b$12$IK/YDxZyuQzPVRFX68Pl5uh6uT2Z8GyDob5pZf/Byr4c4KERK3fem';
console.log(b.compareSync(pw, hash));
