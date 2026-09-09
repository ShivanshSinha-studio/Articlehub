const validate=require('../utils/validator');
const bcrypt=require('bcrypt');
const User=require('../Model/userSchema');
const AuditLog=require('../Model/AuditLogSchema');
const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendVerificationEmail } = require('../config/mailer');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createEmailVerification = () => {
    const token = crypto.randomBytes(32).toString('hex');
    return {
        token,
        hashedToken: hashToken(token),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
};

const buildVerificationUrl = (token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${frontendUrl}/verify-email/${token}`;
};

const createAccessToken = (user) => jwt.sign(
    {_id: user._id,email: user.email,role:user.role,type:'access'},
    process.env.JWT_KEY,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m"}
);

const createRefreshToken = (user) => jwt.sign(
    {_id: user._id,tokenVersion:user.refreshTokenVersion,type:'refresh'},
    process.env.JWT_REFRESH_KEY || process.env.JWT_KEY,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"}
);

const setAuthCookies = (res, user) => {
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie("token",accessToken,{
        httpOnly:true,
        sameSite:isProduction ? 'none' : 'lax',
        secure:isProduction,
        maxAge:15*60*1000
    });

    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        sameSite:isProduction ? 'none' : 'lax',
        secure:isProduction,
        maxAge:7*24*60*60*1000
    });
};

const makeUserReply = (user) => ({
    id:user._id,
    name:user.name,
    email:user.email,
    role:user.role,
    emailVerified:user.emailVerified,
    requestedRole:user.requestedRole,
    authorRequestStatus:user.authorRequestStatus,
    authorRequestMessage:user.authorRequestMessage,
    authorRequestAdminNote:user.authorRequestAdminNote,
    profilePicture:user.profilePicture,
});

const normalizeRequestedRole = (requestedRole) => requestedRole === 'author' ? 'author' : 'user';

const applyAuthorRequest = (user, requestedRole, authorRequestMessage = '') => {
    if (normalizeRequestedRole(requestedRole) !== 'author') return;
    user.requestedRole = 'author';
    user.authorRequestMessage = authorRequestMessage || user.authorRequestMessage || '';

    if (user.emailVerified && user.role === 'user' && ['none', 'rejected'].includes(user.authorRequestStatus)) {
        user.authorRequestStatus = 'pending';
        user.authorRequestAdminNote = '';
        user.authorRequestReviewedAt = undefined;
        user.authorRequestReviewedBy = undefined;
    }
};

const sendFreshVerificationLink = async (user) => {
    const verification=createEmailVerification();
    const verificationUrl=buildVerificationUrl(verification.token);
    user.emailVerificationToken=verification.hashedToken;
    user.emailVerificationExpires=verification.expires;
    await user.save();
    const mailResult = await sendVerificationEmail({to:user.email,name:user.name,verificationUrl});
    return { mailResult, verificationUrl };
};

//register
const Register=async(req,res)=>{
    try{
        validate(req.body);
    const {name,email,password,requestedRole,authorRequestMessage}=req.body;
    const existingUser = await User.findOne({ email });
    if(existingUser)
        throw new Error("An account with this email already exists");
    const verification = createEmailVerification();
    const userData={
        name,
        email,
        password:await bcrypt.hash(password,10),
        role:'user',
        requestedRole: requestedRole === 'author' ? 'author' : 'user',
        authorRequestStatus: 'none',
        authorRequestMessage: requestedRole === 'author' ? (authorRequestMessage || '') : '',
        emailVerificationToken: verification.hashedToken,
        emailVerificationExpires: verification.expires
    };
    const user=await User.create(userData);
    const verificationUrl=buildVerificationUrl(verification.token);
    const mailResult = await sendVerificationEmail({to:user.email,name:user.name,verificationUrl});
    res.status(201).json({
        message: requestedRole === 'author'
            ? "Registered successfully. Verify your email to submit the author request for admin approval."
            : "Registered successfully. Verify your email before requesting author access.",
        ...(mailResult?.dev ? { verificationUrl } : {})
    });
    }catch(error){
        res.status(400).json({
            message:error.message
        });
    }
}

const GoogleAuth=async(req,res)=>{
    try{
        const {credential, requestedRole, authorRequestMessage}=req.body;

        if(!process.env.GOOGLE_CLIENT_ID)
            throw new Error("Google sign-in is not configured on the server");

        if(!credential)
            throw new Error("Google credential missing");

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        if(!payload?.email || !payload?.sub)
            throw new Error("Invalid Google account response");

        if(!payload.email_verified)
            throw new Error("Google account email is not verified");

        let user = await User.findOne({
            $or: [
                { googleId: payload.sub },
                { email: payload.email.toLowerCase() }
            ]
        });

        if(user){
            if(!user.googleId) user.googleId = payload.sub;
            user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
            user.emailVerified = true;
            if(!user.profilePicture && payload.picture) user.profilePicture = payload.picture;
            applyAuthorRequest(user, requestedRole, authorRequestMessage);
            await user.save();
        } else {
            user = await User.create({
                name: (payload.name || payload.email.split('@')[0]).slice(0, 30),
                email: payload.email.toLowerCase(),
                password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
                authProvider: 'google',
                googleId: payload.sub,
                profilePicture: payload.picture || '',
                emailVerified: true,
                role: 'user',
                requestedRole: normalizeRequestedRole(requestedRole),
                authorRequestStatus: normalizeRequestedRole(requestedRole) === 'author' ? 'pending' : 'none',
                authorRequestMessage: normalizeRequestedRole(requestedRole) === 'author' ? (authorRequestMessage || '') : ''
            });
        }

        setAuthCookies(res, user);
        res.status(200).json({
            message:"Google sign-in successful",
            user:makeUserReply(user)
        });
    }
    catch(error){
        res.status(401).json({message:error.message});
    }
}

//login
const Login=async(req,res)=>{
    try {
        const {email,password}=req.body;

        if(!email || !password)
            throw new Error("Invalid credential");

        const result= await User.findOne({email});
        
        if(!result){
            throw new Error("user not found");
        }
        const isValid=await bcrypt.compare(password, result.password);

         
        if(!isValid){
         throw new Error("Invalid credential");
        }

        let reply=makeUserReply(result)

        setAuthCookies(res, result);
        res.status(200).json({
            message:"login Successful",
            user:reply
        })
    }
    catch (error) {
        res.status(401).json({
            message:error.message
        });
    }
}

//logout
const Logout= async(req,res)=>{
   try{
    await User.findByIdAndUpdate(req.user._id, {$inc:{refreshTokenVersion:1}});
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.status(200).send('logout successfully');
   }
   catch(error){
        res.status(401).send(error.message)
   }
}

//get profile
const Profile= async(req,res)=>{
  try{
      const user= req.user;
      res.status(200).send(user);
  }
  catch(error){
    res.status(201).send(error.message)
  }
    
}

const verifyEmail=async(req,res)=>{
    try{
        const token=req.params.token;
        if(!token)
            throw new Error("verification token missing");

        const user=await User.findOne({
            emailVerificationToken: hashToken(token),
            emailVerificationExpires: {$gt:new Date()}
        }).select('+emailVerificationToken +emailVerificationExpires');

        if(!user)
            return res.status(400).json({message:"Invalid or expired verification link"});

        user.emailVerified=true;
        user.emailVerificationToken=undefined;
        user.emailVerificationExpires=undefined;

        if(user.requestedRole === 'author' && user.role === 'user' && user.authorRequestStatus === 'none'){
            user.authorRequestStatus='pending';
        }

        await user.save();

        res.status(200).json({
            message:user.authorRequestStatus === 'pending'
                ? "Email verified. Author request is now pending admin approval."
                : "Email verified successfully.",
            user:makeUserReply(user)
        });
    }
    catch(error){
        res.status(400).json({message:error.message});
    }
}

const resendVerificationEmail=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id).select('+emailVerificationToken +emailVerificationExpires');
        if(!user)
            throw new Error("user not found");

        if(user.emailVerified)
            return res.status(400).json({message:"Email already verified"});

        const { mailResult, verificationUrl } = await sendFreshVerificationLink(user);

        res.status(200).json({
            message:"A new verification link has been sent.",
            ...(mailResult?.dev ? { verificationUrl } : {})
        });
    }
    catch(error){
        res.status(400).json({message:error.message});
    }
}

const resendVerificationByEmail=async(req,res)=>{
    try{
        const {email}=req.body;
        if(!email)
            throw new Error("Email is required");

        const user=await User.findOne({email:email.toLowerCase().trim()}).select('+emailVerificationToken +emailVerificationExpires');
        if(!user)
            return res.status(200).json({message:"If an unverified account exists, a new verification link has been sent."});

        if(user.emailVerified)
            return res.status(200).json({message:"This email is already verified. You can login now."});

        await sendFreshVerificationLink(user);

        res.status(200).json({
            message:"If an unverified account exists, a new verification link has been sent."
        });
    }
    catch(error){
        res.status(400).json({message:error.message});
    }
}

const requestAuthorAccess=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id);
        if(!user)
            throw new Error("user not found");

        if(user.role === 'author' || user.role === 'admin')
            return res.status(400).json({message:"You already have publishing access"});

        if(!user.emailVerified)
            return res.status(403).json({message:"Verify your email before requesting author access"});

        if(user.authorRequestStatus === 'pending')
            return res.status(400).json({message:"Author request is already pending"});

        user.requestedRole='author';
        user.authorRequestStatus='pending';
        user.authorRequestMessage=req.body.authorRequestMessage || user.authorRequestMessage || '';
        user.authorRequestAdminNote='';
        user.authorRequestReviewedAt=undefined;
        user.authorRequestReviewedBy=undefined;
        await user.save();

        res.status(200).json({
            message:"Author request submitted for admin approval",
            user:makeUserReply(user)
        });
    }
    catch(error){
        res.status(400).json({message:error.message});
    }
}

const getAuthorRequests=async(req,res)=>{
    try{
        const page=Math.max(Number(req.query.page) || 1, 1);
        const limit=Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
        const query={requestedRole:'author', authorRequestStatus:'pending'};
        const users=await User.find({requestedRole:'author', authorRequestStatus:'pending'})
            .select('name email role emailVerified requestedRole authorRequestStatus authorRequestMessage authorRequestAdminNote createdAt updatedAt profilePicture')
            .sort('-updatedAt')
            .skip((page - 1) * limit)
            .limit(limit);
        const total=await User.countDocuments(query);

        res.status(200).json({
            success:true,
            total,
            pages:Math.ceil(total / limit),
            currentPage:page,
            count:users.length,
            requests:users
        });
    }
    catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}

const reviewAuthorRequest=async(req,res)=>{
    try{
        const {status,adminNote}=req.body;
        if(!['approved','rejected'].includes(status))
            throw new Error("status must be approved or rejected");

        const user=await User.findById(req.params.id);
        if(!user)
            return res.status(404).json({message:"user not found"});

        if(user.requestedRole !== 'author')
            return res.status(400).json({message:"user has not requested author access"});

        user.authorRequestStatus=status;
        user.authorRequestAdminNote=adminNote || '';
        user.authorRequestReviewedAt=new Date();
        user.authorRequestReviewedBy=req.user._id;

        if(status === 'approved'){
            user.role='author';
        }

        await user.save();
        await AuditLog.create({
            actor:req.user._id,
            action:'author_request_reviewed',
            targetType:'user',
            target:user._id,
            status,
            note:adminNote || ''
        });

        res.status(200).json({
            message:`Author request ${status}`,
            user:makeUserReply(user)
        });
    }
    catch(error){
        res.status(400).json({message:error.message});
    }
}

const getAuthors=async(req,res)=>{
    try{
        const users=await User.find({role:'author'})
            .select('name email role emailVerified requestedRole authorRequestStatus authorRequestMessage authorRequestAdminNote createdAt updatedAt profilePicture bio')
            .sort('-updatedAt');

        res.status(200).json({
            success:true,
            total:users.length,
            authors:users
        });
    }
    catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}

const adminRegister=async(req,res)=>{
    try{
       validate(req.body);
    const {password,role}=req.body;
    if(!role)
        throw new Error("send the role");
  req.body.password=await bcrypt.hash(password,10);
  req.body.emailVerified=true;
    await User.create(req.body);
    res.status(201).send("Registerd sucessfully");
}
catch(error){
    res.status(401).send(error.message)
}   
}

const deleteProfile=async(req,res)=>{
    try{
        const id=req.user._id;
        const data=await User.deleteOne(id);

        if(!data)
        return res.send("user not found");

       res.status(201).send("account delete successfully");

    }catch(error){
        return res.status(500).send("user not found");
    }
}

const removeAuthor=async(req,res)=>{
    try{
        const {id}=req.params;
        if(!id)
            throw new Error("Author ID is required");

        const user=await User.findById(id);
        if(!user)
            return res.status(404).json({message:"Author not found"});

        if(user.role !== 'author')
            return res.status(400).json({message:"User is not an author"});

        await User.findByIdAndDelete(id);
        await AuditLog.create({
            actor:req.user._id,
            action:'author_removed',
            targetType:'user',
            target:id,
            note:`Removed author: ${user.name} (${user.email})`
        });

        res.status(200).json({
            success:true,
            message:`Author ${user.name} has been removed successfully`
        });
    }
    catch(error){
        res.status(400).json({message:error.message});
    }
}


module.exports={Register,Login,GoogleAuth,Logout,Profile,adminRegister,deleteProfile,requestAuthorAccess,getAuthorRequests,reviewAuthorRequest,getAuthors,verifyEmail,resendVerificationEmail,resendVerificationByEmail,makeUserReply,removeAuthor};
