import express from 'express';
import Contact from '../models/contact.model.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create new contact submission
router.post('/', async (req, res) => {
  try {
    const { name, phone, message, date, time } = req.body;
    // Log for debugging
    console.log("Received body:", req.body);

    if (!name || !phone || !message || !date || !time) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const contact = new Contact({
      name,
      phone,
      message,
      date,
      time,
    });

    await contact.save();
    res.status(201).json({ message: 'Contact saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});

// Get all contact submissions (admin only)
router.get('/admin', auth, isAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Update contact status (admin only)
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    contact.status = status;
    if (status === 'confirmed') {
      contact.hidden = true;
    }
    await contact.save();
    res.json(contact);
  } catch (err) {
    console.error('Error updating contact status:', err);
    res.status(500).json({ error: 'Failed to update contact status' });
  }
});

// Delete contact (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
