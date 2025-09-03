import {
  gettingContactId,
  gettingContacts,
  patchContact,
  postContact,
  deleteContact,
} from "../services/contacts.js";
import createError from 'http-errors';
import { parsePaginationParams } from "../utils/parsePaginationParams.js";
import { parseSortParams } from "../utils/parseSortParams.js";
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import { getEnvVar } from '../utils/getEnvVar.js';

export const getAllContacts = async (req, res, next) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder, type, isFavourite } = parseSortParams(req.query);

  const result = await gettingContacts({
    userId: req.user._id,
    page,
    perPage,
    sortBy,
    sortOrder,
    type,
    isFavourite
  });

  const { contacts, ...pagination } = result.data;
  res.json({ status: 200, message: "Successfully found contacts!", data: { data: contacts, ...pagination } });
};

export const getContactById = async (req, res, next) => {
  const result = await gettingContactId(req.user._id, req.params.contactId);
  if (!result.data) return next(createError(404, "Contact not found"));
  res.json({ status: 200, message: "Successfully got a contact!", data: result.data });
};

export const createContactController = async (req, res, next) => {
  let photoUrl;
  if (req.file) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(req.file);
    } else {
      photoUrl = await saveFileToUploadDir(req.file);
    }
  }
  const contactData = { ...req.body, photo: photoUrl };

  const contact = await postContact(req.user._id, contactData);
  res.status(201).json({ status: 201, message: "Successfully created a contact!", data: contact });
};

export const updateContactController = async (req, res, next) => {
  let photoUrl;
  if (req.file) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(req.file);
    } else {
      photoUrl = await saveFileToUploadDir(req.file);
    }
  }
  const contactData = { ...req.body };
  if (photoUrl) contactData.photo = photoUrl;

  const contact = await patchContact(req.user._id, req.params.contactId, contactData);
  if (!contact) return next(createError(404, "Contact not found for update"));
  res.json({ status: 200, message: "Successfully patched a contact!", data: contact });
};

export const deleteContactController = async (req, res, next) => {
  const contact = await deleteContact(req.user._id, req.params.contactId);
  if (!contact) return next(createError(404, "Contact not found for deletion"));
  res.status(204).send();
};

export const upsertContactController = async (req, res, next) => {
  
  res.json({ status: 200, message: "Upsert contact works!", data: null });
};