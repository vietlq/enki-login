import { Schema, Model, model, Document } from 'mongoose';
import { INonce } from "../interfaces/nonce"

export interface INonceModel extends INonce, Document {
}

export const NonceSchema = new Schema({
    serverNonce: { type: String, require: true, unique: true },
    serverEpoch: { type: String, require: true }
});

export const Nonce: Model<INonceModel> = model<INonceModel>(
    "Nonce", NonceSchema, "nonce");
