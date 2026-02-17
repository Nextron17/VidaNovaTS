import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Patient } from './Patient';

@Table({
    tableName: 'followups',
    timestamps: true
})
export class FollowUp extends Model {
    
    // CLAVE FORÁNEA
    @ForeignKey(() => Patient)
    @Column({ type: DataType.INTEGER, allowNull: false })
    patientId!: number;

    // RELACIÓN INVERSA
    @BelongsTo(() => Patient)
    patient!: Patient;

    // DATOS 
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