import { Router } from "express";
import * as contactsController from "../controllers/contactsController.js";
import { authenticate } from "../middlewares/authenticate.js";
import upload from "../middlewares/upload.js";

const router = Router();

router.use(authenticate);

router.get("/", contactsController.getAllContacts);
router.get("/:id", contactsController.getContactById);
router.post("/", upload.single("photo"), contactsController.createContact);
router.patch("/:id", upload.single("photo"), contactsController.updateContact);
router.delete("/:id", contactsController.deleteContact);

export default router;
