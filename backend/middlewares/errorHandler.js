const systemLogger = require('../utils/systemLogger');

const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Default status and message
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Handle Multer Errors
    if (err.name === 'MulterError') {
        status = 400;
        if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large (Max 2MB)';
    }

    // Handle Mongoose Validation Errors
    if (err.name === 'ValidationError') {
        status = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    const isClientError = status >= 400 && status < 500;
    const isDev = process.env.NODE_ENV === 'development';

    // [ADDED LOGGING]
    if (status >= 500) {
        systemLogger.error('Server Error', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
    }

    res.status(status).json({
        success: false,
        message: (isDev || isClientError) ? message : 'Một lỗi hệ thống đã xảy ra. Vui lòng thử lại sau.',
        code: status,
        error: isDev ? (err.message || err.name || 'Unknown Error') : undefined
    });
};

module.exports = errorHandler;
