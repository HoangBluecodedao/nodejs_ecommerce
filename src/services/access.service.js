'use strict'
const shopModel = require('../models/shop.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const KeyTokenService = require('./keyToken.service')
const { createTokenPair } = require('../auth/authUtils')
const { getInfoData } = require('../utils/index')
const { BadRequestError, ConflictRequestEror } = require('../core/error.response')

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN'
}

class AccessService {

    static signUp = async({name, email, password}) => {

        // try {

            // step 1: check if email exists
            const holderShop = await shopModel.findOne({email}).lean() // lean for faster search

            if (holderShop) {
                throw new BadRequestError('Error: Shop already registered!')
            }

            const passwordHash = await bcrypt.hash(password, 10)

            const newShop = await shopModel.create({
                name, email, password: passwordHash, roles: [RoleShop.SHOP]
            })
            
            if (newShop) {
                // create privateKey, publicKey
                const privateKey = crypto.randomBytes(64).toString('hex')
                const publicKey = crypto.randomBytes(64).toString('hex')
                
                console.log({ privateKey, publicKey })

                const keyStore = await KeyTokenService.createKeyToken({
                    userId: newShop._id,
                    publicKey,
                    privateKey
                })

                if (!keyStore) {
                    throw new BadRequestError('Error: Keystore already registered!')
                }

                // create token pair 
                const tokens = await createTokenPair({userId: newShop._id, email},  publicKey, privateKey)
                console.log(`Create tokens success::`, tokens)

                return {
                    code: 201,
                    metadata: {
                        shop: getInfoData({ fields: ['_id', 'name', 'email'], object: newShop}),
                        tokens
                    }
                }
            }

            return {
                code: 200,
                metadata: null
            }
    }
}

module.exports = AccessService