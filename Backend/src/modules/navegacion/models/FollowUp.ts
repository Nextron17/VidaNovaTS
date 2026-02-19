import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Patient } from './Patient';
import { User } from '../../usuarios/models/User';

@Table({
    tableName: 'followups',
    timestamps: true
})
export class FollowUp extends Model {
    
    @ForeignKey(() => Patient)
    @Column({ type: DataType.INTEGER, allowNull: false })
    patientId!: number;

    @BelongsTo(() => Patient)
    patient!: Patient;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: true }) // Dejado en true temporalmente para no romper datos viejos que no tenían usuario
    userId!: number;

    @BelongsTo(() => User)
    user!: User;

    // --- DATOS DEL SEGUIMIENTO ---
    @Column({ type: DataType.DATEONLY, allowNull: true })
    dateRequest!: Date | null;

    @Column({ type: DataType.DATEONLY, allowNull: true })
    dateAppointment!: Date | null;

    @Column({ type: DataType.STRING, defaultValue: 'PENDIENTE' })
    status!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    cups!: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    serviceName!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    eps!: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    observation!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    category!: string;
}