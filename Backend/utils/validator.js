
const validator=require('validator');
const validate=(data)=>{
   const mandatoryField = ["name", "email", "password"];

   const isAllowed=mandatoryField.every((k)=>Object.keys(data).includes(k));
   if(!isAllowed)
    throw new Error("some field missing");

   if(!validator.isEmail(data.email))
    throw new Error("Invalid email");

   if(!validator.isStrongPassword(data.password))
    throw new Error("weak password");

}

module.exports=validate;