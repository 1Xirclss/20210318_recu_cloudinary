import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import User from "../models/User.js";
import VerificationCode from "../models/VerificationCode.js";
import { sendVerificationEmail } from "../services/email.service.js";
import { deleteImage } from "../utils/cloudinaryUpload.js";

export const requestRegistrationCode = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    if (!name?.trim() || !email || !password) {
      return res.status(400).json({ ok: false, message: "name, email y password son obligatorios" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, message: "Ingresa un correo valido" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: "La contrasena debe tener al menos 6 caracteres" });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ ok: false, message: "Ese correo ya esta registrado" });
    }

    const code = crypto.randomBytes(3).toString("hex");
    await VerificationCode.findOneAndUpdate(
      { email },
      {
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        attempts: 0,
        name: name.trim(),
        password: await bcrypt.hash(password, 10),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendVerificationEmail(email, code);
    } catch (error) {
      await VerificationCode.deleteOne({ email });
      throw error;
    }

    return res.json({ ok: true, message: "Email sent", email });
  } catch (error) { return next(error); }
};

export const verifyRegistrationCode = async (req, res, next) => {
  const uploadedId = req.file?.filename;
  const discardPhoto = () => uploadedId ? deleteImage(uploadedId).catch(() => {}) : Promise.resolve();
  let saved = false;
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { verificationCodeRequest } = req.body;
    if (!email || !verificationCodeRequest || !req.file) {
      await discardPhoto();
      return res.status(400).json({ ok: false, message: "email, verificationCodeRequest y profilePhoto son obligatorios" });
    }

    const verification = await VerificationCode.findOne({ email }).select("+password");
    if (!verification || verification.expiresAt <= new Date()) {
      await discardPhoto();
      return res.status(400).json({ ok: false, message: "El codigo vencio o no existe. Solicita otro." });
    }
    if (verification.attempts >= 5) {
      await discardPhoto();
      return res.status(429).json({ ok: false, message: "Demasiados intentos. Solicita otro codigo." });
    }
    if (!(await bcrypt.compare(String(verificationCodeRequest), verification.codeHash))) {
      verification.attempts += 1;
      await verification.save();
      await discardPhoto();
      return res.status(400).json({ ok: false, message: "Codigo incorrecto" });
    }

    const user = await User.create({
      name: verification.name,
      email,
      password: verification.password,
      profilePhoto: { url: req.file.path, publicId: uploadedId },
      emailVerified: true,
    });
    saved = true;
    await VerificationCode.deleteOne({ email });
    return res.status(201).json({ ok: true, message: "Usuario registrado", user: publicUser(user) });
  } catch (error) {
    if (!saved) await discardPhoto();
    return next(error);
  }
};

export const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profilePhoto: user.profilePhoto,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
