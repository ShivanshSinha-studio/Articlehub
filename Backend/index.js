const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const userAuth= require('./Routes/userRoute');
const articleRouter= require('./Routes/articleRoute');
const categoryRouter=require('./Routes/categoryRoute')
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const cors=require('cors')

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false
}));

const frontendOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...frontendOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin:function(origin, callback){
    if(!origin || allowedOrigins.includes(origin)){
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials:true
}))

const isDevelopment = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 5000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  skip: () => isDevelopment
});


app.use('/api', limiter);

app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api',userAuth);
app.use('/api',articleRouter);
app.use('/api',categoryRouter);

const InitalizeConnection = async ()=>{
    try{
        await Promise.all([main()]);
        console.log("DB Connected");

        const port = process.env.PORT || 8000;
        app.listen(port, ()=>{
            console.log("Server listening at port number: "+ port);
        })

    }
    catch(err){
        console.log("Error: "+err);
    }
}
InitalizeConnection();
