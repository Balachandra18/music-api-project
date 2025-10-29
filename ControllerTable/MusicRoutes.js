let express=require('express');
let multer=require('multer');
let {PutObjectCommand}=require('@aws-sdk/client-s3')
let S3=require('../Configuration/S3Config')
let routes=express.Router()
let storage=multer.memoryStorage();
let upload=multer({storage:storage});
let psql=require('../Configuration/pgsqlConfig')
let {DeleteObjectCommand}=require('@aws-sdk/client-s3');
const { configDotenv } = require('dotenv');




routes.post('/upload',upload.fields([{name:"song",maxCount:1},{name:"song_video",maxCount:1}]),async(req,res)=>{
   
   const songFile = req.files['song'][0];
   const song_video=req.files['song_video'][0];
   
  


    let { song_name,movie_name,music_director,actor_name,actress_name,artist,producer}=req.body;

    let insertquery=`INSERT INTO musicdata (song_name,movie_name,music_director,actor_name,actress_name,song_url,artist,song_video_url,producer)
      VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9)
      RETURNING *;
    `;

    let songfiledata={
        Bucket:process.env.Bucket_Name,
        Key:songFile.originalname,
        Body:songFile.buffer,
        ContentType:songFile.mimetype
    }

    let videofiledata={
       Bucket:process.env.Bucket_Name,
        Key:song_video.originalname,
        Body:song_video.buffer,
        ContentType:song_video.mimetype
    }



    try{
    let songcommand=new PutObjectCommand(songfiledata);
    let response=await S3.send(songcommand);
      console.log(response)
    
    let videocommand=new PutObjectCommand(videofiledata);
    let  videoresponse=await S3.send(videocommand)
    console.log(videoresponse)
   


    let song_url=`https://${process.env.Bucket_Name}.s3.${process.env.Bucket_Region}.amazonaws.com/${encodeURIComponent(songFile.originalname)}`;
    let song_video_url=`https://${process.env.Bucket_Name}.s3.${process.env.Bucket_Region}.amazonaws.com/${encodeURIComponent(song_video.originalname)}`
    let values=[song_name,movie_name,music_director,actor_name,actress_name,song_url,artist,song_video_url,producer];
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
