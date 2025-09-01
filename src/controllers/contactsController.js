import createHttpError from "http-errors";
import * as contactsService from "../services/contacts.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const getAllContacts = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, sortBy = "name", sortOrder = "asc", isFavourite, contactType } = req.query;

    const filter = { userId: req.user._id };
    if (isFavourite !== undefined) filter.isFavourite = isFavourite === "true";
    if (contactType) filter.contactType = contactType;

    const result = await contactsService.getAllContacts({
      userId: req.user._id,
      page: Number(page),
      perPage: Number(perPage),
      sortBy,
      sortOrder,
      filter,
    });

    res.status(200).json({ status: 200, message: "Successfully found contacts!", data: result });
  } catch (err) { next(err); }
};

export const getContactById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await contactsService.getContactById(id, req.user._id);
    if (!contact) throw createHttpError(404, "Contact not found");

    res.status(200).json({
      status: 200,
      message: `Successfully found contact with id ${id}!`,
      data: contact,
    });
  } catch (err) { next(err); }
};

export const createContact = async (req, res, next) => {
  try {
    let photoUrl;
    if (req.file) {
      photoUrl = await uploadToCloudinary(req.file.path, `contacts/${req.user._id}`);
    }

    const contactData = { ...req.body, userId: req.user._id };
    if (photoUrl) contactData.photo = photoUrl;

    const newContact = await contactsService.createContact(contactData);

    res.status(201).json({
      status: 201,
      message: "Successfully created a contact!",
      data: newContact,
    });
  } catch (err) { next(err); }
};

export const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };
    if (req.file) {
      const photoUrl = await uploadToCloudinary(req.file.path, `contacts/${req.user._id}`);
      updateData.photo = photoUrl;
    }

    const updatedContact = await contactsService.updateContact(id, req.user._id, updateData);
    if (!updatedContact) throw createHttpError(404, "Contact not found");

    res.status(200).json({
      status: 200,
      message: "Successfully patched a contact!",
      data: updatedContact,
    });
  } catch (err) { next(err); }
};

export const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await contactsService.deleteContact(id, req.user._id);
    if (!deleted) throw createHttpError(404, "Contact not found");
    res.status(204).send();
  } catch (err) { next(err); }
};
