import multer from "multer";//express middleware that handles file uploads
import path from "path";//safe path handling->prevents path errors
import fs from "fs";//read write delete files ->actual filesystem

// ensure upload directory exists
const uploadDir = "uploads/documents";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//checks if the path to upload even exists ->if not then create it 
//recursive:true  creates the parent folder accordingly 


//upload file on disk(for now)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //file is metadata,req is express request obj(headers,body,users)
    //cb(callback)->This is a function of multer cb(error,wheretosave)
    cb(null, uploadDir);//No errors,save to UploadDir
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);//this creates a new filename to avoid collisions
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

//multer hook to reject unwanted files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "application/dicom"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({ //actual upload middleware 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export default upload;
