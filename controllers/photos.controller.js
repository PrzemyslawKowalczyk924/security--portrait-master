const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    //validation pattern for title & author
    const pattern = new RegExp(/(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/,
    "g");
    const validatedTitle = title.match(pattern).join('');
    const validatedAuthor = author.match(pattern).join('');
    
    if(validatedTitle < title.length && validatedAuthor < author.length) throw new Error("Invalid characters..."); 

    //validation patern for email
    const emailPattern = /\S+@\S+\.\S+/;
    const validatedEmail = emailPattern.test(email);
    if(!validatedEmail) throw new Error('Wrong email!');

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0]; // exercise 1
      const acceptedExt = ["gif", "jpg", "png", "jpg"]; // exercise 1
      if(acceptedExt.includes(fileExt) && author.length <= 50 && title.length <= 25) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        res.json('wrong file')
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    //add IP validation for vote
    const voter = await Voter.findOne({user: req.clientIp})

    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      if(voter) {
        if(voter.votes.includes(photoToUpdate._id)) {
          res.status(500).json({message: 'you can\'t vote again for the same photo'})
        } else {
          voter.votes.push(photoToUpdate._id);
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({message: 'OK'});
        }
      } else {
        const newVoter = new Voter({
          user: req.clientIp,
          votes: [ photoToUpdate._id ]
        });
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }
};
