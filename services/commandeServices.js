const Commande = require('../models/commandModel'); // Adjust the path to your Commande model

// Create a new order
const createCommande = async (req, res) => {
    try {
        const commande = new Commande(req.body);
        await commande.save();
        res.status(201).json(commande);
    } catch (error) {
        console.error("Error creating commande:", error);
        res.status(500).json({ message: "Error creating commande", error: error.message });
    }
};

// Get all orders
const getAllCommandes = async (req, res) => {  
    try {
        const commandes = await Commande.find()
            .populate('utilisateur') // Populate user info
            .populate({
                path: 'panier.product', // Populate products in panier
                model: 'Product' // Assuming the model name is Product
            })
            .populate({
                path: 'panier.tailles', // Populate tailles in panier
                model: 'Taille' // Assuming the model name is Taille
            });

        // Prepare response with length and status
        const response = {
            status: 'success',
            length: commandes.length,
            data:  commandes
        
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching commandes:", error);
        res.status(500).json({ message: "Error fetching commandes", error: error.message });
    }
};

// Get a specific order by ID
const getCommandeById = async (req, res) => {
    const { id } = req.params; // Get ID from request parameters
    try {
        const commande = await Commande.findById(id).populate('utilisateur');
        if (!commande) {
            return res.status(404).json({ message: "Commande not found" });
        }
        res.status(200).json(commande);
    } catch (error) {
        console.error("Error fetching commande:", error);
        res.status(500).json({ message: "Error fetching commande", error: error.message });
    }
};

// Update an order
const updateCommande = async (req, res) => { 
    const { id } = req.params; // Get ID from request parameters
    const { etatLivraison, estPaye } = req.body; // Extract fields to update

    // Create an object to hold the updates
    const updateFields = {};
    if (etatLivraison !== undefined) {
        updateFields.etatLivraison = etatLivraison; // Update etatLivraison if provided
    }
    if (estPaye !== undefined) {
        updateFields.estPaye = estPaye; // Update estPaye if provided
    }

    try {
        const commande = await Commande.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true })
            .populate('utilisateur'); // Populate user info

        if (!commande) {
            return res.status(404).json({ message: "Commande not found" });
        }

        res.status(200).json(commande);
    } catch (error) {
        console.error("Error updating commande:", error);
        res.status(500).json({ message: "Error updating commande", error: error.message });
    }
};

// Delete an order
const deleteCommande = async (req, res) => {
    const { id } = req.params; // Get ID from request parameters
    try {
        const commande = await Commande.findByIdAndDelete(id);
        if (!commande) {
            return res.status(404).json({ message: "Commande not found" });
        }
        res.status(204).send(); // No content to return after deletion
    } catch (error) {
        console.error("Error deleting commande:", error);
        res.status(500).json({ message: "Error deleting commande", error: error.message });
    }
};

// Get an order by tracking code (codeSuivi)
const getCommandeByCodeSuivi = async (req, res) => { 
    const { codeSuivi } = req.params; // Get codeSuivi from request parameters
    try {
        const commande = await Commande.findOne({ codeSuivi })
            .populate({path: 'utilisateur',
                select: '-_id -password'}) // Populate only the 'name' field from utilisateur
            .populate({
                path: 'panier.product', // Populate products in panier
                model: 'Product', // Assuming the model name is Product
                select: '-_id' // Exclude the _id field from product
            })
            .populate({
                path: 'panier.tailles', // Populate tailles in panier
                model: 'Taille', // Assuming the model name is Taille
                select: '-_id' // Exclude the _id field from tailles
            })
            .lean(); // Convert the Mongoose document to a plain JavaScript object

        if (!commande) {
            return res.status(404).json({ message: "Commande not found with this tracking code" });
        }

        // Remove _id field from commande
        delete commande._id;
        // Prepare response
        const response = {
            status: 'success',
            length: commande ? 1 : 0, // Set length to 1 if commande is found
            data: commande
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching commande by tracking code:", error);
        res.status(500).json({ message: "Error fetching commande by tracking code", error: error.message });
    }
};
const getCommandesByUserId = async (req, res) => {
    const { userId } = req.params; // Get userId from request parameters
    try {
        const commandes = await Commande.find({ utilisateur: userId }) // Fetch commandes based on user ID
            .populate('utilisateur', 'name') // Populate only the user's name
            .populate({
                path: 'panier.product',
                model: 'Product',
                select: '-_id' // Exclude the _id from products
            })
            .populate({
                path: 'panier.tailles',
                model: 'Taille',
                select: '-_id' // Exclude the _id from tailles
            });

        if (!commandes.length) {
            return res.status(404).json({ message: "No commandes found for this user" });
        }
        
        res.status(200).json({ status: 'success', length: commandes.length, data: commandes });
    } catch (error) {
        console.error("Error fetching commandes by user ID:", error);
        res.status(500).json({ message: "Error fetching commandes by user ID", error: error.message });
    }
};
// Export all functions
module.exports = {
    createCommande,
    getAllCommandes,
    getCommandeById,
    getCommandesByUserId,
    updateCommande,
    deleteCommande,
    getCommandeByCodeSuivi, // Export the new function
};