import Joi from "joi";

export default Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});
