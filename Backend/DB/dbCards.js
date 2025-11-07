import mongoose from 'mongoose';

const cardSchema = mongoose.Schema({
    name: { type: String, index: true },
    imgUrl: String,
    // userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
});

export default mongoose.model('Images', cardSchema);
