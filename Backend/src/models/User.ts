import { Table, Column, Model, DataType, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import bcrypt from 'bcryptjs';

@Table({
    tableName: 'users',
    timestamps: true,
    modelName: 'User'
})
export class User extends Model {
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    name!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    documentNumber!: string;

    /**
     * Email ahora es opcional. 
     * Se mantiene solo por referencia o futuras notificaciones.
     */
   // En tu Backend: models/User.ts
    @Column({
        type: DataType.STRING,
        allowNull: true, // ✅ Cambiado de false a true
        unique: true     // Mantiene la unicidad solo si el correo existe
    })
    email!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    password!: string;

    @Column({
        type: DataType.ENUM(
            'SUPER_ADMIN',
            'COORDINATOR_NAVIGATOR', // ✅ Cambio de COORDINATOR a COORDINATOR_NAVIGATOR
            'NAVIGATOR',
            'AUDITOR'
        ),
        defaultValue: 'NAVIGATOR'
    })
    role!: string;

    @Column({
        type: DataType.ENUM('online', 'offline', 'busy'),
        defaultValue: 'offline'
    })
    status!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    phone!: string;

    @Column({
        type: DataType.STRING,
        defaultValue: 'from-blue-600 to-indigo-600'
    })
    avatarColor!: string;

    // --- SEGURIDAD Y RECUPERACIÓN ---
    @Column({ type: DataType.STRING, allowNull: true })
    resetPasswordToken!: string | null;

    @Column({ type: DataType.DATE, allowNull: true })
    resetPasswordExpires!: Date | null;

    // --- HOOKS (Lógica automática) ---

    @BeforeCreate
    @BeforeUpdate
    static async handleSecurityAndStyle(user: User) {
        // 1. Hashear password solo si cambió o es nuevo
        if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }

        // 2. Asignar gradiente visual aleatorio si no tiene uno
        if (!user.avatarColor || user.avatarColor === 'bg-blue-500') {
            const gradients = [
                'from-pink-500 to-rose-500',
                'from-blue-600 to-cyan-500',
                'from-emerald-500 to-teal-500',
                'from-amber-500 to-orange-500',
                'from-violet-600 to-purple-500',
                'from-slate-700 to-slate-900'
            ];
            user.avatarColor = gradients[Math.floor(Math.random() * gradients.length)];
        }
    }

    // --- MÉTODOS DE INSTANCIA ---

    /**
     * Compara una contraseña plana con el hash guardado
     */
    async checkPassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }

    /**
     * Devuelve un objeto limpio del usuario (sin password) para el frontend
     */
    toJSON() {
        const values = Object.assign({}, this.get());
        delete values.password;
        delete values.resetPasswordToken;
        delete values.resetPasswordExpires;
        return values;
    }
}