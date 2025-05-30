'use strict'

const {model, Schema, Types } = require('mongoose'); // Erase if already required

const DOCUMENT_NAME = 'Inventory'
const COLLECTION_NAME = 'Inventories'

// Declare the Schema of the Mongo model
var inventorySchema = new Schema({
    inven_productId: { type: Schema.Types.ObjectId, ref: 'Product'},
    inven_location: {type: String, default: 'unKnowned'},
    inven_stock: { type: Number, required: true},
    inven_shopId: { type: Schema.Types.ObjectId, ref: 'Shop'},
    inven_reservations: { type: Array, default: []}
    /*
        cardId: ,
        stock: 1,
        createdOn: 
    */
}, {
    collection: COLLECTION_NAME,
    timestamps: true
});

//Export the model
module.exports = model(DOCUMENT_NAME, inventorySchema);