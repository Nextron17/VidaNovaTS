import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { FollowUp } from './FollowUp';

@Table({
    tableName: 'master_cups',
    timestamps: true
})
export class MasterCUP extends Model {
    
    @Column({ 
        type: DataType.STRING(50), 
        allowNull: false, 
        unique: true // El código es la llave de conexión
    })
    codigo!: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    descripcion!: string;

    @Column({ type: DataType.STRING(50), defaultValue: 'PENDIENTE' })
    grupo!: string;

    // --- RELACIÓN ---
    // Un código en el maestro puede aparecer en muchos seguimientos
    @HasMany(() => FollowUp, { foreignKey: 'cups', sourceKey: 'codigo' })
    followups!: FollowUp[];
}