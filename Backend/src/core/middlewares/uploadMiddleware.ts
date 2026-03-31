import multer from 'multer';

// Usar la memoria RAM temporalmente
const storage = multer.memoryStorage();

export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        // 🛡️ Proteger que solo suban Excels o CSVs
        if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml') || file.mimetype.includes('csv')) {
            cb(null, true);
        } else {
            cb(new Error('FORMATO_INVALIDO: Solo se permiten archivos Excel (.xlsx, .xls) o CSV.'));
        }
    }
});