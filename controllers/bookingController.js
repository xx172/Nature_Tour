const Stripe=require('stripe');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const Booking=require('../models/bookingModel');
exports.getCheckoutSession=catchAsync(async(req,res,next)=>{

    const tour=await Tour.findById(req.params.tourId);
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session =await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        success_url:`${req.protocol}://${req.get('host')}/?tour=${
            req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email:req.user.email,
        client_reference_id:req.params.tourId,
        line_items:[
            {
                name:`${tour.name} Tour`,
                description:tour.summary,
                images:[`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount:tour.price *100,
                currency:'usd',
                quantity:1
            }
        ]

    });
    res.status(200).json({
        status:'success',
        data:session
    });
});

exports.createBookingCheckOut=catchAsync(async(req,res,next)=>{
    const {tour,user,price}=req.query;
    if(!tour && !user && !price)return next();
    await Booking.create({tour,user,price});

    res.redirect(req.originalUrl.split('?')[0]);
});