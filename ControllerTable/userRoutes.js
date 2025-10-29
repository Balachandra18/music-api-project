let express=require('express')
let routes=express.Router()
let multer=require('multer');
let storage=multer.memoryStorage()
let upload=multer({storage:storage});
let psql=require('../Configuration/pgsqlConfig')
let {PutObjectCommand}=require('@aws-sdk/client-s3')
let jwttoken=require('json-web-token')
let bcrypt=require('bcryptjs')

routes.post('/signup',async(req,res)=>{

    let {firstname,lastname,email,phonenumber,password,confirmpassword}=req.body;




    if(password!=confirmpassword){
      return  res.status(500).json({message:"Password Not Match"})
    }


   

    let hashedpassword=await bcrypt.hash(password,10);


    let values=[firstname,lastname,email,phonenumber,hashedpassword]

    try {
        let query=`INSERT INTO usersdata (firstname,lastname,email,phonenumber,password)Values($1,$2,$3,$4,$5) RETURNING *`
         let emailquery=`SELECT * FROM usersdata WHERE email=$1 OR phonenumber=$2`
        let emailvalue=[email,phonenumber]

        let findemailresponse=await psql.query(emailquery,emailvalue)
        if(findemailresponse.rowCount>0){
           return  res.status(505).json({message:"Email or Phonenumber already exist r"})
        }
     
        let response=await psql.query(query,values);
        
        res.status(200).json({messaage:"You Signedup Successfully",data:response.rows[0]})

    } catch (error) {
        res.status(500).json({message:"Server Error"})
        console.log(error)
    }

})


routes.post('/login',async(req,res)=>{
    let {email,password}=req.body;

    let query=`SELECT * FROM usersdata WHERE email=$1`;
    let values=[email];
    try {
        let response=await psql.query(query,values);
        // res.status(200).json({message:response.rows})
        let normalpassword=await bcrypt.compare(password,response.rows[0].password)
        console.log(normalpassword)


    if(normalpassword==true){
        res.status(200).json({message:"You logined successfully",userdata:response.rows[0]})

    }
    if(normalpassword!=true){
        return res.status(200).json({message:"Password is incorrect"})
    }

    } catch (error) {
        console.log(error)
    }
})

module.exports=routes