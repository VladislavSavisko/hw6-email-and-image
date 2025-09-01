import Contact from "../models/contact.js";
import createHttpError from "http-errors";

export const getAllContacts = async ({ userId, page = 1, perPage = 10, sortBy = "name", sortOrder = "asc", filter = {} }) => {
  const skip = (page - 1) * perPage;
  const sortDirection = sortOrder === "desc" ? -1 : 1;

  const finalFilter = { ...filter, userId };

  const totalItems = await Contact.countDocuments(finalFilter);
  const contacts = await Contact.find(finalFilter)
    .sort({ [sortBy]: sortDirection })
    .skip(skip)
    .limit(perPage);

  return {
    data: contacts,
    page,
    perPage,
    totalItems,
    totalPages: Math.ceil(totalItems / perPage),
    hasPreviousPage: page > 1,
    hasNextPage: page < Math.ceil(totalItems / perPage),
  };
};

export const getContactById = async (id, userId) => {
  const contact = await Contact.findOne({ _id: id, userId });
  if (!contact) throw createHttpError(404, "Contact not found");
  return contact;
};

export const createContact = async (contactData) => {
  return Contact.create(contactData);
};

export const updateContact = async (id, userId, updateData) => {
  const updatedContact = await Contact.findOneAndUpdate(
    { _id: id, userId },
    updateData,
    { new: true }
  );
  if (!updatedContact) throw createHttpError(404, "Contact not found");
  return updatedContact;
};

export const deleteContact = async (id, userId) => {
  const deleted = await Contact.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw createHttpError(404, "Contact not found");
  return deleted;
};
