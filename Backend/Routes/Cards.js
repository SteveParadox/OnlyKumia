import express from "express";
const router = express.Router();
import dbCard from '../DB/Upload.js';

router.post('/cards', (req, res) => {
    const dbCard = req.body;

    Cards.create(dbCard, (err, data) =>{
        if (err) {
            res.status(500).send(err)

        } else{
            res.status(201).send(data)
        }
    })

});

router.get('/cards', async (req, res) => {
    try {
        const data = await dbCard.find();
        res.status(200).send(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


export default router;
