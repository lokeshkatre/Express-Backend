import multer from 'multer'
//configure the multer middleware for file upload

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./public/temp");
    },
    filename: function(req,file,cb){
        const uniqueSuffix = Date.now() + "-" + Math.random(Math.random()*1E9);
        cb(null,file.originalname + "-" + uniqueSuffix);
    }
})

export const upload = multer({
    storage,
});