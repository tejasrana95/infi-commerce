import mongoose, { Schema, Document } from 'mongoose';

/**
 * Chat History Model - Store AI chat conversations
 * Retention: Last 3 days per user/session
 */

interface IMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: Date;
    tool_calls?: any[];
    tool_call_id?: string;
}

export interface IChatHistory extends Document {
    storeId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;     // For logged-in users
    sessionId?: string;                   // For guest users
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system', 'tool'],
        required: true
    },
    content: {
        type: String,
        required: false // Content can be null when tool_calls are present
    },
    tool_calls: {
        type: [Schema.Types.Mixed],
        required: false
    },
    tool_call_id: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const ChatHistorySchema = new Schema<IChatHistory>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            index: true
        },
        sessionId: {
            type: String,
            index: true
        },
        messages: {
            type: [MessageSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Compound indexes for efficient querying
ChatHistorySchema.index({ storeId: 1, userId: 1 });
ChatHistorySchema.index({ storeId: 1, sessionId: 1 });
ChatHistorySchema.index({ createdAt: 1 }); // For cleanup queries

// TTL index to auto-delete documents older than 3 days
ChatHistorySchema.index({ updatedAt: 1 }, { expireAfterSeconds: 259200 }); // 3 days = 259200 seconds

const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);

export default ChatHistory;
