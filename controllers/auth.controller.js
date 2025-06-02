import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendPasswordEmail } from "../utils/emailSender.js";

export const signup = async (req, res) => {
	try {
		const { name, email, password, phone } = req.body;

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ 
				success: false,
				message: "User already exists" 
			});
		}

		// Create new user with plain password
		const user = new User({
			name,
			email,
			password,
			phone
		});

		await user.save();

		// Create token
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d"
		});

		// Set cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			path: "/",
			domain: process.env.NODE_ENV === "production" 
				? (req.headers.origin?.includes('vercel.app') 
					? 'looksnlove-frontend.vercel.app' 
					: req.headers.origin?.includes('www.') 
						? 'www.looksnlove.co.in' 
						: 'looksnlove.co.in')
				: undefined
		});

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
		console.error("Error in signup: ", error.message);
		res.status(500).json({ 
			success: false,
			message: "Error creating user", 
			error: error.message 
		});
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Check if user exists
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ 
				success: false,
				message: "Invalid credentials" 
			});
		}

		// Direct password comparison
		if (password !== user.password) {
			return res.status(400).json({ 
				success: false,
				message: "Invalid credentials" 
			});
		}

		// Create token
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d"
		});

		// Set cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			path: "/",
			domain: process.env.NODE_ENV === "production" 
				? (req.headers.origin?.includes('vercel.app') 
					? 'looksnlove-frontend.vercel.app' 
					: req.headers.origin?.includes('www.') 
						? 'www.looksnlove.co.in' 
						: 'looksnlove.co.in')
				: undefined
		});

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
		console.error("Error in login controller:", error);
		res.status(500).json({ 
			success: false,
			message: "Error logging in", 
			error: error.message 
		});
	}
};

export const logout = (req, res) => {
	res.clearCookie("token");
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
				message: "Not authenticated" 
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.userId);

		if (!user) {
			return res.status(401).json({ 
				success: false,
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
		res.status(401).json({ 
			success: false,
			message: "Invalid token" 
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

		// Find user
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Email not registered"
			});
		}

		try {
			// Send account details email
			await sendPasswordEmail(user.email, user.password, user.phone);
			
			res.json({
				success: true,
				message: "Account details have been sent to your email"
			});
		} catch (emailError) {
			console.error("Error sending account details email:", emailError);
			return res.status(500).json({
				success: false,
				message: "Failed to send account details. Please try again later."
			});
		}

	} catch (error) {
		console.error("Forgot password error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to process request"
		});
	}
};
