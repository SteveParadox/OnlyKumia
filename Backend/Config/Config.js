const _ = process.env

const developmentMode = {
   PORT: _.PORT,
   DB_URI: `mongodb+srv://${_.DB_USER}:${_.DB_PASS}@${_.DB_HOST}/?retryWrites=true&w=majority`,

}

const productionMode = {
   PORT: _.PORT,
   DB_URI: `mongodb+srv://${_.DB_USER}:${_.DB_PASS}@${_.DB_HOST}/?retryWrites=true&w=majority`,

}

