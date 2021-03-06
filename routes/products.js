const {Product} = require('../models/product');
const express = require('express');
const mongoose = require('mongoose');
const { Category } = require('../models/category');
const multer = require('multer');
const router = express.Router();

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if(isValid) {
            uploadError = null
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {

        const fileName = file.originalname.split('').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null,`${fileName}${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage })

router.get(`/`, async (req, res) =>{
    let filter = {};
    if(req.query.categories) {
        filter = { category:req.query.categories.split(',')}
    }
    const productList = await Product.find(filter).populate('category');

    if(!productList) {
        return res.status(500).json({success: false})
    } 
    return res.send(productList);
});

router.get('/:id', async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const product = await Product.findById(req.params.id).populate({path: 'category',select: 'name'});
    if (!product) {
        return res.status(500).json({ success: false, message: "The category with the given ID was not found."});
    }

    return res.status(200).send(product);
})

router.post(`/`, uploadOptions.single('image'), async (req, res) =>{
     const category = await Category.findById(req.body.category);
     if(!category) return res.status(400).send('Invalid Category')
 
     const file = req.file;
     if(!file) return res.status(400).send('No image in the request')

     const fileName = file.filename;
     const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,//"http://localhost:3000/public/upload/image-23232322"
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.tating,
        numReviews: req.body.nmReviews,
        isFeatured: req.body.isFeatured
    })

    product = await product.save();

    if(!product)
    return res.status(500).send('The product cannot be created');

    return res.send(product);   
});

router.put('/:id',async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }

    const category = await Category.findById(req.body.category);
     if(!category) return res.status(400).send('Invalid Category');

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.tating,
            numReviews: req.body.nmReviews,
            isFeatured: req.body.isFeatured
        },
        {
            new: true,
        }
    )

    if(!product) return res.status(400).send('the product cannot be updated!');

    return res.send(product);
});

router.delete('/:id', async(req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }

    const product = await Product.findByIdAndRemove(req.params.id);
    if(!product) {
        return res.status(404).json({success:false,message: 'product not found!'})
    }

    return res.status(200).json({success:true,message: 'the product is deleted!'})
    
});

router.get(`/get/count`,async (req, res) => {
    const productCount = await Product.countDocuments()

    if(!productCount) {
        return res.status(500).json({success: false})
    }

    return res.send({
        productCount: productCount
    })
});

router.get(`/get/featured/:count`,async (req, res) => {
    const count = req.params.count ? req.params.count : 0

    const products = await Product.find({isFeatured: true}).limit(+count);
    

    if(!products) {
        return res.status(500).json({success: false})
    }
    return res.send(products)
});

router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id')
        }
        const files = req.files
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        if(files) {
            files.map(file => {
                imagesPaths.push(`${basePath}${file.filename}`);
            })
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths
            },
            {new: true}
        )

        if(!product)
              return res.status(500).send('the gallery cannot be updated!')

              return res.send(product);
    }
)

module.exports =router;