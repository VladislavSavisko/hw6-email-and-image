
import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';


const contactSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        isFavourite: {
            type: Boolean,
            default: false,
        },
        contactType: {
            type: String,
            enum: ['work', 'home', 'personal'],
            required: true,
            default: 'personal'
        },
        userId: { type: Types.ObjectId, ref: 'users', required: true },
        photo: {
            type: String,
            default: null,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const ContactCollection = model('contact', contactSchema);


export const createContactSchema = Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    email: Joi.string().email(),
    isFavourite: Joi.boolean(),
    contactType: Joi.string().valid('work', 'home', 'personal'),
    photo: Joi.string().uri().allow('', null)
});

export const updateContactSchema = Joi.object({
    name: Joi.string(),
    phoneNumber: Joi.string(),
    email: Joi.string().email(),
    isFavourite: Joi.boolean(),
    contactType: Joi.string().valid('work', 'home', 'personal'),
    photo: Joi.string().uri().allow('', null)
}).min(1);
