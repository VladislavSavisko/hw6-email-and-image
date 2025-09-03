export const errorHandler = (error, req, res, next) => {

    res.status(error.status || 500).json({
        message: error.message || 'Something went wrong',
        ...(error.data && { data: error.data }),
    });
};