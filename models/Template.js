const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    templateId: { type: String, required: true, unique: true }, // Custom ID for the template
    text: { type: String, required: true },
    imageUrls: { type: [String] }, // Change to an array of strings
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' } 
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;
