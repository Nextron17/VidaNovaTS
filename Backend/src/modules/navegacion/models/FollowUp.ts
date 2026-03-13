import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Patient } from './Patient';
import { User } from '../../usuarios/models/User';
import { MasterCUP } from './MasterCUP'; // 👈 Importación esencial

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
    @Column({ type: DataType.INTEGER, allowNull: true }) 
    userId!: number;

    @BelongsTo(() => User)
    user!: User;

    @ForeignKey(() => MasterCUP)
    @Column({ type: DataType.STRING(50), allowNull: true })
    cups!: string;

    @BelongsTo(() => MasterCUP, { foreignKey: 'cups', targetKey: 'codigo' })
    masterCup!: MasterCUP;

    @Column({ type: DataType.DATEONLY, allowNull: true })
    dateRequest!: Date | null;

    @Column({ type: DataType.DATEONLY, allowNull: true })
    dateAppointment!: Date | null;

    @Column({ type: DataType.STRING, defaultValue: 'PENDIENTE' })
    status!: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    serviceName!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    eps!: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    observation!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    category!: string;
}