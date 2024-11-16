const Contact = require("../models/contact");


// Create a new contact message
const createContact = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newContact = new Contact({
      name,
      email,
      message,
    });

    await newContact.save();
    return res.status(201).json(newContact);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all contact messages (for admin or viewing history)
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json(contacts);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createContact,
  getAllContacts,
};