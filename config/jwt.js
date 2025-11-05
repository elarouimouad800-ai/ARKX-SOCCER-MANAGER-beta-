if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in .env file');
}

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET
};

