import multer from 'multer';

// Usamos almacenamiento en memoria (RAM) porque ImportService 
// procesa el archivo directamente sin necesidad de guardarlo en el disco duro.
const storage = multer.memoryStorage();

// Configuramos multer para que acepte solo archivos con el campo 'file'
export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 99 * 1024 * 1024 // Límite de 99MB (suficiente para Excels gigantes)
    }
});