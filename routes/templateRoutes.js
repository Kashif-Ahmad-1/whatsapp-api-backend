const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const Template = require('../models/Template');
const {authenticate} = require('../middleware/authenticate')
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Function to upload image to Cloudinary
const uploadImageToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
        const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        const stream = cloudinary.uploader.upload_stream({ resource_type: resourceType, }, (error, result) => {
            if (error) {
                reject("Image upload failed");
            } else {
                resolve(result.secure_url);
            }
        });
        stream.end(file.buffer);
    });
};

// Function to generate a short unique ID
const generateShortId = (length) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Create a template
router.post('/', authenticate, upload.array('images'), async (req, res) => {
    try {
        const { text } = req.body;
        const userId = req.user.id; // Get the authenticated user's ID

        const imageUrls = await Promise.all(req.files.map(file => uploadImageToCloudinary(file)));
        const templateId = generateShortId(8);

        const newTemplate = new Template({ templateId, text, imageUrls, userId }); // Store userId
        await newTemplate.save();
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create template" });
    }
});


// Retrieve all templates

router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id; // Get the authenticated user's ID
        const templates = await Template.find({ userId }); // Filter templates by userId
        res.json(templates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve templates" });
    }
});


// Retrieve a specific template by ID

router.get('/:templateId', authenticate, async (req, res) => {
    const { templateId } = req.params;
    try {
        const template = await Template.findOne({ templateId });

        if (template) {
            if (template.userId.toString() !== req.user.id) {
                return res.status(403).json({ message: "Access Denied. You do not own this template." });
            }
            return res.json(template);
        } else {
            return res.status(404).json({ error: "Template not found." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve template." });
    }
});

// Delete a template by ID
router.delete('/:templateId', authenticate, async (req, res) => {
    const { templateId } = req.params;
    try {
        const template = await Template.findOne({ templateId });

        if (!template) {
            return res.status(404).json({ error: "Template not found." });
        }

        if (template.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access Denied. You do not own this template." });
        }

        await Template.findOneAndDelete({ templateId });
        return res.status(200).json({ message: "Template deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete template." });
    }
});


module.exports = router;
