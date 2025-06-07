import mongoose from "mongoose";

const connectDB = async () => {
	try {
		if (!process.env.MONGO_URI) {
			throw new Error('MONGO_URI is not defined in environment variables');
		}

		const conn = await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});

		console.log(`MongoDB connected: ${conn.connection.host}`);

		// Handle connection events
		mongoose.connection.on('error', (err) => {
			console.error('MongoDB connection error:', err);
		});

		mongoose.connection.on('disconnected', () => {
			console.log('MongoDB disconnected');
		});

		mongoose.connection.on('reconnected', () => {
			console.log('MongoDB reconnected');
		});

		// Handle process termination
		process.on('SIGINT', async () => {
			try {
				await mongoose.connection.close();
				console.log('MongoDB connection closed through app termination');
				process.exit(0);
			} catch (err) {
				console.error('Error during MongoDB connection closure:', err);
				process.exit(1);
			}
		});

	} catch (error) {
		console.error('Error connecting to MongoDB:', {
			message: error.message,
			code: error.code,
			name: error.name,
			stack: error.stack
		});
		process.exit(1);
	}
};

export default connectDB;