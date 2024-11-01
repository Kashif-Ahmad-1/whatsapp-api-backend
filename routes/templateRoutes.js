const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const Template = require('../models/Template');

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
router.post('/', upload.array('images'), async (req, res) => {
    try {
        const { text } = req.body;

        // Upload all images and gather their URLs
        const imageUrls = await Promise.all(req.files.map(file => uploadImageToCloudinary(file)));

        // Generate a unique template ID (8 characters long)
        const templateId = generateShortId(8);

        const newTemplate = new Template({ templateId, text, imageUrls }); // Store imageUrls as an array
        await newTemplate.save(); // Save to MongoDB
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create template" });
    }
});

// Retrieve all templates
router.get('/', async (req, res) => {
    try {
        const templates = await Template.find();
        res.json(templates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve templates" });
    }
});

// Retrieve a specific template by ID
router.get('/:templateId', async (req, res) => {
    const { templateId } = req.params;
    try {
        const template = await Template.findOne({ templateId });
        
        if (template) {
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
router.delete('/:templateId', async (req, res) => {
    const { templateId } = req.params;
    try {
        const result = await Template.findOneAndDelete({ templateId });

        if (result) {
            return res.status(200).json({ message: "Template deleted successfully." });
        } else {
            return res.status(404).json({ error: "Template not found." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete template." });
    }
});

module.exports = router;
