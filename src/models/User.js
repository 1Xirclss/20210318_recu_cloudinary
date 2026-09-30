import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: { type: Boolean, default: false },
    password: {
      type: String,
      required: [true, "La contrasena es obligatoria"],
      select: false,
    },
    profilePhoto: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
