let { Pool } = require('pg');
let dotenv = require('dotenv');
dotenv.config();
let pgconnection = new Pool({
  connectionString: process.env.pgsql,
  ssl:{
    rejectUnauthorized:false
  }
});

module.exports = pgconnection;
