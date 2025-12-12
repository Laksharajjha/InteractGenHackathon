const fs = require('fs');
const path = require('path');

const PROFILE_PATH = path.join(__dirname, 'profile.json');

const defaultProfile = {
    name: "John Doe",
    phone: "555-0123",
    address: "123 Main St, Tech City",
    paymentMethod: "Credit Card (Ending 1234)"
};

function getProfile() {
    if (!fs.existsSync(PROFILE_PATH)) {
        fs.writeFileSync(PROFILE_PATH, JSON.stringify(defaultProfile, null, 2));
    }
    return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
}

function updateProfile(data) {
    const current = getProfile();
    const updated = { ...current, ...data };
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(updated, null, 2));
    return updated;
}

module.exports = { getProfile, updateProfile };
