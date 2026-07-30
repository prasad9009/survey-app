import mongoose from 'mongoose'

const { Schema } = mongoose

const activityLogSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true, trim: true },
    userRole: { type: String, trim: true },
    action: { type: String, required: true, index: true, trim: true },
    entityType: { type: String, required: true, index: true, trim: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    summary: { type: String, required: true, trim: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'activity_logs' },
)

activityLogSchema.index({ companyId: 1, createdAt: -1 })
activityLogSchema.index({ companyId: 1, userId: 1, createdAt: -1 })
activityLogSchema.index({ companyId: 1, entityType: 1, createdAt: -1 })

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema)
