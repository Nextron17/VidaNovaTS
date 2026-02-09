import { Table, Column, Model, DataType, BeforeCreate } from 'sequelize-typescript';import bcrypt from 'bcryptjs';

@Table({
    tableName: 'users',
    timestamps: true
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
        validate: {
            isEmail: true
        }
    })
    email!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    password!: string;

    @Column({
        type: DataType.ENUM(
            'SUPER_ADMIN',   // Acceso total
            'COORDINATOR',   // Admin de Navegación
            'NAVIGATOR',     // Operativo Navegación
            'AUDITOR',       // Auditoría
            'CLINICAL_ADMIN',// Admin Clínico (Futuro)
            'DOCTOR'         // Médico (Futuro)
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
        defaultValue: 'bg-blue-500' // Color por defecto si falla el random
    })
    avatarColor!: string;

    // --- NUEVAS COLUMNAS PARA RECUPERACIÓN ---
    @Column({ type: DataType.STRING, allowNull: true })
    resetPasswordToken!: string | null;

    @Column({ type: DataType.DATE, allowNull: true })
    resetPasswordExpires!: Date | null;

    // --- MÉTODOS ---

    @BeforeCreate
    static async hashPassword(user: User) {
        if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
        if (!user.avatarColor) {
            const colors = [
                'from-pink-500 to-rose-500',
                'from-blue-500 to-cyan-500',
                'from-emerald-500 to-teal-500',
                'from-amber-500 to-orange-500',
                'from-violet-500 to-purple-500'
            ];
            user.avatarColor = colors[Math.floor(Math.random() * colors.length)];
        }
    }

    async checkPassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }
}