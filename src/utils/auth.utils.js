const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt.
 * @param {string} password - The raw password from user.
 * @returns {Promise<string>} - The hashed password to store in DB.
 */

 const hashPassword = async (plainPassword) => {
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashedPassword;
}

/**
 * Compares a plain text password with a hashed password.
 * @param {string} plainPassword - What the user typed during login.
 * @param {string} hashedPassword - What's stored in the database.
 * @returns {Promise<boolean>} - True if the passwords match, false otherwise.
 */

const comparePassword = async (plainPassword, hashedPassword) => {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
}

module.exports = {
    hashPassword,
    comparePassword
};