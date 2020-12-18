require('dotenv').config()
const morgan = require('morgan')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mysql = require('mysql2/promise')
const multer = require('multer')
const sha1 = require('sha1');
const fs = require('fs')
const AWS = require('aws-sdk')
const {MongoClient}= require('mongodb')

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'

const MONGO_DB = 'paf2020'
const MONGO_COLLECTION = 'post'

const client = new MongoClient(MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true})


const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

const app = express()

app.use(morgan('combined'))
app.use(cors())
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(bodyParser.json({limit: '50mb'}))

app.use(express.static(__dirname + '/frontend'))

const AWS_S3_HOSTNAME = process.env.AWS_S3_HOSTNAME
const AWS_S3_ACCESSKEY_ID = process.env.AWS_S3_ACCESSKEY_ID
const AWS_S3_SECRET_ACCESSKEY = process.env.AWS_S3_SECRET_ACCESSKEY
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME

const spaceEndPoint = new AWS.Endpoint(AWS_S3_HOSTNAME)
const s3 = new AWS.S3({
    endpoint: spaceEndPoint,
    accessKeyId: AWS_S3_ACCESSKEY_ID,
    secretAccessKey: AWS_S3_SECRET_ACCESSKEY
})


const pool = mysql.createPool({
    host: process.env.MYSQL_SERVER, 
    port: process.env.MYSQL_SVR_PORT, 
    database: process.env.MYSQL_SCHEMA,
    user: process.env.MYSQL_USERNAME , 
    password: process.env.MYSQL_PASSWORD ,
    connectionLimit: process.env.MYSQL_CON_LIMIT,
    timezone: '+08:00'
});

let upload = multer({ dest: './uploads/' })

const authUser = `SELECT count(*) as "equal" from user where user_id =? and password =?`
const queryUser = `SELECT * from user where user_id =? and password =?`


const readFile = (path) => new Promise(
    (resolve, reject) => 
        fs.readFile(path, (err, buff)=> {
            if (null != err){
                reject(err)
            } else {
                resolve(buff)
            }
        })
)

const putObject = (file, buff, s3) => new Promise(
    (resolve, reject) => {
        const params = {
            Bucket: AWS_S3_BUCKET_NAME,
            Key: file.filename,
            Body: buff,
            ACL: 'public-read',
            ContentType: file.mimetype,
            ContentLength: file.size
        }
        s3.putObject(params, (err, result)=>{
            if(null != err){
                reject(err)
            } else {
                resolve(file.filename)
            }
        })
    }
)


// POST /Login
app.post('/login', async (req,res)=> {

	let username = req.body.username
	let password = req.body.password
	
	console.log(username)
	console.log(password)

	if(password){
		password = sha1(password)
	}
	
	console.log(password)
	
	const conn = await pool.getConnection()

	try{
		const results = await conn.query(authUser, [username, password])

		console.log(results[0][0].equal)


		if (results[0][0].equal >= 1 ){
			
			res.status(200)
			res.type('application/json').json({password, username})

		} else {
			console.log("wrong username or password")
			res.status(401)
			res.json({message: 'WRONGGGG'})
		}

	}catch(e){
		console.log(e);
		res.status(500)
    }
		
		
})

// POST /share
app.post('/share', upload.single('imageFile'), async (req,res)=>{
		let {password, title, username, comments} = req.body
		console.log(req.body)
		console.log(username)
		console.log(password)

		// if(password){
		// 	password = sha1(password)
		// }
		const conn = await pool.getConnection()

		try{

			const results = await conn.query(queryUser, [username, password])
			if (username == results[0][0].user_id && password == results[0][0].password){
				readFile(req.file.path)
					.then(buff => 
						putObject(req.file, buff, s3)
						
					)
					.then(result => {
						fs.unlink(req.file.path, ()=> {})
						let imageUrl = `https://${AWS_S3_BUCKET_NAME}.${AWS_S3_HOSTNAME}/${result}`

						const obj = {
							title: title,
							comments: comments,
							image: imageUrl,
							timestamp: new Date()
						}

						client.db(MONGO_DB).collection(MONGO_COLLECTION)
							.insertOne(obj)
							.then(results => {
								res.json(results.ops[0])
								console.log(results)

							}).catch(error => {
								console.error('insert error: ', error)
								res.status(500)
								res.json({ error })
							})
					
					}).catch(error => {
						console.error('insert error: ', error)
						res.status(500)
						res.json({ error })
					})
					
			} else{
				res.status(401)
				res.json({message: 'Please login'})
			}

			console.log(results)

	
		}catch(e){
			console.log(e);
			
			
		} finally{
			conn.release()
		}


})

const p0 = (async ()=> {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    return true

})()

const p1 = (async ()=> {
    await client.connect()
    return true
})()

const p3 = new Promise((resolve, reject)=>{
    if ((!!process.env.AWS_S3_ACCESSKEY_ID) && (!!process.env.AWS_S3_SECRET_ACCESSKEY)) {
        resolve()
    } else {
        reject('s3 key not found')
        
    }
 })

 Promise.all([[p0,p1,p3]])
 .then((r)=> {
	 app.listen(PORT, ()=>{
		 console.info(`Application started on port ${PORT} at ${new Date()}`) 
	 })
 })


