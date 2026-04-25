const systemLogger = require('../utils/systemLogger');

const errorHandler = (err, req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';

    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'MulterError') {
        status = 400;
        if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large (Max 5MB)';
    }

    if (err.name === 'ValidationError') {
        status = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    const isServerError = status >= 500;

    if (isServerError) {
        systemLogger.error('Server Error', {
            name: err.name,
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
        message = 'Internal Server Error';
    }

    if (!isProd) {
        console.error(`[Error] ${err.name}: ${err.message}`);
        if (err.stack) console.error(err.stack);
    }

    // Standardized response (no stack trace returned)
    return res.status(status).json({
        success: false,
        message: message || 'Internal Server Error'
    });
};

module.exports = errorHandler;

