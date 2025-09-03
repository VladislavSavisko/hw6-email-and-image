
import { SORT_ORDER } from '../constants/index.js';
import { ContactCollection } from '../db/models/contact.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';

export const gettingContacts = async ({ userId, page = 1, perPage = 10, sortOrder = SORT_ORDER.ASC, sortBy = '_id', type, isFavourite }) => {
    const limit = perPage;
    const skip = (page - 1) * perPage;

    const filter = { userId }; 
    if (type) filter.contactType = type;
    if (isFavourite !== undefined) filter.isFavourite = isFavourite;

    const contactsQuery = ContactCollection.find(filter);
    const contactsCount = await ContactCollection.countDocuments(filter);

    const contacts = await contactsQuery.skip(skip).limit(limit).sort({ [sortBy]: sortOrder }).exec();
    const paginationData = calculatePaginationData(contactsCount, perPage, page);

    return { status: 200, message: "Successfully found contacts!", data: { contacts, ...paginationData } };
};

export const gettingContactId = async (userId, contactId) => {
    const contact = await ContactCollection.findOne({ _id: contactId, userId }); 
    if (!contact) return { status: 404, message: "Contact not found", data: null };
    return { status: 200, message: "Successfully found contact!", data: contact };
};

export const postContact = async (userId, payload) => {
    const contact = await ContactCollection.create({ ...payload, userId }); 
    return contact;
};

export const patchContact = async (userId, id, updateData) => {
    const contact = await ContactCollection.findOneAndUpdate({ _id: id, userId }, updateData, { new: true });
    return contact;
};

export const deleteContact = async (userId, id) => {
    const contact = await ContactCollection.findOneAndDelete({ _id: id, userId });
    return contact;
};