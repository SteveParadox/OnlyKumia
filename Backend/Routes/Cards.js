import express from "express";
const router = express.Router();
import UploadModel from '../DB/Upload.js';

// POST /cards -> created as mounted router at /cards -> POST /cards
router.post('/', async (req, res) => {
    try {
        const payload = req.body;
        const created = await UploadModel.create(payload);
        res.status(201).send(created);
    } catch (err) {
        res.status(500).send(err.message || err);
    }
});

// GET /cards -> mounted at /cards -> GET /cards
router.get('/', async (req, res) => {
    try {
        const data = await UploadModel.find();
        res.status(200).send(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

export default router;
