import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// @desc   Register new user (first user automatically admin)
// @route  POST /api/auth/register
// @access Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Determine role: first user becomes admin
  const userCount = await User.countDocuments();
  const role = userCount === 0 ? "admin" : "customer";

  const user = await User.create({ name, email, password, role });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user)
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc   Login user & get token
// @route  POST /api/auth/login
// @access Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user)
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc   Forgot password - Send reset token
// @route  POST /api/auth/forgot-password
// @access Public



// @desc   Forgot password - Send reset token
// @route  POST /api/auth/forgot-password
// @access Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Veuillez fournir un email"
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Security: don't reveal if user exists
    return res.json({
      success: true,
      message: "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé"
    });
  }

  try {
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token and save
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiration to 1 hour
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // SEND EMAIL
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: #2c5aa0; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0;
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px 20px; 
              border-radius: 0 0 8px 8px;
            }
            .button { 
              background: #2c5aa0; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              display: inline-block; 
              margin: 15px 0;
            }
            .footer { 
              text-align: center; 
              margin-top: 25px; 
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 12px; 
              color: #666; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Parapharmacie TN</h1>
            </div>
            <div class="content">
              <h2>Réinitialisation de votre mot de passe</h2>
              <p>Bonjour ${user.name},</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">
                  Réinitialiser mon mot de passe
                </a>
              </p>
              <p><strong>Ce lien expirera dans 1 heure.</strong></p>
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
            </div>
            <div class="footer">
              <p>Cordialement,<br>L'équipe Parapharmacie TN</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe - Parapharmacie TN',
        html: emailHtml
      });

      console.log('✅ Email de réinitialisation envoyé à:', user.email);

    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError);
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }
    }

    // Response
    const response = {
      success: true,
      message: "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé"
    };

    // Add reset URL for debugging in development
    if (process.env.NODE_ENV === 'development') {
      response.resetUrl = resetUrl;
    }

    res.json(response);

  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Clean up on error
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la demande de réinitialisation"
    });
  }
});

// @desc   Reset password
// @route  PUT /api/auth/reset-password/:resetToken
// @access Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Please provide password"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters"
    });
  }

  try {
    // Hash token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset"
    });
  }
});

// @desc   Get current user profile
// @route  GET /api/auth/profile
// @access Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});