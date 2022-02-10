const express = require('express');
const router = express.Router();
const axios = require('axios');
const {Person} = require('../collections/person');
const {Profession} = require("../collections/profession"); 
router.get('/populate-mongo', async (req, res, next) => {
    let {data: persons} = await axios.get("https://raw.githubusercontent.com/dominictarr/random-name/master/names.json");
    let {data: professions} = await axios.get('https://raw.githubusercontent.com/dariusk/corpora/master/data/humans/occupations.json');
    professions = professions.occupations;
    professions = professions.map(p => ({
        name: p,
        salary: getRandomInt(6000, 30000),
        avgAge: getRandomInt(21, 120)
    }))
    await Profession.insertMany(professions)
    // persons = persons.map(p=>({
    //     name:p,
    //     age:getRandomInt(0,30),
    // }))
    for (let person of persons) {
        let hasProfession = getRandomInt(0, 3) > 1;
        if (hasProfession) {
            let pro = await Profession.find().limit(1).skip(getRandomInt(0, professions.length));
            pro = pro[0];
            Person.findOneAndUpdate({name: person}, {
                $set: {
                    name: person,
                    age: getRandomInt(21, 120),
                    profession: pro._id
                }
            }, {upsert: true}).then()
        } else {
            Person.findOneAndUpdate({name: person}, {
                $set: {
                    name: person,
                    age: getRandomInt(21, 120),
                    profession: null
                }
            }, {upsert: true}).then()
        }

    }

    return res.json({code: 200})

});
router.get('/', async (req, res) => {
    let p = await Person.findOne(); 
    return res.json({code: 200, data: p}) 
})

function getRandomInt(min, max) {  
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

router.get('/', async (req, res) => {
    let person = await Person.findOne();
    let profession = await Profession.findOne();
    return res.json({code: 200, data: {person, profession}})
})

//===================//
router.get('/a', async(req, res) =>{
    let person = await Person.find( { profession : null } );
    let avgPersons = await person.aggregate( [ { $group : { '_id': null}, 'avg': { $avg: '$age'} }])
    return res.json({code: 200, data: {person,avgPersons}})
})

router.get('/b', async(req, res) => {
    let profession = await Profession.findOne({}).sort({ salary : -1 }).limit(1)
    let persons = await Person.find({ profession  : profession._id })
    let numPersons = persons.length
    return res.json({code: 200, data: profession, numPersons})
})

router.get('/c', async(req, res) => {
    let salary = await Profession.find({}).sort( { salary : -1 }).limit(5)
    return res.json({code: 200, data: {salary}})
})

router.get('/d', async(req, res) => {
    let ages = await Person.distinct("age")
    return res.json({code: 200, data: {ages}})
})

router.patch('/e', async(req, res) => {
    let person = await Person.findOne( { name: req.body.name})
    let profession
    if (person.profession)
         profession = await Profession.findOneAndUpdate({_id : person.profession},  {salary:req.body.salary}, {new:true})
    return res.json({code: 200, data: {person, profession }})
})
  
///////////////////

var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
const multer = require('multer')
const requsetIp = require('request-ip')

///////////appendToFile////////

let date_ob = new Date();

router.get('/ip', async(req, res) =>{
    let ip = requsetIp.getClientIp(req)
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let time = hours + ":" + minutes + ":" + seconds

    fs.appendFile('file.txt', ip + " " + time + '\r\n', (err, data) => {
        if(err) {
            throw err;
        }
      return res.json({code: 200, data: {ip }})
    })
})

/////upload image//////
const imageStorage = multer.diskStorage({
    // Destination to store image     
    destination: 'public/', 
      filename: (req, file, cb) => {
          cb(null, file.fieldname + '_' + Date.now() 
             + path.extname(file.originalname))
            // file.fieldname is name of the field (image)
            // path.extname get the uploaded file extension
    }
});

const imageUpload = multer({
    storage: imageStorage,
    limits: {
      fileSize: 1000000 // 1000000 Bytes = 1 MB
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(png|jpg)$/)) { 
         // upload only png and jpg format
         let ip = requsetIp.getClientIp(req)
         fs.appendFile('file.txt', ip + " " + file.originalname + '\r\n', (err, data) => {
            if(err) {
                throw err;
            }
        })
         return cb(new Error('Please upload a Image'))
       }
     cb(undefined, true)
  }
}) 

// For Single image upload
router.post('/uploadImage', imageUpload.single('image'), (req, res) => {
    res.send(req.file)
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

module.exports = router;
