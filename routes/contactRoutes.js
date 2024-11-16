const express = require('express');
const router = express.Router();
const contactController = require('../services/contactServices');

// Post a contact message
router.post('/', contactController.createContact);

// Get all contact messages (admin view, optional)
router.get('/', contactController.getAllContacts);

module.exports = router;