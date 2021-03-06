const mongoose = require('mongoose');
const slug = require('slugs');

mongoose.Promise = global.Promise;
const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trime: true,
        required: 'Please enter a store name'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created:{
        type: Date,
        default: Date.now
    },
    location: {
        type:{
            type: String,
            default: 'Point'    
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address:{
            type: String,
            required: 'You must apply an address!'
        }
    },
    photo: String,
    author:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
});

// Define our index
storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({
    location: '2dsphere'
});

storeSchema.pre('save',async function(next){
    if(!this.isModified('name')){
        next(); // skiip
        return; // stop this function from runnning
    }
    this.slug = slug(this.name);
    // find other store that have same slug
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({
        slug: slugRegEx
    });
    if(storesWithSlug.length){
        this.slug = `${this.slug}-${storesWithSlug.length+1}`;
    }

    next();
    // TODO: make more resiliant so slugs are unique
})

storeSchema.statics.getTagsList = function() {
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 }}},
        { $sort: {count: -1 }}
    ]);
}

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        //Look up and populate
        { $lookup: 
            {
                from: 'reviews', 
                localField: '_id', 
                foreignField: 'store', 
                as: 'reviews' 
            }
        },
        //Filter only 2 or more reviews store
        { $match:
            {
                'reviews.1': {
                    $exists: true
                }
            }
        },
        //Add the average
        { $project:
            {
                photo: '$$ROOT.photo',
                name: '$$ROOT.name',
                reviews: '$$ROOT.reviews',
                slug: '$$ROOT.slug',
                averageRating: {
                    $avg: '$reviews.rating'
                }
            }
        },
        //Sort by new field, highest first
        { $sort: 
            {
                averageRating: -1
            }
        },
        //Limit to 10
        { $limit: 10 }
    ]);
}

storeSchema.virtual('reviews',{
    ref: 'Review',
    localField: '_id',
    foreignField: 'store'
});

function autoPopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find',autoPopulate);
storeSchema.pre('findOne',autoPopulate);

module.exports = mongoose.model('Store',storeSchema);