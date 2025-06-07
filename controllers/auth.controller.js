import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendPasswordEmail } from "../utils/emailSender.js";

// Basic cookie options
const cookieOptions = {
	httpOnly: true,
	secure: true, // Always true for production
	sameSite: 'none', // Required for cross-site cookies
	path: "/",
	domain: '.looksnlove.co.in', // Your domain
	maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const signup = async (req, res) => {
	try {
		const { name, email, password, phone } = req.body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ 
				success: false,
				message: "User already exists" 
			});
		}

		const user = new User({ name, email, password, phone });
		await user.save();

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d"
		});
		res.cookie("token", token, cookieOptions);

		res.status(201).json({
			success: true,
			message: "User created successfully",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Signup error:', error);
		res.status(500).json({ 
			success: false,
			message: "Error creating user",
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user || password !== user.password) {
			return res.status(400).json({ 
				success: false,
				message: "Invalid credentials" 
			});
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d"
		});
		res.cookie("token", token, cookieOptions);

		res.json({
			success: true,
			message: "Logged in successfully",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ 
			success: false,
			message: "Error logging in",
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

export const logout = (req, res) => {
	res.clearCookie("token", cookieOptions);
	res.json({ 
		success: true,
		message: "Logged out successfully" 
	});
};

export const checkAuth = async (req, res) => {
	try {
		const token = req.cookies.token;
		if (!token) {
			return res.status(401).json({ 
				success: false,
				isAuthenticated: false,
				message: "Not authenticated"
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.userId);

		if (!user) {
			res.clearCookie("token", cookieOptions);
			return res.status(401).json({ 
				success: false,
				isAuthenticated: false,
				message: "User not found"
			});
		}

		res.json({
			success: true,
			isAuthenticated: true,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Check auth error:', error);
		res.clearCookie("token", cookieOptions);
		res.status(401).json({ 
			success: false,
			isAuthenticated: false,
			message: "Not authenticated",
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ 
				success: false,
				message: "Email is required" 
			});
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ 
				success: false,
				message: "Email not registered" 
			});
		}

		await sendPasswordEmail(user.email, user.password, user.phone);
		res.json({ 
			success: true,
			message: "Account details have been sent to your email" 
		});
	} catch (error) {
		console.error('Forgot password error:', error);
		res.status(500).json({ 
			success: false,
			message: "Failed to process request",
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};
