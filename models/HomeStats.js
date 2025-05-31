import mongoose from 'mongoose';

const homeStatsSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
    default: 4.8,
    min: 0,
    max: 5
  },
  services: {
    type: Number,
    required: true,
    default: 200,
    min: 0
  },
  experience: {
    type: Number,
    required: true,
    default: 3,
    min: 0
  },
  members: {
    type: Number,
    required: true,
    default: 12,
    min: 0
  }
}, {
  timestamps: true
});

// Ensure only one document exists
homeStatsSchema.statics.getStats = async function() {
  let stats = await this.findOne();
  if (!stats) {
    stats = await this.create({});
  }
  return stats;
};

const HomeStats = mongoose.model('HomeStats', homeStatsSchema);

export default HomeStats; 