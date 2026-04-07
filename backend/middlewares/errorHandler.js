const systemLogger = require('../utils/systemLogger');

const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
        console.error(err.stack);
    }

    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'MulterError') {
        status = 400;
        if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large (Max 2MB)';
    }

    if (err.name === 'ValidationError') {
        status = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    const isServerError = status >= 500;

    if (isServerError) {
        systemLogger.error('Server Error', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
    }

    let finalMessage = message;
    if (!isDev && isServerError) {
        finalMessage = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
    }

    res.status(status).json({
        success: false,
        message: finalMessage,
        code: status
    });
};

module.exports = errorHandler;
