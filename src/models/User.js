import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, minlength: 3, maxlength: 20 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// ховаємо пароль та службові поля у всіх відповідях
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export default model("User", userSchema);
