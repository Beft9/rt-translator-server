import pg from "pg";
//import  { RDS } from "aws-sdk"
const { Pool } = pg

const pool = new Pool({
    user: 'user',
    host: 'postgresql-96586-0.cloudclusters.net',
    database: 'rt-translator',
    password: 'postgres1234',
    port: 10061,
});


export default pool;  

