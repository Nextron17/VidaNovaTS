import { Table, Column, Model, DataType, BeforeCreate, BeforeUpdate, HasMany } from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { Patient } from '../../navegacion/models/Patient';
import { FollowUp } from '../../navegacion/models/FollowUp';

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

    @Column({
        type: DataType.STRING,
        allowNull: true,
        unique: true    
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
            'COORDINATOR_NAVIGATOR',
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

    // SEGURIDAD Y RECUPERACIÓN
    @Column({ type: DataType.STRING, allowNull: true })
    resetPasswordToken!: string | null;

    @Column({ type: DataType.DATE, allowNull: true })
    resetPasswordExpires!: Date | null;

    // ✅ RELACIONES: LO QUE ESTE USUARIO POSEE/CONTROLA
    @HasMany(() => Patient)
    patients!: Patient[];

    @HasMany(() => FollowUp)
    followups!: FollowUp[];

    // HOOKS
    @BeforeCreate
    @BeforeUpdate
    static async handleSecurityAndStyle(user: User) {
        if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }

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

    // MÉTODOS DE INSTANCIA
    async checkPassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }

    toJSON() {
        const values = Object.assign({}, this.get());
        delete values.password;
        delete values.resetPasswordToken;
        delete values.resetPasswordExpires;
        return values;
    }
}