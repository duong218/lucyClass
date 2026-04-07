const systemLogger = require('../utils/systemLogger');

const errorHandler = (err, req, res, next) => {
    const isDev = process.env.NODE_ENV === 'development';

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
            name: err.name,
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
    }

    if (isDev) {
        console.error(`[Error] ${err.name}: ${err.message}`);
        console.error(err.stack);
    }

    res.status(status).json({
        success: false,
        message: (!isDev && isServerError)
            ? 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
            : message,
        code: status
    });
};

module.exports = errorHandler;

