const express = require('express');
const {
    createCommande,
    getAllCommandes,
    getCommandeById,
    updateCommande,
    deleteCommande,
    getCommandeByCodeSuivi,
    getCommandesByUserId,
} = require('../services/commandeServices'); // Adjust the path to your controller
const authService = require('../services/authService');
const router = express.Router();

// Create a new commande
router.route('/')
.get(
    authService.protect,
    authService.allowedTo('admin' ),
    getAllCommandes)
.post(
    authService.protect,
    authService.allowedTo('user','admin' ),
    createCommande)
;

router.route('/:id')
.get( authService.protect,
    authService.allowedTo('admin' ),
    getCommandeById)
.put(authService.protect,
    authService.allowedTo('admin' ), 
    updateCommande)
.delete( 
    authService.protect,
    authService.allowedTo('admin' ),
    deleteCommande);
;

router.route('/user/:userId')
.get(
    authService.protect,
    authService.allowedTo('user', 'admin'), // Adjust permissions as needed
    getCommandesByUserId // Call the new function
);

// Get a commande by tracking code (codeSuivi)
router.route('/suivi/:codeSuivi')
.get(authService.protect,
    authService.allowedTo('user','admin'),
     getCommandeByCodeSuivi); // Use a separate endpoint for tracking

module.exports = router;