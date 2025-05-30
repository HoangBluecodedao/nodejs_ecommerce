'use strict'
const shopModel = require('../models/shop.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const KeyTokenService = require('./keyToken.service')
const { createTokenPair, verifyJWT } = require('../auth/authUtils')
const { getInfoData } = require('../utils/index')
const { BadRequestError, ConflictRequestEror, AuthFailureError, ForbiddenError } = require('../core/error.response')
const { findByEmail } = require('./shop.service')

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN'
}

class AccessService {

    static handlerRefreshTokenV2 = async ( { keyStore, user, refreshToken} ) => {
        
        const { userId, email } = user; 

        if (keyStore.refreshTokensUsed.includes(refreshToken)) {
            await KeyTokenService.deleteKeyById( userId)
            throw new ForbiddenError('Something wrong happend!! Please re-login')

        }

        if (keyStore.refreshToken !== refreshToken) throw new AuthFailureError(' Shop not registered!!')
        
        const foundShop = await findByEmail({ email})
        if (!foundShop) throw new AuthFailureError(' Shop not registered!!')
        
        // create new tokens
        const tokens = await createTokenPair({ userId, email}, keyStore.publicKey, keyStore.privateKey)

        // update token
        await keyStore.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken
            }
        })

        return {
            user,
            tokens
        }
    }

    /*
        chick this token used?
    */
    static handlerRefreshToken = async ( refreshToken ) => {

        // check whether this token is used or not 
        const foundToken = await KeyTokenService.findByRefreshTokenUsed( refreshToken)
        if (foundToken) {
            // console.log(foundToken)
            // decode to detect who currently using this token 
            const {userId, email} = await verifyJWT( refreshToken, foundToken.privateKey)
            console.log({ userId, email})
            // if already in used then delete all token in keyStore
            await KeyTokenService.deleteKeyById( userId)
            throw new ForbiddenError('Something wrong happend!! Please re-login')
        }

        const holderToken = await KeyTokenService.findByRefreshToken( refreshToken )
        if (!holderToken) throw new AuthFailureError(' Shop not registered!!')
        console.log(`holderToken:: ${holderToken}`)
        // verify token
        const { userId, email} = await verifyJWT( refreshToken, holderToken.privateKey)
        console.log(`[2]--`, { userId, email})
        // check UserId
        const foundShop = await findByEmail({ email})
        if (!foundShop) throw new AuthFailureError(' Shop not registered!!')
        
        // create new tokens
        const tokens = await createTokenPair({ userId, email}, holderToken.publicKey, holderToken.privateKey)

        // update token
        await holderToken.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken
            }
        })

        return {
            user: { userId, email},
            tokens
        }
    }

    static logout = async(  keyStore ) => {
        const delKey = await KeyTokenService.removeKeyById( keyStore._id )
        console.log( {delKey})
        return delKey
    }

    /*
        1 - check email in dbs 
        2 - match password 
        3 - create AccessToken and RefreshToken and save
        4 - generate tokens 
        5 - get data return login
    */
    static login = async( { email, password, refreshToken = null}) => {
        

        // 1. check email in dbs
        const foundShop = await findByEmail({email})
        if (!foundShop) throw new BadRequestError('Shop not registered!')
        
        // 2. match password
        const match = bcrypt.compare( password, foundShop.password)
        if (!match) throw new AuthFailureError('Authentication error')
        
        // 3. create AccessToken and RefreshToken and save
        const privateKey = crypto.randomBytes(64).toString('hex')
        const publicKey = crypto.randomBytes(64).toString('hex')

        // 4. generate token
        const { _id: userId } = foundShop
        const tokens = await createTokenPair({ userId, email}, publicKey, privateKey)

        await KeyTokenService.createKeyToken({
            refreshToken: tokens.refreshToken,
            privateKey, publicKey, userId
        })
        return {
            shop: getInfoData({ fields: ['_id', 'name', 'email'], object: foundShop}),
            tokens
        }
    }


    static signUp = async({name, email, password}) => {

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