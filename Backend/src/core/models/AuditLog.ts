import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../../modules/usuarios/models/User';

@Table({
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false, // Los logs son inmutables
})
export class AuditLog extends Model {
    
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    userId!: number;

    @BelongsTo(() => User)
    user!: User;

    @Column({
        type: DataType.ENUM('CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'LOGIN'),
        allowNull: false
    })
    action!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    tableName!: string; 

    // Mantenemos STRING porque algunos IDs podrían ser UUIDs en el futuro
    @Column({ type: DataType.STRING, allowNull: false })
    recordId!: string; 

    @Column({ type: DataType.JSON, allowNull: true })
    oldValues!: any;

    @Column({ type: DataType.JSON, allowNull: true })
    newValues!: any;

    @Column({ type: DataType.STRING, allowNull: true })
    ipAddress!: string;
}