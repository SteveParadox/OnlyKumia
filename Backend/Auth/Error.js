import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import config from '../config/config.js';

const errorConverter = (error, req, res, next) => {
    console.log(error)
}


const errorHandler = (error, req, res, next) => {
   console.log(error);
}

export { errorHandler, errorConverter };
