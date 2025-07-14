const mongoose=require("mongoose")

const ConnecTDb= async (params) => {
    try {
         await  mongoose.connect(process.env.MONGODB_URI,{})
         console.log("Database is connected succesfully ")
    } catch (error) {
        console.log("There is error in connected to database",error)
    }
}

module.exports=ConnecTDb