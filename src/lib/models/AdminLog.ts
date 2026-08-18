import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAdminLog extends Document {
  adminId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: '' },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'admin_logs' }
);

AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ entityType: 1, entityId: 1 });

const AdminLog: Model<IAdminLog> =
  (mongoose.models.AdminLog as Model<IAdminLog>) ||
  mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);

export default AdminLog;
