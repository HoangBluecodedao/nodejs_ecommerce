'use strict'

const { SuccessResponse } = require('../core/success.response')
const ProductService = require('../services/product.service')
const ProductServiceV2 = require('../services/product.service.xxx')


class ProductController {

    createProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Product success!!',
            metadata: await ProductServiceV2.createProduct( 
                req.body.product_type, 
                {
                    ...req.body,
                    product_shop: req.user.userId
                }
            )
        }).send(res)

    }

    // update Product
    updateProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update Product success!!',
            metadata: await ProductServiceV2.updateProduct( req.body.product_type, req.params.productId, {
                ...req.body,
                product_shop: req.user.userId
            })
        }).send(res)

    }

    publishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'publishProductByShop success!!',
            metadata: await ProductServiceV2.publishProductByShop({
                product_id: req.params.id,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    unPublishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'publishProductByShop success!!',
            metadata: await ProductServiceV2.unPublishProductByShop({
                product_id: req.params.id,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    // QUERY //
    /**
     * @desc Get all Drafts for shop
     * @param {Number } limit
     * @param {Number } skip
     * @return {JSON} 
     */
    getAllDraftsForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list drafts success!!',
            metadata: await ProductServiceV2.findAllDraftsForShop({ product_shop: req.user.userId })
        }).send(res)
    }

    getAllPublishForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list publish success!!',
            metadata: await ProductServiceV2.findAllPublishForShop({ product_shop: req.user.userId })
        }).send(res)
    }

    getListSearchProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list publish success!!',
            metadata: await ProductServiceV2.searchProducts(req.params)
        }).send(res)
    }

    findAllProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'findAllProducts success!!',
            metadata: await ProductServiceV2.findAllProducts(req.query)
        }).send(res)
    }

    findProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'findProduct success!!',
            metadata: await ProductServiceV2.findProduct({
                product_id: req.params.product_id
            })
        }).send(res)
    }

    // END QUERY //


}

module.exports = new ProductController()