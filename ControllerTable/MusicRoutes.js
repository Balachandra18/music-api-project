let express=require('express');
let multer=require('multer');
let {PutObjectCommand}=require('@aws-sdk/client-s3')
let S3=require('../Configuration/S3Config')
let routes=express.Router()
let storage=multer.memoryStorage();
let upload=multer({storage:storage});
let psql=require('../Configuration/pgsqlConfig')
let {DeleteObjectCommand}=require('@aws-sdk/client-s3')




routes.post('/upload',upload.single('Musicfile'),async(req,res)=>{
    if(!req.file){
        return res.send({message:"Please Upload Music File"});
    }


    let { movie_name,music_director,actor_name,actress_name,artist}=req.body;

    let insertquery=`INSERT INTO musicdata (name,movie_name, music_director, actor_name, actress_name,songurl,artist,etag,versionid,requestid)
      VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10)
      RETURNING *;
    `;

    let filedata={
        Bucket:process.env.Bucket_Name,
        Key:req.file.originalname,
        Body:req.file.buffer,
        ContentType:req.file.mimetype
    }

    try{
    let command=new PutObjectCommand(filedata);
    let response=await S3.send(command);
    console.log(req.file.originalname);
    let url=`https://${process.env.Bucket_Name}.s3.${process.env.Bucket_Region}.amazonaws.com/${encodeURIComponent(req.file.originalname)}`;
    console.log(url)

    let values=[req.file.originalname,movie_name,music_director,actor_name,actress_name,url,artist,response.ETag,response.VersionId,response.$metadata.requestId];
    let databaseresponse=await psql.query(insertquery,values);
    res.status(200).json({message:" data Submitted Successfully",inserted:databaseresponse.rows[0],status:200})
   console.log(response)
    }catch(err){
        console.log(err)
        res.status(500).json({message:"server error",status:500})
    }

});

routes.get('/getdata',async(req,res)=>{
  try {
      let getquery=`SELECT * FROM musicdata`;
      let response=await psql.query(getquery);
    //   res.status(200).json(response)
      if(response.rowCount>0){
        res.status(200).json({
        success: true,
        datalength: response.rowCount,
        data: response.rows
      })
      }
      else{
        return res.status(200).json({message:"No data Found"})
      }
  } catch (error) {
    console.log(error)
    return res.status(500).json({message:" Server  error",error:error})
  }

})

routes.delete('/delete/:name',async (req,res)=>{
  let query=`DELETE FROM musicdata WHERE name = $1 RETURNING *;`//sql deleted command
  let deletedata={
    Bucket:process.env.Bucket_Name,
    Key:req.params.name
  } //delete objectin s3
  let value=[req.params.name]
  try{
  
  let command=new DeleteObjectCommand(deletedata);
  let s3resonse=await S3.send(command);
 
  let sqlresponse=await psql.query(query,value)
  if (sqlresponse.rowCount === 0) {
      // It's possible the S3 object still exists, but we can't delete it without a DB record.
      return res.status(404).json({ message: 'Song not found in database. Deletion aborted.' });
    }

  res.status(200).json({message:'Deleted Successfully',command:s3resonse})
  }catch(err){
    console.log(err)
    res.status(500).json({message:"Server error"})
  }
})



 
    


routes.put('/update/:id',upload.none(),async(req,res)=>{
  let {movie_name,actor_name,actress_name,music_director}=req.body
  // console.log(req.body)
  // console.log(req.params.id)
  let query=`UPDATE musicdata SET movie_name = $1, actor_name = $2,actress_name = $3, music_director = $4
WHERE id = $5;`
  let value=[movie_name,actor_name,actress_name,music_director,req.params.id]
  try {
    let response=await psql.query(query,value);
     res.status(200).json({
      message: 'Song updated successfully',
      updatedRow: response.rows[0]   // returns the updated row
    });

  } catch (error) {
    console.log(error)
     res.status(500).json({ message: 'Server error while updating' });
  }

})

module.exports=routes;
