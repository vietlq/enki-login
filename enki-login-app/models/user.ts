import { Schema, Model, model, Document } from 'mongoose';
import { IUser } from "../interfaces/user"

export interface IUserModel extends IUser, Document {
    info(): string;
}

export var UserSchema = new Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    addr: { type: String, required: true, unique: true },
    createdAt: Date,
    updatedAt: Date
});

UserSchema.pre("save", function(this: IUser, next) {
    let now = new Date();
    
    if (!this.createdAt) {
        this.createdAt = now;
    }
    
    this.updatedAt = now;

    next();
});

UserSchema.methods.info = function(): string {
    return (`${this.name.trim()} <${this.email.trim()}>`);
}

export const User: Model<IUserModel> = model<IUserModel>(
    "User", UserSchema, "user");
