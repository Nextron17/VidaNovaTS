import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { FollowUp } from './FollowUp'; 
import { User } from '../../usuarios/models/User';

@Table({
    tableName: 'patients',
    timestamps: true
})
export class Patient extends Model {
    
    // 1. IDENTIFICACIÓN
    @Column({ type: DataType.STRING, allowNull: false, unique: true })
    documentNumber!: string;

    @Column({ type: DataType.STRING, defaultValue: 'CC' })
    documentType!: string;

    // 2. DATOS DEMOGRÁFICOS
    @Column({ type: DataType.STRING, allowNull: false })
    firstName!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    lastName!: string;

    @Column({ type: DataType.DATEONLY, allowNull: true })
    birthDate!: Date | null;

    @Column({ type: DataType.STRING, allowNull: true })
    gender!: string;

    // 3. DATOS DE CONTACTO Y UBICACIÓN
    @Column({ type: DataType.STRING, allowNull: true })
    phone!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    email!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    city!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    department!: string;

    // 4. DATOS CLÍNICOS
    @Column({ type: DataType.STRING, allowNull: true })
    insurance!: string; // EPS

    @Column({ type: DataType.STRING, defaultValue: 'ACTIVO' })
    status!: string;

    @Column({ type: DataType.STRING, defaultValue: 'DIAGNOSTICO' })
    stage!: string;

    // ✅ 5. RELACIONES CON OTRAS TABLAS
    
    // A. ¿Quién es el Navegador/Usuario a cargo de este paciente?
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: true }) 
    navigatorId!: number;

    @BelongsTo(() => User)
    navigator!: User;

    // B. ¿Cuáles son los seguimientos de este paciente?
    @HasMany(() => FollowUp)
    followups!: FollowUp[];

    // 6. UTILIDADES
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}