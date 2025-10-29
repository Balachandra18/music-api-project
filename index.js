let dotenv=require('dotenv')
dotenv.config()
let express=require('express')
let multer=require('multer')
let cors=require('cors')
let routes=require('./ControllerTable/MusicRoutes')
let s3Conncetion=require('./Configuration/S3Config')
let userroutes=require('./ControllerTable/userRoutes')

let app=express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

let pgconnection=require('./Configuration/pgsqlConfig')
pgconnection.connect()
.then((result) => {
    console.log("Connected to psql Successfully")
}).catch((err) => {
    console.log(err)
});

s3Conncetion.checkConnection() // Using the method you added to the exported client
.then(() => {
    console.log(' Connected to S3 bucket. Credentials are valid.');
}).catch((err) => {
    console.error(' Failed to connect to S3.');
    console.error(err);
});
let port=5000 || process.env.port
app.get('/',(req,res)=>{res.send(`<h1>Server runing on the port ${port}</h1>`)})
app.use('/music',routes);
app.use('/user',userroutes);
app.listen(port,()=>{console.log('server runing'+port);})
