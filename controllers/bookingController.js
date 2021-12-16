const Stripe=require('stripe');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const Booking=require('../models/bookingModel');

exports.getCheckoutSession=catchAsync(async(req,res,next)=>{

    const tour=await Tour.findById(req.params.tourId);
    console.log('TEst');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    console.log(`${req.protocol}://${req.get('host')}/my-tours`);
    const session =await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        // success_url:`${req.protocol}://${req.get('host')}/?tour=${
        //     req.params.tourId}&user=${req.user.id}&price=${tour.price}`

        success_url:`${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url:`${req.protocol}:${req.get('host')}/tour/${tour.slug}`,
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
const createBookingCheckout =async session=>{
    await Booking.create({tour , user, price});
    const tour=session.client_reference_id;
    const user=(await User.findOne({email:session.customer_email})).id;
    const price=session.line_items[0].amount/100;
    
}


// exports.createBookingCheckOut=catchAsync(async(req,res,next)=>{
//     const {tour,user,price}=req.query;
//     if(!tour && !user && !price)return next();
//     await Booking.create({tour,user,price});

//     res.redirect(req.originalUrl.split('?')[0]);
// });

exports.webhookCheckout=(req,res,next)=>{
    const signature = req.headers['stripe-signature'];
    let event;
    try{
     event =Stripe.webhooks.constructEvent(req.body,signature,
        process.env.STRIPE_WEBHOOK_SECRET);

    }
    catch(err){
        return res.status(400).send(`Webhook error:${err.message}`)
    }

    if(event.type==='checkout.session.completed'){
        createBookingCheckout(event.data.object);
       
    }
    res.status(200).json({recieved:true});
};