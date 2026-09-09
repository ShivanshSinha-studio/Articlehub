const express =require('express');
const userAuth= express.Router();
const {Register,Login,GoogleAuth,Logout,Profile,adminRegister,deleteProfile,requestAuthorAccess,getAuthorRequests,reviewAuthorRequest,getAuthors,verifyEmail,resendVerificationEmail,resendVerificationByEmail,makeUserReply,removeAuthor}= require('../controllers/userController');
const userMiddleware= require('../Middleware/userMiddleware');
const optionalAuth= userMiddleware.optionalAuth;
const adminMiddleware= require('../Middleware/adminMiddleware')

userAuth.post('/Auth/register',Register);
userAuth.post('/Auth/login',Login);
userAuth.post('/Auth/google',GoogleAuth);
userAuth.get('/Auth/verify-email/:token',verifyEmail);
userAuth.post('/Auth/resend-verification-email',resendVerificationByEmail);
userAuth.post('/Auth/logout',userMiddleware,Logout);
userAuth.post('/Auth/profile',userMiddleware,Profile);
userAuth.post('/Auth/resend-verification',userMiddleware,resendVerificationEmail);
userAuth.delete('/Auth/delete',userMiddleware,deleteProfile);
userAuth.get('/Auth/check',optionalAuth,(req,res)=>{
      let reply=req.user ? makeUserReply(req.user) : null
        res.status(200).json({
            user:reply
        })

})

userAuth.post('/Auth/request-author',userMiddleware,requestAuthorAccess);
userAuth.get('/Auth/author-requests',adminMiddleware,getAuthorRequests);
userAuth.get('/Auth/authors',adminMiddleware,getAuthors);
userAuth.patch('/Auth/author-requests/:id',adminMiddleware,reviewAuthorRequest);
userAuth.delete('/Auth/authors/:id',adminMiddleware,removeAuthor);
userAuth.post('/Auth/admin',adminMiddleware,adminRegister);

module.exports=userAuth;
